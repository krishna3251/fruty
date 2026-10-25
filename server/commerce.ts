import { createHash, randomUUID } from "node:crypto";
import { db } from "./db.js";
import { ApiError } from "./admin.js";
import type { PickleProduct } from "../src/data/pickles.js";
import { businessDefaults } from "../src/lib/business.js";
import {
  validateCart,
  orderStatuses,
  plain,
  snapshotItems,
  orderMessage,
  validateAddress,
  validateSettings,
  uuid,
  type CartItems,
  type Address,
} from "../src/lib/customer.js";
import { readCatalogue } from "./catalogue.js";
function checked<T>(validate: () => T): T {
  try {
    return validate();
  } catch (e) {
    throw new ApiError(
      400,
      e instanceof Error ? e.message : "Check the submitted details.",
    );
  }
}
export async function rateLimit(key: string, max = 30) {
  const sql = db();
  const rows =
    await sql`INSERT INTO tf_rate_limits(key,hits,expires_at) VALUES(${key},1,now()+interval '10 minutes')
 ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN tf_rate_limits.expires_at<now() THEN 1 ELSE tf_rate_limits.hits+1 END,
 expires_at=CASE WHEN tf_rate_limits.expires_at<now() THEN now()+interval '10 minutes' ELSE tf_rate_limits.expires_at END RETURNING hits`;
  if (rows[0].hits > max)
    throw new ApiError(
      429,
      "Too many attempts. Please try again in ten minutes.",
    );
  // Cleanup only expired counters, with bounded probability, not a background service.
  if (Math.random() < 0.01)
    await sql`DELETE FROM tf_rate_limits WHERE expires_at<now()-interval '1 day'`;
}
export function requestRateKey(request: Request) {
  // Vercel supplies this header; local fallback is shared, never trust client customer IDs.
  const ip = request.headers.get("x-vercel-forwarded-for") || "shared";
  return createHash("sha256")
    .update(ip + new Date().toISOString().slice(0, 10))
    .digest("hex");
}
export async function customerRecord(identity: {
  userId: string;
  name: string;
  email: string | null;
}) {
  const sql = db();
  const rows =
    await sql`INSERT INTO tf_customers(clerk_user_id,name,verified_email) VALUES(${identity.userId},${identity.name},${identity.email})
 ON CONFLICT(clerk_user_id) DO UPDATE SET name=excluded.name,verified_email=excluded.verified_email,updated_at=now() RETURNING id,name,verified_email,phone,created_at`;
  return rows[0];
}
export async function publicSettings() {
  const rows = await db()`SELECT data,version FROM tf_business WHERE id=true`;
  return rows.length
    ? { settings: validateSettings(rows[0].data), version: rows[0].version }
    : { settings: businessDefaults, version: 0 };
}
export async function saveSettings(value: unknown, version: unknown) {
  const settings = checked(() => validateSettings(value));
  if (!Number.isInteger(version))
    throw new ApiError(400, "Reload settings before saving.");
  const rows =
    await db()`INSERT INTO tf_business(id,data,version) VALUES(true,${JSON.stringify(settings)}::jsonb,1)
 ON CONFLICT(id) DO UPDATE SET data=excluded.data,version=tf_business.version+1 WHERE tf_business.version=${version as number} RETURNING data,version`;
  if (!rows.length)
    throw new ApiError(409, "Business settings changed. Reload before saving.");
  return { settings: rows[0].data, version: rows[0].version };
}
export async function syncCart(
  customerId: string,
  items: unknown,
  version: unknown,
  mergeId?: unknown,
  catalogue?: PickleProduct[],
) {
  const products = catalogue || (await readCatalogue()).products;
  const valid = checked(() => validateCart(items, products));
  if (
    !Number.isInteger(version) ||
    Number(version) < 0 ||
    (mergeId !== undefined && !uuid(mergeId))
  )
    throw new ApiError(400, "Check the cart revision.");
  const rows =
    await db()`SELECT * FROM tf_sync_cart(${customerId}::uuid,${JSON.stringify(valid)}::jsonb,${version as number},${mergeId || null}::uuid)`;
  return rows[0] as { items: CartItems; version: number };
}
export async function accountData(customerId: string) {
  const sql = db();
  const [addresses, cart, orders] = await sql.transaction([
    sql`SELECT id,data FROM tf_addresses WHERE customer_id=${customerId}::uuid ORDER BY updated_at DESC`,
    sql`SELECT items,version FROM tf_carts WHERE customer_id=${customerId}::uuid`,
    sql`SELECT reference,items,subtotal,delivery,total,status,payment_status,created_at FROM tf_orders WHERE customer_id=${customerId}::uuid ORDER BY created_at DESC LIMIT 50`,
  ]);
  return {
    addresses: addresses.map((a) => ({ ...a.data, id: a.id })),
    cart: cart[0] || { items: {}, version: 0 },
    orders,
  };
}
export async function saveAddress(customerId: string, value: unknown) {
  const address = checked(() => validateAddress(value));
  const { id, ...data } = address;
  const rows =
    await db()`SELECT tf_save_address(${customerId}::uuid,${id || null}::uuid,${JSON.stringify(data)}::jsonb) id`;
  return { ...data, id: rows[0].id };
}
export async function deleteAddress(customerId: string, id: unknown) {
  if (!uuid(id)) throw new ApiError(400, "Invalid address reference.");
  const rows =
    await db()`DELETE FROM tf_addresses WHERE id=${id}::uuid AND customer_id=${customerId}::uuid RETURNING id`;
  if (!rows.length) throw new ApiError(404, "Address not found.");
}
export async function deleteCustomer(customerId: string) {
  const sql = db();
  // Lock the customer before removing related records, so concurrent FK inserts
  // settle before deletion or fail after it. Clerk identity has separate controls.
  await sql.transaction([
    sql`SELECT id FROM tf_customers WHERE id=${customerId}::uuid FOR UPDATE`,
    sql`DELETE FROM tf_orders WHERE customer_id=${customerId}::uuid`,
    sql`DELETE FROM tf_customers WHERE id=${customerId}::uuid`,
  ]);
}
export async function createEnquiry(
  data: Record<string, unknown>,
  customerId: string | null,
  catalogue?: PickleProduct[],
) {
  if (!uuid(data.requestId))
    throw new ApiError(400, "Invalid enquiry request. Try reviewing again.");
  const customer = checked(() => validateAddress(data.customer));
  const products = catalogue || (await readCatalogue()).products;
  const items = checked(() => snapshotItems(data.items as CartItems, products));
  const subtotal =
    Math.round(items.reduce((n, i) => n + i.price * i.quantity, 0) * 100) / 100;
  const reference = `TF-${randomUUID().slice(0, 8).toUpperCase()}`;
  // ON CONFLICT never exposes someone else's enquiry. Compare request payload and ownership.
  const rows =
    await db()`INSERT INTO tf_orders(reference,request_id,customer_id,customer,items,subtotal,history)
 VALUES(${reference},${data.requestId}::uuid,${customerId}::uuid,${JSON.stringify(customer)}::jsonb,${JSON.stringify(items)}::jsonb,${subtotal},${JSON.stringify([{ status: "enquiry_initiated", at: new Date().toISOString() }])}::jsonb)
 ON CONFLICT(request_id) DO UPDATE SET request_id=tf_orders.request_id
 WHERE tf_orders.customer_id IS NOT DISTINCT FROM ${customerId}::uuid AND tf_orders.customer=${JSON.stringify(customer)}::jsonb AND tf_orders.items=${JSON.stringify(items)}::jsonb
 RETURNING reference,customer,items,subtotal`;
  if (!rows.length)
    throw new ApiError(409, "The enquiry details changed. Review them again.");
  const row = rows[0];
  const { settings } = await publicSettings();
  const message = orderMessage({
    reference: row.reference,
    customer: row.customer as Address,
    items: row.items,
    subtotal: Number(row.subtotal),
  });
  const url = /^91[6-9]\d{9}$/.test(settings.whatsapp)
    ? `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(message)}`
    : null;
  return {
    reference: row.reference,
    message,
    url,
    subtotal: Number(row.subtotal),
    items: row.items,
    delivery: null,
    total: null,
    status: "enquiry_initiated",
  };
}

