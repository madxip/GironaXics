import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import CompteClient from "./CompteClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "El meu compte — GironaXics",
};

export const dynamic = "force-dynamic";

export default async function ComptePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return <CompteClient />;
}
