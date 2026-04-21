import { cookies } from "next/headers";

export async function getServerAuthToken() {
  const cookieStore = await cookies();

  return cookieStore.get("token")?.value ?? null;
}