export async function updateOrder(
  data: Record<string, unknown>,
  owner: string,
) {
  const sql = db();
  if (
    data.action !== "update" ||
    !uuid(data.id) ||
    !Number.isInteger(data.version) ||
    !orderStatuses.includes(data.status as never)
  )
    throw new ApiError(400, "Check the enquiry update.");
  const status = data.status as string;
  const delivery = data.delivery;
  if (
    delivery !== null &&
    (typeof delivery !== "number" ||
      !Number.isFinite(delivery) ||
      delivery < 0 ||
      delivery > 100000 ||
      Math.abs(Math.round(delivery * 100) - delivery * 100) > 1e-6)
  )
    throw new ApiError(400, "Check the delivery charge.");
  if (
    ["confirmed", "preparing", "dispatched", "delivered"].includes(status) &&
    delivery === null
  )
    throw new ApiError(
      400,
      "Confirm the delivery charge before confirming this order.",
    );
  const method = checked(() =>
    plain(data.paymentMethod, "payment method", 2, 80),
  );
  if (!["unpaid", "paid", "refunded"].includes(data.paymentStatus as string))
    throw new ApiError(400, "Check payment status.");
  const rows =
    await sql`UPDATE tf_orders SET status=${status},delivery=${delivery as number | null},total=CASE WHEN ${delivery as number | null}::numeric IS NULL THEN NULL ELSE subtotal+${delivery as number | null} END,
 payment_method=${method},payment_status=${data.paymentStatus as string},version=version+1,updated_at=now(),
 history=history || ${JSON.stringify([{ status, delivery, paymentMethod: method, paymentStatus: data.paymentStatus, by: owner, at: new Date().toISOString() }])}::jsonb
 WHERE id=${data.id}::uuid AND version=${data.version as number} RETURNING *`;
  if (!rows.length)
    throw new ApiError(409, "This enquiry changed. Reload before saving.");
  return rows[0];
}
