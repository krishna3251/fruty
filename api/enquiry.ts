import { json, ApiError } from "../server/admin.js";
import {
  customerIdentity,
  readJson,
  customerFailure,
  trustedOrigin,
} from "../server/customerAuth.js";
import {
  customerRecord,
  createEnquiry,
  rateLimit,
  requestRateKey,
} from "../server/commerce.js";
export async function POST(request: Request) {
  try {
    trustedOrigin(request);
    await rateLimit(`enquiry:${requestRateKey(request)}`, 12);
    const data = await readJson(request);
    if (data.website) throw new ApiError(400, "Please try again.");
    const identity = await customerIdentity(request, true);
    const customer = identity ? await customerRecord(identity) : null;
    return json(await createEnquiry(data, customer?.id || null));
  } catch (e) {
    return customerFailure(e);
  }
}
