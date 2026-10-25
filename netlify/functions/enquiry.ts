import { POST } from "../../api/enquiry.ts";
import { dispatch } from "../lib/dispatch.ts";

export default dispatch({ POST });

export const config = { path: "/api/enquiry" };
