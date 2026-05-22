import createClient from "openapi-fetch";
import type { paths } from "./schema";
import { userIdMiddleware } from "./userIdMiddleware";

const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

export const api = createClient<paths>({ baseUrl });
api.use(userIdMiddleware);
