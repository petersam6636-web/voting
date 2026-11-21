
"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  Copy,
  Link2,
  LoaderCircle,
  QrCode,
  ShieldCheck,
  Users,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/lib/supabase-client";
import useApp from "@/lib/useApp";
import type { Project } from "@/types/project";

export default function SharePage() {
  const { linkingId, setLinkingId } = useApp();

  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [projectError, setProjectError] = useState("");
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const shareUrl = origin && linkingId
    ? `${origin}/home/share/${linkingId}`
    : "";

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    let active = true;

    const loadCurrentProject = async () => {
      setLinkingId("");
      setCurrentProject(null);
      setLoadingProject(true);
      setProjectError("");

      try {
        const { data: userData, error: userError } =
          await supabase.auth.getUser();

        if (userError) throw userError;
        if (!userData.user) {
          throw new Error("Sign in to generate an election sharing link.");
        }

        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("user_id", userData.user.id)
          .eq("deleted", false)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        if (!active) return;

        setCurrentProject(data as Project | null);
      } catch (error: unknown) {
        if (!active) return;

        setProjectError(
          error instanceof Error
            ? error.message
            : "Unable to load the election for sharing."
        );
      } finally {
        if (active) setLoadingProject(false);
      }
    };

    void loadCurrentProject();

    return () => {
      active = false;
    };
  }, [setLinkingId]);

  useEffect(() => {
    if (!currentProject?.id) {
      setLinkingId("");
      setCopied(false);
      setCopyError("");
      return;
    }

    setLinkingId(currentProject.id);
    setCopied(false);
    setCopyError("");
  }, [currentProject?.id, setLinkingId]);

  useEffect(() => {
    if (!copied) return;

    const timeout = window.setTimeout(() => setCopied(false), 2200);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const handleCopyLink = async () => {
    if (!shareUrl) return;

    setCopyError("");

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch (error) {
      console.error("Unable to copy voting link:", error);
      setCopied(false);
      setCopyError("Copy failed. Select the link and copy it manually.");
    }
  };

  return (
    <main className="relative isolate flex min-h-[calc(100dvh-8rem)] items-center justify-center overflow-hidden px-3 py-8 sm:px-6">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.055] blur-[130px]" />

      <div className="w-full max-w-3xl">
        <header className="mb-8 text-center sm:mb-10">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
            Voter access
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Share your election
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-zinc-400">
            One scan takes voters directly to your election. They can review
            the nominees and confirm their own vote.
          </p>
        </header>

        {loadingProject ? (
          <section
            className="mx-auto flex min-h-64 max-w-xl flex-col items-center justify-center rounded-3xl border border-white/[0.08] bg-[#0d1310]/80 px-6 text-center backdrop-blur-xl"
            role="status"
            aria-live="polite"
          >
            <LoaderCircle
              size={24}
              className="animate-spin text-emerald-300"
            />
            <p className="mt-4 text-sm text-zinc-400">
              Loading your election link...
            </p>
          </section>
        ) : projectError ? (
          <section
            className="mx-auto flex max-w-xl items-start gap-3 rounded-2xl border border-red-400/15 bg-red-400/[0.05] p-5 text-sm text-red-200"
            role="alert"
          >
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <p>{projectError}</p>
          </section>
        ) : !currentProject ? (
          <section className="mx-auto max-w-xl rounded-3xl border border-white/[0.08] bg-[#0d1310]/80 px-6 py-12 text-center backdrop-blur-xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-300">
              <Users size={21} />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-white">
              No election to share yet
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-400">
              Your QR code and invitation link will appear here when an
              election is available.
            </p>
          </section>
        ) : (
          <section className="relative mx-auto max-w-2xl overflow-hidden rounded-[2rem] border border-white/[0.09] bg-[#0d1310]/85 p-4 shadow-[0_30px_100px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:p-8">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/50 to-transparent" />
            <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-emerald-400/[0.07] blur-[90px]" />

            <div className="relative text-center">
              <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
                <ShieldCheck size={13} />
                Current election
              </div>

              <h2 className="mx-auto max-w-xl break-words text-xl font-semibold tracking-tight text-white sm:text-2xl">
                {currentProject.name || "Untitled election"}
              </h2>
              {currentProject.description && (
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-zinc-400">
                  {currentProject.description}
                </p>
              )}

              <p className="mt-6 text-xs text-zinc-500">
                Scan the code with a phone camera to open the voting page
              </p>

              <div className="mx-auto mt-5 flex w-full max-w-[372px] justify-center rounded-[1.75rem] border border-white/10 bg-white p-3 shadow-[0_20px_70px_rgba(16,185,129,0.12)] sm:p-4">
                {shareUrl && (
                  <QRCodeSVG
                    value={shareUrl}
                    size={360}
                    level="H"
                    includeMargin
                    bgColor="#ffffff"
                    fgColor="#07150e"
                    className="block h-auto w-full max-w-[340px]"
                  />
                )}
              </div>

              <div className="mx-auto mt-7 max-w-xl text-left">
                <label
                  htmlFor="election-share-link"
                  className="mb-2 block text-xs font-medium text-zinc-400"
                >
                  Invitation link
                </label>

                <div className="flex flex-col gap-2 rounded-2xl border border-white/[0.08] bg-black/20 p-2 sm:flex-row sm:items-center">
                  <div className="flex min-h-11 min-w-0 flex-1 items-center gap-2 px-2">
                    <Link2
                      size={16}
                      className="shrink-0 text-emerald-300"
                    />
                    <input
                      id="election-share-link"
                      type="text"
                      readOnly
                      value={shareUrl}
                      onFocus={(event) => event.currentTarget.select()}
                      className="min-w-0 flex-1 bg-transparent text-sm text-zinc-300 outline-none selection:bg-emerald-400/30"
                      aria-label="Election invitation link"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    disabled={!shareUrl}
                    className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 text-sm font-semibold text-[#04130c] shadow-[0_8px_24px_rgba(16,185,129,0.12)] transition duration-200 hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1310] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? "Copied" : "Copy link"}
                  </button>
                </div>

                <p
                  className={`mt-2 min-h-5 text-xs ${
                    copyError
                      ? "text-red-300"
                      : copied
                        ? "text-emerald-300"
                        : "text-transparent"
                  }`}
                  role={copyError ? "alert" : "status"}
                  aria-live="polite"
                >
                  {copyError || (copied ? "Invitation link copied." : " ")}
                </p>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-center text-[11px] text-zinc-500">
                <QrCode size={14} className="text-emerald-400/80" />
                Scanning opens the election; it never submits a vote automatically.
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
