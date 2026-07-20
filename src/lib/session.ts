import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";

export async function getSessionUser() {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) return null;

  return {
    id: session.user.id,
    role: session.user.role,
  };
}
