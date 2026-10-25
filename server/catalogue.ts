import { get, put, BlobPreconditionFailedError } from "@vercel/blob";
import { pickleProducts, type PickleProduct } from "../src/data/pickles.js";
import { ApiError } from "./admin.js";
export async function readCatalogue() {
  if (process.env.CATALOGUE_STORAGE === "netlify")
    return (await import("./netlifyStorage.js")).readNetlifyCatalogue();
  if (!process.env.BLOB_READ_WRITE_TOKEN)
    throw new ApiError(503, "Product storage is not configured.");
  const blob = await get("catalogue/products.json", {
    access: "private",
    useCache: false,
  });
  if (!blob) return { products: pickleProducts, revision: "initial" };
  if (blob.statusCode !== 200) throw Error("Unexpected catalogue response");
  const data = await new Response(blob.stream).json();
  if (!Array.isArray(data.products)) throw Error("Invalid catalogue");
  return {
    products: data.products as PickleProduct[],
    revision: blob.blob.etag,
  };
}
export async function writeCatalogue(
  products: PickleProduct[],
  revision: string,
) {
  if (process.env.CATALOGUE_STORAGE === "netlify")
    return (await import("./netlifyStorage.js")).writeNetlifyCatalogue(
      products,
      revision,
    );
  try {
    const result = await put(
      "catalogue/products.json",
      JSON.stringify({ products, updatedAt: new Date().toISOString() }),
      {
        access: "private",
        contentType: "application/json",
        addRandomSuffix: false,
        ...(revision !== "initial"
          ? { ifMatch: revision }
          : { allowOverwrite: false }),
        cacheControlMaxAge: 60,
      },
    );
    return { products, revision: result.etag };
  } catch (error) {
    if (
      error instanceof BlobPreconditionFailedError ||
      (error instanceof Error && /already exists/i.test(error.message))
    )
      throw new ApiError(
        409,
        "The catalogue changed in another tab. Reload the panel before saving again.",
      );
    throw error;
  }
}
