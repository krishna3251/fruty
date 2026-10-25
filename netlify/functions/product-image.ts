import { GET, POST } from "../../api/product-image.ts";
import { dispatch } from "../lib/dispatch.ts";

export default dispatch({ GET, POST });

export const config = { path: "/api/product-image" };
