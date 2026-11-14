import { redirect } from "next/navigation";
import React from "react";
import { EditProfileClient } from "@/components/EditProfileClient";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function EditProfilePage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/accounts/login/");
  return <EditProfileClient currentUser={currentUser} />;
}
