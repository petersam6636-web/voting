
import { Suspense } from "react";
import type { ReactNode } from "react";
import AuthGuard from "@/components/AuthGuard";
import DashboardShell from "@/components/navigation/DashboardShell";

export default function HomeLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-dvh bg-[#070b09]"
          aria-label="Loading VoteSphere"
        />
      }
    >
      <AuthGuard>
        <DashboardShell>{children}</DashboardShell>
      </AuthGuard>
    </Suspense>
  );
}