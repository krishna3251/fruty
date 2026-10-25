import { POST } from "../../api/customer.ts";
import { dispatch } from "../lib/dispatch.ts";

export default dispatch({ POST });

export const config = { path: "/api/customer" };
