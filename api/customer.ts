import { json, ApiError } from "../server/admin.js";
import {
  customerIdentity,
  readJson,
  customerFailure,
} from "../server/customerAuth.js";
import {
  customerRecord,
  accountData,
  syncCart,
  saveAddress,
  deleteAddress,
  deleteCustomer,
  rateLimit,
} from "../server/commerce.js";
export async function POST(request: Request) {
  try {
    const identity = await customerIdentity(request);
    if (!identity) throw new ApiError(401, "Sign in first.");
    await rateLimit(`customer:${identity.userId}`, 90);
    const data = await readJson(request);
    const customer = await customerRecord(identity);
    if (data.action === "load")
      return json({ profile: customer, ...(await accountData(customer.id)) });
    if (data.action === "cart")
      return json(
        await syncCart(customer.id, data.items, data.version, data.mergeId),
      );
    if (data.action === "save-address")
      return json({ address: await saveAddress(customer.id, data.address) });
    if (data.action === "delete-address") {
      await deleteAddress(customer.id, data.id);
      return json({ deleted: true });
    }
    if (
      data.action === "delete-data" &&
      data.confirm === "DELETE MY STORE DATA"
    ) {
      await deleteCustomer(customer.id);
      return json({ deleted: true });
    }
    throw new ApiError(400, "Choose a valid account action.");
  } catch (e) {
    return customerFailure(e);
  }
}
