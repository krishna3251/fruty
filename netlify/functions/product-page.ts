import { GET } from "../../api/product-page.ts";
import { dispatch } from "../lib/dispatch.ts";

export default dispatch({ GET });

// Server-renders catalogue products; the six legacy fruit pages stay static.
export const config = {
  path: ["/products/:slug", "/api/product-page"],
  excludedPath: [
    "/products/mango",
    "/products/strawberry",
    "/products/blueberry",
    "/products/orange",
    "/products/lemon",
    "/products/avocado",
  ],
};
