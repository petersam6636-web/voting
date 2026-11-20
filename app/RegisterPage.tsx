
"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Geist } from "next/font/google";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  Mail,
  Lock,
  Vote,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { ensureUserTask } from "@/lib/tasks";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

type AuthMode = "login" | "signup";
type LoadingType = "email" | "google" | null;

export default function RegisterPage() {
  const router = useRouter();

  const redirectingRef = useRef(false);
  const mountedRef = useRef(false);

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState<LoadingType>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isLogin = mode === "login";
  const isLoading = loading !== null;

  // Verify the actual Supabase user before entering /home.
  const verifyAndRedirect = async (showError = false) => {
    if (redirectingRef.current) return false;

    redirectingRef.current = true;

    try {
      const { data, error: verificationError } =
        await supabase.auth.getUser();

      if (verificationError || !data.user) {
        const { data: sessionData } =
          await supabase.auth.getSession();

        if (sessionData.session) {
          await supabase.auth.signOut({ scope: "local" });
        }

        if (showError && mountedRef.current) {
          setError(
            "Your session is invalid or your account no longer exists. Please sign in again."
          );
        }

        return false;
      }

      try {
        await ensureUserTask(data.user.id);
      } catch (taskError: unknown) {
        if (showError && mountedRef.current) {
          setError(
            taskError instanceof Error
              ? taskError.message
              : "Unable to initialize your VoteSphere workspace."
          );
        }
        return false;
      }

      if (mountedRef.current) {
        router.replace("/home");
        router.refresh();
      }

      return true;
    } catch {
      await supabase.auth.signOut({ scope: "local" });

      if (showError && mountedRef.current) {
        setError("Unable to verify your account. Please try again.");
      }

      return false;
    } finally {
      redirectingRef.current = false;
    }
  };

  // Handle existing sessions when the login page opens.
  useEffect(() => {
    mountedRef.current = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (!mountedRef.current) return;

      if (event === "INITIAL_SESSION") {
        setTimeout(() => {
          if (mountedRef.current) {
            void verifyAndRedirect(false);
          }
        }, 0);
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  // Email and password authentication.
  const handleEmailAuth = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    if (password.length < 6) {
      setError("Your password must contain at least 6 characters.");
      return;
    }

    setLoading("email");

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) throw error;

        const verified = await verifyAndRedirect(true);

        if (!verified) return;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
          },
        });

        if (error) throw error;

        if (data.session) {
          const verified = await verifyAndRedirect(true);

          if (!verified) return;
        } else {
          setSuccess(
            "Account created! Please check your email to confirm your account."
          );
        }
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(null);
    }
  };

  // Google authentication.
  const handleGoogleAuth = async () => {
    setError("");
    setSuccess("");
    setLoading("google");

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/home`,
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (error) throw error;
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Google sign-in failed. Please try again."
      );

      setLoading(null);
    }
  };

  const changeMode = (newMode: AuthMode) => {
    if (isLoading) return;

    setMode(newMode);
    setError("");
    setSuccess("");
    setPassword("");
    setShowPassword(false);
  };

  return (
    <main
      className={`${geist.className} relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[#050a07] px-4 py-5 text-white selection:bg-emerald-500/30`}
    >
      {/* BACKGROUND AMBIENT GLOWS */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-36 -top-36 h-[340px] w-[340px] rounded-full bg-emerald-600/[0.13] blur-[100px]" />

        <div className="absolute -bottom-40 -right-32 h-[360px] w-[360px] rounded-full bg-emerald-500/[0.10] blur-[110px]" />

        <div className="absolute left-1/2 top-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-900/[0.08] blur-[120px]" />

        {/* FLOATING GLASS BUBBLES */}

        <div className="floating-orb absolute left-[8%] top-[15%] h-12 w-12 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] shadow-[inset_0_0_20px_rgba(52,211,153,0.08),0_0_45px_rgba(16,185,129,0.12)]" />

        <div className="floating-orb absolute right-[10%] top-[12%] h-20 w-20 rounded-full border border-emerald-300/15 bg-emerald-300/[0.04] shadow-[inset_0_0_30px_rgba(52,211,153,0.1),0_0_55px_rgba(16,185,129,0.1)]" />

        <div className="floating-orb absolute bottom-[12%] left-[17%] h-9 w-9 rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] shadow-[0_0_35px_rgba(16,185,129,0.15)]" />

        <div className="floating-orb absolute bottom-[17%] right-[15%] h-14 w-14 rounded-full border border-emerald-300/15 bg-emerald-300/[0.05] shadow-[0_0_40px_rgba(16,185,129,0.12)]" />

        <div className="floating-orb absolute left-[28%] top-[8%] h-5 w-5 rounded-full border border-emerald-300/20 bg-emerald-300/[0.06]" />

        <div className="absolute inset-0 opacity-[0.025] [background-image:radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      {/* COMPACT AUTHENTICATION CARD */}

      <div className="relative z-10 w-full max-w-[410px]">
        {/* CARD GLOW */}

        <div className="pointer-events-none absolute -inset-3 rounded-[35px] bg-emerald-500/[0.035] blur-2xl" />

        <section className="relative overflow-hidden rounded-[25px] border border-emerald-400/[0.15] bg-[#0a110d]/95 shadow-[0_25px_80px_rgba(0,0,0,0.65),0_0_45px_rgba(16,185,129,0.055)] backdrop-blur-2xl">
          {/* CARD AMBIENT DECORATION */}

          <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-emerald-500/[0.06] blur-[65px]" />

          <div className="pointer-events-none absolute -bottom-24 -left-20 h-48 w-48 rounded-full bg-emerald-600/[0.06] blur-[70px]" />

          {/* CARD CONTENT */}

          <div className="relative px-5 py-6 sm:px-8 sm:py-7">
            {/* LOGO */}

            <div className="mb-5 flex items-center justify-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.08)]">
                <Vote size={21} />
              </div>

              <div>
                <h1 className="text-[17px] font-bold tracking-tight text-white">
                  VoteSphere
                </h1>
                <p className="text-[10px] text-zinc-500">
                  Your voice matters
                </p>
              </div>
            </div>

            {/* HEADING */}

            <div className="mb-5 text-center">
       
              <h2 className="text-[25px] font-bold tracking-[-1px] sm:text-[27px]">
                {isLogin ? (
                  <>
                    Welcome <span className="text-emerald-400">back.</span>
                  </>
                ) : (
                  <>
                    Create your{" "}
                    <span className="text-emerald-400">account.</span>
                  </>
                )}
              </h2>

              <p className="mt-1.5 text-[11px] leading-[18px] text-zinc-500">
                {isLogin
                  ? "Sign in to continue making your voice heard."
                  : "Join VoteSphere and make your voice part of the future."}
              </p>
            </div>

            {/* LOGIN / SIGNUP SWITCH */}


            {/* ERROR */}

            {error && (
              <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/[0.07] px-3 py-2 text-[10px] leading-4 text-red-400">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* SUCCESS */}

            {success && (
              <div className="mb-3 flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.07] px-3 py-2 text-[10px] leading-4 text-emerald-300">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                <p>{success}</p>
              </div>
            )}

            {/* AUTHENTICATION FORM */}

            <form onSubmit={handleEmailAuth} className="space-y-3">
              {/* EMAIL */}

              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-[11px] font-semibold text-zinc-300"
                >
                  Email address
                </label>

                <div className="group flex h-[42px] items-center gap-2.5 rounded-lg border border-white/[0.08] bg-[#060b08]/80 px-3 transition-all focus-within:border-emerald-400/50 focus-within:ring-2 focus-within:ring-emerald-500/10">
                  <Mail
                    size={15}
                    className="shrink-0 text-zinc-600 transition-colors group-focus-within:text-emerald-400"
                  />

                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={isLoading}
                    className="h-full w-full bg-transparent text-[12px] text-white outline-none placeholder:text-zinc-600 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* PASSWORD */}

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-[11px] font-semibold text-zinc-300"
                >
                  Password
                </label>

                <div className="group flex h-[42px] items-center gap-2.5 rounded-lg border border-white/[0.08] bg-[#060b08]/80 px-3 transition-all focus-within:border-emerald-400/50 focus-within:ring-2 focus-within:ring-emerald-500/10">
                  <Lock
                    size={15}
                    className="shrink-0 text-zinc-600 transition-colors group-focus-within:text-emerald-400"
                  />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      isLogin ? "current-password" : "new-password"
                    }
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={isLoading}
                    className="h-full w-full bg-transparent text-[12px] text-white outline-none placeholder:text-zinc-600 disabled:opacity-50"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="shrink-0 cursor-pointer text-zinc-600 transition-colors hover:text-emerald-400"
                  >
                    {showPassword ? (
                      <EyeOff size={15} />
                    ) : (
                      <Eye size={15} />
                    )}
                  </button>
                </div>
              </div>

              {/* SUBMIT */}

              <button
                type="submit"
                disabled={isLoading}
                className="group mt-1 flex h-[43px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-400 text-[11px] font-bold text-[#032116] shadow-[0_5px_20px_rgba(16,185,129,0.16)] transition-all duration-200 hover:from-emerald-400 hover:to-emerald-300 hover:shadow-[0_5px_25px_rgba(16,185,129,0.25)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading === "email" ? (
                  <>
                    <LoaderCircle size={15} className="animate-spin" />
                    Please wait...
                  </>
                ) : (
                  <>
                    {isLogin ? "Sign in to your account" : "Create account"}
                    <ArrowRight
                      size={14}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
            </form>

            {/* DIVIDER */}

            <div className="my-3.5 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/[0.07]" />

              <span className="text-[9px] font-medium uppercase tracking-[1.3px] text-zinc-600">
                Or continue with
              </span>

              <div className="h-px flex-1 bg-white/[0.07]" />
            </div>

            {/* GOOGLE AUTHENTICATION */}

            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="flex h-[42px] w-full cursor-pointer items-center justify-center gap-2.5 rounded-lg border border-white/[0.09] bg-white/[0.025] text-[11px] font-semibold text-zinc-300 transition-all hover:border-emerald-400/30 hover:bg-emerald-500/[0.04] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading === "google" ? (
                <>
                  <LoaderCircle
                    size={15}
                    className="animate-spin text-emerald-400"
                  />
                  Connecting to Google...
                </>
              ) : (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 48 48"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      fill="#4285F4"
                      d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.5H5.8v5.3A20.4 20.4 0 0 0 24 44Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M12.6 27.5a12.3 12.3 0 0 1 0-7v-5.3H5.8a20.4 20.4 0 0 0 0 17.6l6.8-5.3Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 6 29.5 4 24 4A20.4 20.4 0 0 0 5.8 15.2l6.8 5.3C14.2 15.6 18.7 12 24 12Z"
                    />
                  </svg>

                  Continue with Google
                </>
              )}
            </button>

            {/* SWITCH MODE */}

            <p className="mt-4 text-center text-[10px] text-zinc-600">
              {isLogin
                ? "Don't have an account?"
                : "Already have an account?"}

              <button
                type="button"
                disabled={isLoading}
                onClick={() => changeMode(isLogin ? "signup" : "login")}
                className="ml-1 cursor-pointer font-semibold text-emerald-400 transition-colors hover:text-emerald-300 disabled:opacity-50"
              >
                {isLogin ? "Create one" : "Sign in"}
              </button>
            </p>

            {/* SECURITY FOOTER */}

            <div className="mt-4 flex items-center justify-center gap-1.5 border-t border-white/[0.06] pt-3">
              <ShieldCheck size={12} className="text-emerald-500" />

              <span className="text-[9px] text-zinc-600">
                Your information is securely protected.
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* FLOATING BUBBLE ANIMATION */}

    </main>
  );
}
