import { get, put } from "@vercel/blob";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { requireOwner, json, apiFailure, ApiError } from "../server/admin.js";
export function imageType(bytes: Uint8Array) {
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
    return "image/jpeg";
  if (
    Buffer.from(bytes.subarray(0, 8)).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    )
  )
    return "image/png";
  if (
    Buffer.from(bytes.subarray(0, 4)).toString() === "RIFF" &&
    Buffer.from(bytes.subarray(8, 12)).toString() === "WEBP"
  )
    return "image/webp";
  return null;
}
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!/^[a-f0-9-]{36}$/.test(id))
    return json({ error: "Image not found." }, 404);
  try {
    const blob = await get(`products/${id}`, { access: "private" });
    if (!blob || blob.statusCode !== 200)
      return json({ error: "Image not found." }, 404);
    return new Response(blob.stream, {
      headers: {
        "Content-Type": blob.blob.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return json({ error: "Image unavailable." }, 503);
  }
}
export async function POST(request: Request) {
  try {
    await requireOwner(request);
    if (Number(request.headers.get("content-length")) > 2 * 1024 * 1024)
      throw new ApiError(413, "Choose an image under 2 MB.");
    const bytes = new Uint8Array(await request.arrayBuffer());
    if (!bytes.length || bytes.length > 2 * 1024 * 1024)
      throw new ApiError(413, "Choose an image under 2 MB.");
    const type = imageType(bytes);
    if (!type)
      throw new ApiError(
        400,
        "Use a JPEG, PNG or WebP photo. SVG and other formats are not accepted.",
      );
    let optimized;
    try {
      optimized = await sharp(bytes, { limitInputPixels: 24000000 })
        .rotate()
        .resize({
          width: 1600,
          height: 1600,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 82 })
        .toBuffer();
    } catch {
      throw new ApiError(
        400,
        "This photo could not be decoded. Choose a valid image under 24 megapixels.",
      );
    }
    const id = randomUUID();
    await put(`products/${id}`, optimized, {
      access: "private",
      contentType: "image/webp",
      addRandomSuffix: false,
    });
    return json({ image: `/api/product-image?id=${id}` });
  } catch (error) {
    return apiFailure(error);
  }
}
