import { POST } from "../../api/owner-orders.ts";
import { dispatch } from "../lib/dispatch.ts";

export default dispatch({ POST });

export const config = { path: "/api/owner-orders" };
