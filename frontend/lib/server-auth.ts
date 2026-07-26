import { cookies } from "next/headers";
import { isAuthTokenActive } from "@/lib/auth-token";

export async function getServerAuthToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value ?? null;

  return token && isAuthTokenActive(token) ? token : null;
}
