import dotenv from "dotenv";
import { AuthHeaders } from "./types";

dotenv.config({ path: ".env.local" });

export const queryClient = async (
  path: string,
  headers?: AuthHeaders,
  baseUrl?: string,
) => {
  const apiBase = baseUrl || process.env.BASE_URL || "http://localhost:3000";
  const key = process.env.PROFILE_TEST_API_KEY || process.env.GENERAL_IDENTITY_GRAPH_API_KEY;
  const requestHeaders = { ...(key && { "x-api-key": key }), ...headers };
  const send = () => fetch(apiBase + path, { headers: requestHeaders });
  let response = await send();
  for (let retry = 0; response.status === 429 && retry < 2; retry++) {
    const seconds = Number(response.headers.get("Retry-After"));
    if (!Number.isInteger(seconds) || seconds < 1 || seconds > 10) break;
    await response.body?.cancel();
    await new Promise(resolve => setTimeout(resolve, seconds * 1000));
    response = await send();
  }
  return response;
};
