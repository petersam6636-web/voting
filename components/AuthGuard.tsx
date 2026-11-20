
"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase-client";

type AuthGuardProps = {
  children: ReactNode;
};

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const checkingRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    let active = true;

    const verifyUser = async () => {
      // Prevent duplicate verification requests.
      if (checkingRef.current) return;

      checkingRef.current = true;

      try {
        // Verify the actual user with Supabase Auth.
        const { data, error } = await supabase.auth.getUser();

        if (!active) return;

        if (error || !data.user) {
          // Remove an invalid or stale local session.
          await supabase.auth.signOut({ scope: "local" });

          if (!active) return;

          router.replace("/");
          router.refresh();

          return;
        }

        // Only display the dashboard after verification.
        setChecking(false);
      } catch {
        if (!active) return;

        await supabase.auth.signOut({ scope: "local" });

        if (!active) return;

        router.replace("/");
        router.refresh();
      } finally {
        checkingRef.current = false;
      }
    };

    // Verify immediately when /home is opened.
    void verifyUser();

    // Listen for authentication changes.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (!active) return;

      if (event === "SIGNED_OUT") {
        router.replace("/");
        router.refresh();
        return;
      }

      // Recheck the account when Supabase refreshes
      // the token or establishes a new session.
      if (event === "TOKEN_REFRESHED" || event === "SIGNED_IN") {
        setChecking(true);

        // Avoid calling Supabase auth methods directly
        // inside the onAuthStateChange callback.
        setTimeout(() => {
          if (active) {
            void verifyUser();
          }
        }, 0);
      }
    });

    return () => {
      active = false;
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [router]);

  // Do not render dashboard content before authentication
  // has been verified.
  if (checking) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#050a07] text-white">
        <div className="flex flex-col items-center gap-4">

          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] shadow-[0_0_35px_rgba(16,185,129,0.10)]">
            <ShieldCheck size={25} className="text-emerald-400" />

            <LoaderCircle
              size={19}
              className="absolute -right-2 -top-2 animate-spin text-emerald-300"
            />
          </div>

          <div className="text-center">
            <p className="text-sm font-semibold text-white">
              Verifying your account
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              Securing your VoteSphere session...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
