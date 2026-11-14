import type { Metadata } from "next";
import React from "react";
import { AppShell } from "@/components/AppShell";
import { getCurrentUser } from "@/lib/auth";
import { getUnreadNotificationsCount } from "@/lib/phase2-queries";
import { getUnreadDmThreadsCount } from "@/lib/phase3-queries";
import "./globals.css";

export const metadata: Metadata = {
  title: "Instagram",
  description: "Instagram Web clone built with zero mock data.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();
  const unreadCount = currentUser
    ? getUnreadNotificationsCount(currentUser.id)
    : 0;
  const unreadDmCount = currentUser
    ? getUnreadDmThreadsCount(currentUser.id)
    : 0;
  const themeClass =
    currentUser?.themePreference === "light" ? "__fb-light-mode" : "__fb-dark-mode";

  return (
    <html className={themeClass} lang="en">
      <body>
        <AppShell
          currentUser={currentUser}
          initialUnreadDmThreads={unreadDmCount}
          initialUnreadNotifications={unreadCount}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
