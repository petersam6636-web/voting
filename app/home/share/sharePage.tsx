
"use client";

import { useEffect, useState } from "react";
import {
  Share2,
  QrCode,
  Link2,
  ShieldCheck,
  Copy,
  Check,
  Users,
  ExternalLink,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/lib/supabase-client";
import type { Project } from "@/types/project";

export default function SharePage() {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [projectError, setProjectError] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;

    const loadCurrentProject = async () => {
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
  }, []);

  useEffect(() => {
    if (!currentProject?.id) {
      setShareUrl("");
      setCopied(false);
      return;
    }

    setShareUrl(
      `${window.location.origin}/home/share/${currentProject.id}`
    );
    setCopied(false);
  }, [currentProject?.id]);

  const handleCopyLink = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch (error) {
      console.error("Unable to copy voting link:", error);
      setCopied(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="mb-2 text-xs font-medium tracking-wider text-emerald-400">
          VOTER ACCESS
        </p>

        <h1 className="text-2xl font-bold text-white">
          Share<span className="text-emerald-400">.</span>
        </h1>

        <p className="mt-1 text-sm text-zinc-500">
          Invite voters to participate in your election using a QR code or
          shareable link.
        </p>
      </header>

      {/* Introduction */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-400/15 bg-gradient-to-br from-[#103323] to-[#0b120e] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-400/[0.09] blur-[80px]" />

        <div className="relative max-w-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-300">
            <Share2 size={23} />
          </div>

          <h2 className="mt-5 text-xl font-bold text-white">
            Make participation easy.
          </h2>

          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Give voters a simple way to access your current election. They can
            scan the QR code or open the invitation link to cast their vote.
          </p>
        </div>
      </section>

      {loadingProject ? (
        <section
          className="rounded-2xl border border-white/[0.07] bg-[#0d1310] px-5 py-12 text-center"
          role="status"
        >
          <p className="text-sm text-zinc-400">
            Loading your election...
          </p>
        </section>
      ) : projectError ? (
        <section
          className="rounded-2xl border border-red-400/15 bg-[#0d1310] px-5 py-12 text-center"
          role="alert"
        >
          <p className="text-sm text-red-300">{projectError}</p>
        </section>
      ) : !currentProject ? (
        <section className="rounded-2xl border border-white/[0.07] bg-[#0d1310] px-5 py-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/10 bg-emerald-400/[0.06] text-emerald-400">
            <Share2 size={24} />
          </div>

          <h3 className="mt-4 text-sm font-semibold text-white">
            No active election found
          </h3>

          <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-zinc-500">
            Your election sharing link and QR code will appear here when an
            election is available.
          </p>
        </section>
      ) : (
        <>
          {/* Current election */}
          <section className="rounded-2xl border border-emerald-400/15 bg-[#0d1310] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400">
                <Users size={19} />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-medium tracking-wider text-emerald-400">
                  CURRENT ELECTION
                </p>

                <h3 className="mt-1 truncate text-sm font-semibold text-white">
                  {currentProject.name}
                </h3>
              </div>

              <div className="ml-auto shrink-0 rounded-full border border-emerald-400/15 bg-emerald-400/[0.07] px-2.5 py-1">
                <span className="text-[10px] font-medium text-emerald-400">
                  Selected
                </span>
              </div>
            </div>

            {currentProject.description && (
              <p className="mt-3 text-xs leading-5 text-zinc-500">
                {currentProject.description}
              </p>
            )}
          </section>

          {/* QR code section */}
          <section className="relative isolate overflow-hidden rounded-3xl border border-emerald-400/15 bg-gradient-to-br from-[#10291d] via-[#0c1711] to-[#080e0b] p-6 sm:p-8">
            {/* Static decorative bubbles */}
            <div className="pointer-events-none absolute -right-12 -top-12 -z-10 h-48 w-48 rounded-full border border-emerald-300/[0.08] bg-emerald-400/[0.035]" />
            <div className="pointer-events-none absolute -right-5 top-16 -z-10 h-20 w-20 rounded-full border border-emerald-300/[0.10] bg-emerald-400/[0.04]" />
            <div className="pointer-events-none absolute -bottom-16 -left-12 -z-10 h-52 w-52 rounded-full border border-emerald-300/[0.07] bg-emerald-400/[0.035]" />
            <div className="pointer-events-none absolute bottom-12 left-20 -z-10 h-12 w-12 rounded-full border border-emerald-300/[0.08] bg-emerald-400/[0.04]" />

            <div className="relative">
              <div className="text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-300">
                  <QrCode size={21} />
                </div>

                <h2 className="mt-4 text-lg font-bold text-white">
                  Scan to participate
                </h2>

                <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-zinc-400">
                  Let voters scan this QR code with their phone camera to
                  access your election instantly.
                </p>
              </div>

              {/* QR code */}
              <div className="mx-auto mt-7 flex w-fit flex-col items-center rounded-3xl border border-white/10 bg-white p-4 shadow-[0_0_55px_rgba(16,185,129,0.10)] sm:p-5">
                {shareUrl && (
                  <QRCodeSVG
                    value={shareUrl}
                    size={220}
                    level="H"
                    includeMargin
                    bgColor="#ffffff"
                    fgColor="#07150e"
                    className="h-auto w-[190px] sm:w-[220px]"
                  />
                )}

                <div className="mt-3 flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <p className="text-[10px] font-semibold tracking-wider text-emerald-950">
                    VOTER ACCESS QR
                  </p>
                </div>
              </div>

              <p className="mt-5 text-center text-[11px] leading-5 text-zinc-500">
                Keep this QR code visible so voters can scan it easily.
              </p>
            </div>
          </section>

          {/* Shareable link */}
          <section className="rounded-2xl border border-white/[0.07] bg-[#0d1310] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400">
                <Link2 size={19} />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white">
                  Election link
                </h3>

                <p className="mt-1 text-xs text-zinc-500">
                  Share this link directly with your voters.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <div className="flex min-w-0 flex-1 items-center rounded-xl border border-white/[0.07] bg-black/20 px-3 py-3">
                <Link2
                  size={15}
                  className="mr-2 shrink-0 text-emerald-400"
                />

                <span className="truncate text-xs text-zinc-400">
                  {shareUrl || "Generating election link..."}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyLink}
                disabled={!shareUrl}
                className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-3 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? "Copied!" : "Copy link"}
              </button>
            </div>

            {shareUrl && (
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-emerald-400 transition-colors hover:text-emerald-300"
              >
                Preview voter page
                <ExternalLink size={13} />
              </a>
            )}
          </section>

          {/* Security information */}
          <section className="rounded-2xl border border-white/[0.07] bg-[#0d1310] p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck
                size={20}
                className="mt-0.5 shrink-0 text-emerald-400"
              />

              <div>
                <h3 className="text-sm font-semibold text-white">
                  Secure voter access
                </h3>

                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  Scanning the QR code only opens the election voting page. It
                  does not automatically cast a vote. Voters must deliberately
                  select and submit their choice.
                </p>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
