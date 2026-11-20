
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle, AlertCircle } from "lucide-react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-client";
import { ensureUserTask } from "@/lib/tasks";

export default function AuthCallbackPage() {
  const router = useRouter();

  const hasStarted = useRef(false);

  const [error, setError] = useState("");

  useEffect(() => {
    if (hasStarted.current) return;

    hasStarted.current = true;

    const completeAuthentication = async () => {
      try {
        const callbackUrl = new URL(window.location.href);

        const code = callbackUrl.searchParams.get("code");

        const tokenHash =
          callbackUrl.searchParams.get("token_hash");

        const otpType =
          callbackUrl.searchParams.get("type");

        const errorDescription =
          callbackUrl.searchParams.get("error_description");

        const errorCode =
          callbackUrl.searchParams.get("error_code");

        const authError =
          callbackUrl.searchParams.get("error");
        const requestedDestination =
          callbackUrl.searchParams.get("next");
        const destination =
          requestedDestination === "/" || requestedDestination === "/home"
            ? requestedDestination
            : "/home";

        // 1. Check for errors returned by Supabase or Google.

        if (errorDescription || errorCode || authError) {
          throw new Error(
            errorDescription ||
              errorCode ||
              authError ||
              "Authentication failed. Please try again."
          );
        }

        // 2. Exchange the Google OAuth authorization code.

        if (code) {
          const { data, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            throw exchangeError;
          }

          if (!data.session) {
            throw new Error(
              "Your authentication session could not be created. Please sign in again."
            );
          }

          await ensureUserTask(data.session.user.id);

          router.replace(destination);
          router.refresh();

          return;
        }

        // 3. Support email confirmation links using token_hash.

        if (tokenHash && otpType) {
          const { data, error: otpError } =
            await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: otpType as EmailOtpType,
            });

          if (otpError) {
            throw otpError;
          }

          if (!data.session) {
            router.replace("/");
            router.refresh();
            return;
          }

          await ensureUserTask(data.session.user.id);

          router.replace(destination);
          router.refresh();

          return;
        }

        // 4. If there is no code, check whether a valid session
        // already exists.

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (session) {
          await ensureUserTask(session.user.id);

          router.replace(destination);
          router.refresh();

          return;
        }

        throw new Error(
          "Your authentication link is missing its code or has expired. Please return to login and try again."
        );
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Unable to complete authentication. Please try again.";

        // Clear a potentially stale local session.
        // This does not call a custom Next.js backend.

        await supabase.auth.signOut({
          scope: "local",
        }).catch(() => {
          // Continue showing the original authentication error.
        });

        setError(message);
      }
    };

    void completeAuthentication();
  }, [router]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#070b09] px-4 text-zinc-100">
      <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#0d1310] p-6 text-center">

        {error ? (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
              <AlertCircle
                size={22}
                className="text-red-400"
              />
            </div>

            <h1 className="mt-4 text-lg font-semibold">
              Sign-in couldn&apos;t be completed
            </h1>

            <p
              role="alert"
              className="mt-2 text-sm leading-6 text-zinc-400"
            >
              {error}
            </p>

            <Link
              href="/"
              className="mt-5 inline-flex rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-[#062116] transition hover:bg-emerald-400"
            >
              Return to login
            </Link>
          </>
        ) : (
          <>
            <LoaderCircle
              aria-hidden="true"
              className="mx-auto h-7 w-7 animate-spin text-emerald-400"
            />

            <h1 className="mt-4 text-lg font-semibold">
              Completing sign-in
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              Please wait while we securely verify your account.
            </p>
          </>
        )}

      </div>
    </main>
  );
}
