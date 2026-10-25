import { json, requireOwner, ApiError } from "../server/admin.js";
import { customerFailure, readJson } from "../server/customerAuth.js";
import { db } from "../server/db.js";
import { orderStatuses } from "../src/lib/customer.js";
import { rateLimit, updateOrder } from "../server/commerce.js";
export async function POST(request: Request) {
  try {
    const owner = await requireOwner(request);
    await rateLimit(`orders:${owner}`, 90);
    const data = await readJson(request);
    const sql = db();
    if (data.action === "list") {
      const status =
        typeof data.status === "string" &&
        orderStatuses.includes(data.status as never)
          ? data.status
          : "";
      const search =
        typeof data.search === "string" ? data.search.trim().slice(0, 40) : "";
      return json({
        orders:
          await sql`SELECT * FROM tf_orders WHERE (${status}='' OR status=${status}) AND (${search}='' OR reference ILIKE ${"%" + search + "%"}) ORDER BY created_at DESC LIMIT 100`,
      });
    }
    return json({ order: await updateOrder(data, owner) });
  } catch (e) {
    return customerFailure(e);
  }
}
