import { getStore } from "@netlify/blobs";
import { ApiError } from "./admin.js";
import { pickleProducts, type PickleProduct } from "../src/data/pickles.js";
function store() {
  // Set different stores for production and previews; never silently use a shared default.
  const name = process.env.NETLIFY_BLOB_STORE;
  if (!name || !/^[a-zA-Z0-9_-]{1,64}$/.test(name))
    throw new ApiError(503, "Product storage needs Netlify configuration.");
  return getStore({ name, consistency: "strong" });
}
export async function readNetlifyCatalogue(storage = store()) {
  const entry = await storage.getWithMetadata("catalogue/products.json", {
    type: "json",
    consistency: "strong",
  });
  if (!entry) return { products: pickleProducts, revision: "initial" };
  if (!entry.etag) throw Error("Catalogue revision missing");
  if (!entry.data || !Array.isArray(entry.data.products))
    throw Error("Invalid catalogue");
  return {
    products: entry.data.products as PickleProduct[],
    revision: entry.etag,
  };
}
export async function writeNetlifyCatalogue(
  products: PickleProduct[],
  revision: string,
  storage = store(),
) {
  const result = await storage.setJSON(
    "catalogue/products.json",
    { products, updatedAt: new Date().toISOString() },
    revision === "initial" ? { onlyIfNew: true } : { onlyIfMatch: revision },
  );
  if (!result.modified || !result.etag)
    throw new ApiError(
      409,
      "The catalogue changed in another tab. Reload before saving.",
    );
  return { products, revision: result.etag };
}
export async function netlifyImage(id: string) {
  const image = await store().get(`products/${id}`, {
    type: "arrayBuffer",
    consistency: "strong",
  });
  return image
    ? new Response(image, {
        headers: {
          "Content-Type": "image/webp",
          "X-Content-Type-Options": "nosniff",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      })
    : new Response(null, { status: 404 });
}
export async function writeNetlifyImage(id: string, bytes: Uint8Array) {
  const result = await store().set(
    `products/${id}`,
    new Blob([new Uint8Array(bytes)], { type: "image/webp" }),
    { onlyIfNew: true },
  );
  if (!result.modified)
    throw new ApiError(409, "This photo already exists. Try again.");
}
