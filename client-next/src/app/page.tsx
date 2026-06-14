import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";

export default async function Home() {
  const user = await getServerSession();
  if (!user) redirect("/login");
  redirect(user.authorities.includes("ADMIN") ? "/users" : "/profile");
}
