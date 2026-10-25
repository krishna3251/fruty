import * as catalogue from "../api/catalogue.js";
import * as customer from "../api/customer.js";
import * as enquiry from "../api/enquiry.js";
import * as business from "../api/business.js";
import * as ownerOrders from "../api/owner-orders.js";
import * as productImage from "../api/product-image.js";
import * as productPage from "../api/product-page.js";
import * as sitemap from "../api/sitemap.js";
import { securityHeaders } from "./securityHeaders.js";
import { readFileSync } from "node:fs";
type Handler = (request: Request) => Response | Promise<Response>;
const endpoints: Record<string, { GET?: Handler; POST?: Handler }> = {
  catalogue,
  customer,
  enquiry,
  business,
  "owner-orders": ownerOrders,
  "product-image": productImage,
  "product-page": productPage,
  sitemap,
};
const archived = new Set([
  "mango",
  "strawberry",
  "blueberry",
  "orange",
  "lemon",
  "avocado",
]);
export async function netlifyRouter(request: Request) {
  const url = new URL(request.url);
  const endpoint =
    url.searchParams.get("endpoint") || url.pathname.split("/").at(-1) || "";
  let response: Response;
  try {
    if (endpoint === "gone") {
      response = new Response(readFileSync("dist/404.html", "utf8"), {
        status: 410,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    } else if (
      endpoint === "product-page" &&
      archived.has(url.searchParams.get("slug") || "")
    ) {
      response = new Response(
        readFileSync(
          `dist/products/${url.searchParams.get("slug")}/index.html`,
          "utf8",
        ),
        {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "X-Robots-Tag": "noindex, follow",
          },
        },
      );
    } else {
      const handlers = endpoints[endpoint];
      if (!Object.hasOwn(endpoints, endpoint))
        response = new Response("Not found", { status: 404 });
      else {
        const method = request.method === "HEAD" ? "GET" : request.method;
        const handler = handlers[method as "GET" | "POST"];
        response = handler
          ? await handler(request)
          : new Response(null, {
              status: 405,
              headers: {
                Allow: Object.keys(handlers)
                  .filter((key) => key === "GET" || key === "POST")
                  .join(", "),
              },
            });
      }
    }
  } catch {
    response = Response.json(
      { error: "This service is temporarily unavailable. Please try again." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(securityHeaders))
    headers.set(name, value);
  return new Response(request.method === "HEAD" ? null : response.body, {
    status: response.status,
    headers,
  });
}
