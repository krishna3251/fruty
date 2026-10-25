import { requireOwner, json, apiFailure, ApiError } from "../server/admin.js";
import { readCatalogue, writeCatalogue } from "../server/catalogue.js";
import { readJson } from "../server/requestBody.js";
import { validateProduct } from "../src/lib/catalogue.js";
export async function GET() {
  try {
    return json(await readCatalogue());
  } catch (error) {
    return apiFailure(error);
  }
}
export async function POST(request: Request) {
  try {
    await requireOwner(request);
    const data = await readJson(request, 20000);
    const current = await readCatalogue();
    if (data.action === "unlock") return json(current);
    let product;
    try {
      product = validateProduct(data.product);
    } catch (error) {
      throw new ApiError(400, (error as Error).message);
    }
    if (data.revision !== current.revision)
      throw new ApiError(
        409,
        "The catalogue changed. Reload the panel before saving.",
      );
    if (
      data.action === "create" &&
      current.products.some((p) => p.id === product.id)
    )
      throw new ApiError(409, "That product slug already exists.");
    if (data.action !== "create" && data.action !== "update")
      throw new ApiError(400, "Choose add or edit product.");
    if (
      data.action === "update" &&
      !current.products.some((p) => p.id === product.id)
    )
      throw new ApiError(404, "Product no longer exists.");
    if (current.products.length >= 100 && data.action === "create")
      throw new ApiError(
        400,
        "The catalogue has reached its 100-product limit.",
      );
    const products =
      data.action === "create"
        ? [...current.products, product]
        : current.products.map((p) => (p.id === product.id ? product : p));
    return json(await writeCatalogue(products, current.revision));
  } catch (error) {
    return apiFailure(error);
  }
}
