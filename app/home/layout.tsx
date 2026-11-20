
import type { ReactNode } from "react";
import AuthGuard from "@/components/AuthGuard";
import DashboardShell from "@/components/navigation/DashboardShell";

export default function HomeLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AuthGuard>
      <DashboardShell>{children}</DashboardShell>
    </AuthGuard>
  );
}