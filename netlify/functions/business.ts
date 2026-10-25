import { GET, POST } from "../../api/business.ts";
import { dispatch } from "../lib/dispatch.ts";

export default dispatch({ GET, POST });

export const config = { path: "/api/business" };
