import { GET } from "../../api/sitemap.ts";
import { dispatch } from "../lib/dispatch.ts";

export default dispatch({ GET });

export const config = { path: ["/sitemap.xml", "/api/sitemap"] };
