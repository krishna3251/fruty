import { GET, POST } from "../../api/catalogue.ts";
import { dispatch } from "../lib/dispatch.ts";

export default dispatch({ GET, POST });

export const config = { path: "/api/catalogue" };
