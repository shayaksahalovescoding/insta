import { redirect } from "next/navigation";
import React from "react";
import { LoginView } from "@/components/AuthForms";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const currentUser = await getCurrentUser();
  if (currentUser) redirect("/");
  return <LoginView />;
}
