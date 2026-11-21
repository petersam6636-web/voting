
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  CheckCircle2,
  Crown,
  MessageCircle,
  Trophy,
  Users,
  Vote,
  Medal,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import useApp from "@/lib/useApp";
import ProjectLoading from "@/components/ProjectLoading";

type Voter = {
  id?: string;
  nominee_id?: string;
  name?: string | null;
  comment?: string | null;
};

type Achievement = {
  id?: string;
  nominee_id?: string;
  project?: string | null;
  created_at?: string | null;
};

type Nominee = {
  id: string;
  project_id?: string;
  user_id?: string;
  name?: string | null;
  manifesto?: string | null;
  image?: string | null;
  created_at?: string | null;
  achievements?: Achievement[] | null;
  voters?: Voter[] | null;
};

type Project = {
  id: string;
  name?: string | null;
  created_at?: string | null;
  nominees?: Nominee[] | null;
};

type ProjectLookup = {
  nomineeId: string;
  project: Project | null;
  error: string;
};

type DetailsProps = {
  nomineeId: string;
};

function formatDate(date?: string | null): string {
  if (!date) return "Date unavailable";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return parsedDate.toLocaleDateString("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getInitials(name?: string | null) {
  if (!name?.trim()) return "?";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

// ------------------------------------------------------
// ANIMATED CIRCULAR PROGRESS
// ------------------------------------------------------

type CircularProgressProps = {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
};

function CircularProgress({
  percentage,
  size = 68,
  strokeWidth = 5,
  color = "text-emerald-300",
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const safePercentage = Math.min(100, Math.max(0, percentage));

  const offset =
    circumference - (safePercentage / 100) * circumference;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="h-full w-full -rotate-90 overflow-visible"
        role="img"
        aria-label={`${safePercentage}% of all votes`}
      >
        {/* Background Ring */}

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-white/[0.09]"
        />

        {/* Animated Progress Ring */}

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${color} transition-[stroke-dashoffset] duration-1000 ease-in-out`}
          style={{
            filter: "drop-shadow(0 0 4px rgba(52,211,153,0.25))",
          }}
        />
      </svg>

      {/* Percentage */}

      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums text-emerald-300">
        {safePercentage}%
      </span>
    </div>
  );
}

// ------------------------------------------------------
// DETAILS PAGE
// ------------------------------------------------------

export default function BiewPage({ nomineeId }: DetailsProps) {
  const { project, linkingId } = useApp();

  const [lookup, setLookup] = useState<ProjectLookup>({
    nomineeId: "",
    project: null,
    error: "",
  });

  const contextProject = useMemo(
    () =>
      ((project ?? []) as Project[]).find((item) =>
        item.nominees?.some((nominee) => nominee.id === nomineeId)
      ) ?? null,
    [project, nomineeId]
  );

  // ------------------------------------------------------
  // LOAD PROJECT
  // ------------------------------------------------------

  useEffect(() => {
    if (contextProject || lookup.nomineeId === nomineeId) return;

    let active = true;

    const loadProject = async () => {
      let loadedProject: Project | null = null;
      let errorMessage = "";

      try {
        const { data: nomineeRecord, error: nomineeError } = await supabase
          .from("nominees")
          .select("project_id")
          .eq("id", nomineeId)
          .maybeSingle();

        if (nomineeError) throw nomineeError;

        if (!nomineeRecord) {
          throw new Error("This nominee could not be found.");
        }

        const { data: projectRecord, error: projectError } = await supabase
          .from("projects")
          .select(`
            *,
            nominees (
              *,
              achievements (*),
              voters (*)
            )
          `)
          .eq("id", nomineeRecord.project_id)
          .eq("deleted", false)
          .maybeSingle();

        if (projectError) throw projectError;

        if (!projectRecord) {
          throw new Error("The project for this nominee could not be found.");
        }

        loadedProject = projectRecord as Project;
      } catch (error: unknown) {
        errorMessage =
          error instanceof Error
            ? error.message
            : "Unable to load this nominee.";
      }

      if (active) {
        setLookup({
          nomineeId,
          project: loadedProject,
          error: errorMessage,
        });
      }
    };

    void loadProject();

    return () => {
      active = false;
    };
  }, [contextProject, lookup.nomineeId, nomineeId]);

  // ------------------------------------------------------
  // PROJECT DATA
  // ------------------------------------------------------

  const currentProject =
    contextProject ??
    (lookup.nomineeId === nomineeId ? lookup.project : null);

  const isLoading =
    !contextProject && lookup.nomineeId !== nomineeId;

  const lookupError =
    lookup.nomineeId === nomineeId ? lookup.error : "";

  // ------------------------------------------------------
  // VOTING RESULTS
  // ------------------------------------------------------

  const result = useMemo(() => {
    if (!currentProject) {
      return {
        nominee: null,
        rankedNominees: [] as Nominee[],
        rank: 0,
        voteCount: 0,
        leadingVotes: 0,
        totalVotes: 0,
        progress: 0,
        voteShare: 0,
      };
    }

    const nominees = currentProject.nominees ?? [];

    const nominee =
      nominees.find((item) => item.id === nomineeId) ?? null;

    const rankedNominees = nominees
      .slice()
      .sort(
        (a, b) =>
          (b.voters?.length ?? 0) - (a.voters?.length ?? 0)
      );

    const voteCount = nominee?.voters?.length ?? 0;

    const leadingVotes = Math.max(
      0,
      ...rankedNominees.map((item) => item.voters?.length ?? 0)
    );

    const totalVotes = rankedNominees.reduce(
      (total, item) => total + (item.voters?.length ?? 0),
      0
    );

    // Competition ranking: 1, 1, 3 when two nominees share first place.
    const rank = nominee
      ? rankedNominees.findIndex((item) => item.id === nominee.id) >= 0
        ? rankedNominees.filter(
            (item) => (item.voters?.length ?? 0) > voteCount
          ).length + 1
        : 0
      : 0;

    const progress =
      leadingVotes > 0
        ? Math.round((voteCount / leadingVotes) * 100)
        : 0;

    const voteShare =
      totalVotes > 0
        ? Math.round((voteCount / totalVotes) * 100)
        : 0;

    return {
      nominee,
      rankedNominees,
      rank,
      voteCount,
      leadingVotes,
      totalVotes,
      progress,
      voteShare,
    };
  }, [currentProject, nomineeId]);

  const {
    nominee,
    rankedNominees,
    rank,
    voteCount,
    leadingVotes,
    totalVotes,
    progress,
    voteShare,
  } = result;

  const topNominees = rankedNominees.slice(0, 3);

  const comments = (nominee?.voters ?? [])
    .map((voter) => voter.comment?.trim())
    .filter((comment): comment is string => Boolean(comment));

  // ------------------------------------------------------
  // LOADING
  // ------------------------------------------------------

  if (isLoading) {
    return <ProjectLoading />;
  }

  // ------------------------------------------------------
  // PROJECT UNAVAILABLE
  // ------------------------------------------------------

  if (!currentProject) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07110c] px-4 py-8 text-white">
        <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />

        <div className="relative w-full max-w-md rounded-3xl border border-emerald-400/15 bg-[#0b1712]/90 p-8 text-center shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10">
            <Vote className="h-8 w-8 text-emerald-400" />
          </div>

          <h1 className="text-xl font-semibold text-white">
            Project unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-400">
            {lookupError ||
              "The project information is not currently available. Please return to your dashboard and try again."}
          </p>

          <Link
            href="/home"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-[#04120b] transition hover:bg-emerald-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  // ------------------------------------------------------
  // NOMINEE UNAVAILABLE
  // ------------------------------------------------------

  if (!nominee) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07110c] px-4 py-8 text-white">
        <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-[120px]" />

        <div className="relative w-full max-w-md rounded-3xl border border-emerald-400/15 bg-[#0b1712]/90 p-8 text-center shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10">
            <Users className="h-8 w-8 text-emerald-400" />
          </div>

          <h1 className="text-xl font-semibold text-white">
            Nominee not found
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-400">
            This nominee could not be found in the current project. The nominee
            may have been removed or may belong to another project.
          </p>

          <Link
            href="/home"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-[#04120b] transition hover:bg-emerald-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  const isWinner = rank === 1;

  // ------------------------------------------------------
  // MAIN RENDER
  // ------------------------------------------------------

  return (
    <main className="relative min-h-screen w-full max-w-full overflow-x-clip px-1 py-5 text-white sm:px-6 lg:px-8">
      <div className="relative z-10 mx-auto w-full min-w-0 max-w-7xl">

        {/* --------------------------------------------------
            NAVIGATION AND PAGE HEADING
        -------------------------------------------------- */}

        <div className="mb-7 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <Link
              href={`/home/share/${linkingId ?? currentProject.id}`}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.035] px-4 py-2 text-xs font-medium text-gray-300 transition hover:border-emerald-400/30 hover:bg-emerald-400/10 hover:text-emerald-300"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to nominees
            </Link>

            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-400">
              VoteSphere / Nominee profile
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Candidate overview
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Explore nominee information, voting performance and feedback.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-4 py-2 sm:self-center">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
            <span className="text-xs font-medium text-emerald-300">
              Election profile
            </span>
          </div>
        </div>

        {/* --------------------------------------------------
            PROFILE OVERVIEW
        -------------------------------------------------- */}

        <section className="relative mb-6 w-full min-w-0 overflow-hidden rounded-[2rem] border border-emerald-400/15 bg-[#0b1912] shadow-[0_25px_90px_rgba(0,0,0,0.3)]">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.09] via-transparent to-transparent" />
          <div className="absolute -right-20 -top-36 h-96 w-96 rounded-full bg-emerald-400/[0.08] blur-[100px]" />

          <div className="relative grid min-w-0 gap-8 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:p-10">

            {/* Nominee identity */}

            <div className="flex min-w-0 flex-col gap-6 sm:flex-row sm:items-center">
              <div className="relative mx-auto shrink-0 sm:mx-0">
                {nominee.image ? (
                  <img
                    src={nominee.image}
                    alt={nominee.name || "Nominee"}
                    className="h-36 w-36 rounded-[2rem] border-2 border-emerald-400/30 object-cover shadow-[0_0_45px_rgba(16,185,129,0.16)] sm:h-44 sm:w-44"
                  />
                ) : (
                  <div className="flex h-36 w-36 items-center justify-center rounded-[2rem] border-2 border-emerald-400/25 bg-gradient-to-br from-emerald-400/20 to-emerald-950/60 text-4xl font-bold text-emerald-300 shadow-[0_0_45px_rgba(16,185,129,0.12)] sm:h-44 sm:w-44 sm:text-5xl">
                    {getInitials(nominee.name)}
                  </div>
                )}

                {isWinner && (
                  <div className="absolute -bottom-3 -right-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-yellow-300/30 bg-[#30270d] shadow-xl">
                    <Crown className="h-6 w-6 text-yellow-300" />
                  </div>
                )}
              </div>

              <div className="min-w-0 text-center sm:text-left">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Nominee profile
                </div>

                <h2 className="break-words text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                  {nominee.name || "Unnamed nominee"}
                </h2>

                <p className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm text-gray-400 sm:justify-start">
                  <Vote className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span className="break-words">
                    {currentProject.name || "Election project"}
                  </span>
                </p>

                {nominee.created_at && (
                  <p className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500 sm:justify-start">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                    Joined {formatDate(nominee.created_at)}
                  </p>
                )}

                {isWinner ? (
                  <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-yellow-300/20 bg-yellow-300/[0.07] px-4 py-2 text-xs font-semibold text-yellow-200">
                    <Trophy className="h-4 w-4" />
                    Currently leading this election
                  </div>
                ) : (
                  <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 py-2 text-xs font-medium text-gray-400">
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                    Candidate performance profile
                  </div>
                )}
              </div>
            </div>

            {/* Profile quick information */}

            <div className="grid w-full min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 lg:w-[390px] lg:grid-cols-2">

              <div className="min-w-0 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.06] p-4">
                <Vote className="mb-3 h-5 w-5 text-emerald-300" />
                <p className="text-3xl font-bold tabular-nums text-white">
                  {voteCount}
                </p>
                <p className="mt-1 text-[11px] text-gray-500">
                  Total votes
                </p>
              </div>

              <div className="min-w-0 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
                <Trophy className="mb-3 h-5 w-5 text-yellow-300" />
                <p className="text-3xl font-bold tabular-nums text-white">
                  {rank > 0 ? `#${rank}` : "—"}
                </p>
                <p className="mt-1 text-[11px] text-gray-500">
                  Current position
                </p>
              </div>

              <div className="col-span-2 min-w-0 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 sm:col-span-1 lg:col-span-2">
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Users className="mb-3 h-5 w-5 text-blue-300" />
                    <p className="text-3xl font-bold tabular-nums text-white">
                      {voteShare}%
                    </p>
                    <p className="mt-1 text-[11px] text-gray-500">
                      Share of all votes
                    </p>
                  </div>

                  {/* Animated SVG Circular Chart */}

                  <CircularProgress
                    percentage={voteShare}
                    size={68}
                    strokeWidth={5}
                  />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* --------------------------------------------------
            MAIN CONTENT LAYOUT
        -------------------------------------------------- */}

        <div className="grid w-full min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-12">

          {/* LEFT CONTENT */}

          <div className="min-w-0 w-full space-y-6 xl:col-span-7">

            {/* --------------------------------------------------
                VOTING PERFORMANCE
            -------------------------------------------------- */}

            <section className="w-full min-w-0 overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-[#0b1712]/90 p-5 shadow-xl shadow-black/10 sm:p-7">
              <div className="mb-6 flex min-w-0 flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10">
                      <ChartNoAxesColumnIncreasing className="h-4 w-4 text-emerald-400" />
                    </div>
                    <h2 className="text-base font-semibold text-white">
                      Voting performance
                    </h2>
                  </div>

                  <p className="text-xs text-gray-500">
                    An overview of this nominee&apos;s voting results.
                  </p>
                </div>

                <span className="shrink-0 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1.5 text-xs font-semibold text-emerald-300">
                  {voteShare}% vote share
                </span>
              </div>

              <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3">

                <div className="min-w-0 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                  <p className="text-2xl font-bold text-white">
                    {voteCount}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Votes received
                  </p>
                </div>

                <div className="min-w-0 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                  <p className="text-2xl font-bold text-white">
                    {rank > 0 ? `#${rank}` : "—"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Election position
                  </p>
                </div>

                <div className="col-span-2 min-w-0 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 sm:col-span-1">
                  <p className="text-2xl font-bold text-white">
                    {totalVotes}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Total project votes
                  </p>
                </div>

              </div>

              {/* Performance against leader */}

              <div className="mt-5 min-w-0 rounded-2xl border border-emerald-400/15 bg-gradient-to-br from-emerald-400/[0.07] to-transparent p-5 sm:p-6">
                <div className="mb-5 flex min-w-0 items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-white">
                      Performance against the leader
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      Your votes compared with the highest vote count
                    </p>
                  </div>

                  <span className="shrink-0 text-2xl font-bold tabular-nums text-emerald-300">
                    {progress}%
                  </span>
                </div>

                <div className="h-3 w-full overflow-hidden rounded-full bg-black/40">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-700 via-emerald-500 to-emerald-300 transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500">
                  <span>{voteCount} votes received</span>
                  <span>{leadingVotes} leading votes</span>
                </div>
              </div>
            </section>

            {/* --------------------------------------------------
                MANIFESTO
            -------------------------------------------------- */}

            <section className="w-full min-w-0 overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-[#0b1712]/90 p-5 shadow-xl shadow-black/10 sm:p-7">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-400/[0.07]">
                  <Award className="h-5 w-5 text-emerald-400" />
                </div>

                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-white">
                    Manifesto
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    Candidate&apos;s vision and promises
                  </p>
                </div>
              </div>

              {nominee.manifesto?.trim() ? (
                <div className="w-full min-w-0 overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 sm:p-6">
                  <p className="whitespace-pre-wrap break-words text-sm leading-8 text-gray-300">
                    {nominee.manifesto}
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-8 text-center">
                  <Award className="mx-auto mb-3 h-6 w-6 text-gray-600" />
                  <p className="text-sm font-medium text-gray-400">
                    No manifesto available
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    This nominee has not added a manifesto yet.
                  </p>
                </div>
              )}
            </section>

            {/* --------------------------------------------------
                ELECTION DASHBOARD
            -------------------------------------------------- */}

            <section className="w-full min-w-0 overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-[#0b1712]/90 p-5 shadow-xl shadow-black/10 sm:p-7">
              <div className="mb-6 flex min-w-0 flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-yellow-300/15 bg-yellow-300/[0.07]">
                    <Trophy className="h-5 w-5 text-yellow-300" />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-white">
                      Election dashboard
                    </h2>
                    <p className="mt-1 text-xs text-gray-500">
                      Top nominees ranked by votes received
                    </p>
                  </div>
                </div>

                <span className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1.5 text-xs text-gray-400">
                  Showing {topNominees.length} of {rankedNominees.length}
                </span>
              </div>

              {topNominees.length > 0 ? (
                <div className="w-full min-w-0 space-y-4">
                  {topNominees.map((item) => {
                    const itemVotes = item.voters?.length ?? 0;

                    const percentage =
                      totalVotes > 0
                        ? (itemVotes / totalVotes) * 100
                        : 0;

                    const isCurrentNominee = item.id === nominee.id;

                    const itemRank =
                      rankedNominees.filter(
                        (other) =>
                          (other.voters?.length ?? 0) > itemVotes
                      ).length + 1;

                    return (
                      <div
                        key={item.id}
                        className={`flex w-full min-w-0 items-center justify-between gap-3 rounded-2xl border p-3 transition sm:gap-4 sm:p-4 ${
                          isCurrentNominee
                            ? "border-emerald-400/25 bg-emerald-400/[0.055]"
                            : "border-white/[0.06] bg-white/[0.02]"
                        }`}
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-xs font-bold text-gray-300 sm:h-9 sm:w-9">
                            {itemRank === 1 ? (
                              <Crown className="h-4 w-4 text-yellow-300" />
                            ) : (
                              `#${itemRank}`
                            )}
                          </div>

                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name || "Nominee"}
                              className="h-9 w-9 shrink-0 rounded-xl border border-white/10 object-cover sm:h-10 sm:w-10"
                            />
                          ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-sm font-semibold text-gray-300 sm:h-10 sm:w-10">
                              {getInitials(item.name)}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-white">
                              {item.name || "Unnamed nominee"}
                            </p>
                            <p className="mt-0.5 text-[11px] text-gray-500">
                              {itemVotes.toLocaleString()}{" "}
                              {itemVotes === 1 ? "vote" : "votes"}
                            </p>
                          </div>
                        </div>

                        {/* Animated nominee vote chart */}

                        <CircularProgress
                          percentage={Math.round(percentage)}
                          size={58}
                          strokeWidth={5}
                          color={
                            isCurrentNominee
                              ? "text-emerald-300"
                              : itemRank === 1
                                ? "text-yellow-300"
                                : "text-emerald-500"
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
                  <Users className="mx-auto mb-3 h-6 w-6 text-gray-600" />
                  <p className="text-sm text-gray-400">
                    No nominees available
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* --------------------------------------------------
              RIGHT CONTENT
          -------------------------------------------------- */}

          <div className="min-w-0 w-full space-y-6 xl:col-span-5">

            {/* --------------------------------------------------
                ACHIEVEMENTS
            -------------------------------------------------- */}

            <section className="w-full min-w-0 overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-[#0b1712]/90 p-5 shadow-xl shadow-black/10 sm:p-7">
              <div className="mb-6 flex min-w-0 items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-400/[0.07]">
                    <Medal className="h-5 w-5 text-emerald-400" />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-white">
                      Achievements
                    </h2>
                    <p className="mt-1 text-xs text-gray-500">
                      Candidate&apos;s accomplishments
                    </p>
                  </div>
                </div>

                <span className="shrink-0 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1.5 text-xs font-semibold text-emerald-300">
                  {nominee.achievements?.length ?? 0}
                </span>
              </div>

              {(nominee.achievements?.length ?? 0) > 0 ? (
                <div className="w-full min-w-0 space-y-3">
                  {nominee.achievements?.map((achievement, index) => (
                    <div
                      key={achievement.id ?? `${achievement.project}-${index}`}
                      className="group flex w-full min-w-0 items-start gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 transition hover:border-emerald-400/20 hover:bg-emerald-400/[0.035]"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-400/[0.08]">
                        <Award className="h-5 w-5 text-emerald-300" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-medium leading-6 text-gray-200">
                          {achievement.project || "Achievement"}
                        </p>

                        {achievement.created_at && (
                          <p className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                            <CalendarDays className="h-3 w-3 shrink-0" />
                            {formatDate(achievement.created_at)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-10 text-center">
                  <Award className="mx-auto mb-3 h-7 w-7 text-gray-600" />
                  <p className="text-sm font-medium text-gray-400">
                    No achievements available
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    This nominee has not added any achievements yet.
                  </p>
                </div>
              )}
            </section>

            {/* --------------------------------------------------
                VOTER COMMENTS
            -------------------------------------------------- */}

            <section className="w-full min-w-0 overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-[#0b1712]/90 p-5 shadow-xl shadow-black/10 sm:p-7">
              <div className="mb-6 flex min-w-0 items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-400/15 bg-blue-400/[0.07]">
                    <MessageCircle className="h-5 w-5 text-blue-300" />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-white">
                      Voter comments
                    </h2>
                    <p className="mt-1 text-xs text-gray-500">
                      Feedback from people who voted
                    </p>
                  </div>
                </div>

                <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-gray-400">
                  {comments.length} comments
                </span>
              </div>

              {comments.length > 0 ? (
                <div className="max-h-[650px] w-full min-w-0 space-y-3 overflow-y-auto overflow-x-hidden pr-1">
                  {comments.map((comment, index) => (
                    <div
                      key={`${nominee.id}-comment-${index}`}
                      className="w-full min-w-0 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 transition hover:border-blue-400/15 hover:bg-white/[0.04]"
                    >
                      <div className="mb-3 flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-400/[0.08]">
                          <MessageCircle className="h-3.5 w-3.5 text-blue-300" />
                        </div>

                        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-500">
                          Voter feedback
                        </span>
                      </div>

                      <p className="whitespace-pre-wrap break-words text-sm leading-7 text-gray-300">
                        {comment}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-10 text-center">
                  <MessageCircle className="mx-auto mb-3 h-7 w-7 text-gray-600" />
                  <p className="text-sm font-medium text-gray-400">
                    No comments yet
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    Voter comments will appear here when they are available.
                  </p>
                </div>
              )}
            </section>

            {/* --------------------------------------------------
                PROFILE SUMMARY
            -------------------------------------------------- */}

            <section className="w-full min-w-0 overflow-hidden rounded-[1.75rem] border border-emerald-400/15 bg-gradient-to-br from-emerald-500/[0.09] to-[#0b1712] p-6 sm:p-7">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/[0.08]">
                  <Sparkles className="h-5 w-5 text-emerald-300" />
                </div>

                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-white">
                    Profile summary
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    Election activity overview
                  </p>
                </div>
              </div>

              <div className="mt-5 min-w-0 space-y-4">
                <div className="flex min-w-0 items-center justify-between gap-3 border-b border-white/[0.07] pb-3">
                  <span className="shrink-0 text-xs text-gray-500">
                    Election project
                  </span>
                  <span className="max-w-[60%] truncate text-right text-xs font-medium text-gray-200">
                    {currentProject.name || "Election project"}
                  </span>
                </div>

                <div className="flex min-w-0 items-center justify-between gap-3 border-b border-white/[0.07] pb-3">
                  <span className="shrink-0 text-xs text-gray-500">
                    Nominee since
                  </span>
                  <span className="text-right text-xs font-medium text-gray-200">
                    {formatDate(nominee.created_at)}
                  </span>
                </div>

                <div className="flex min-w-0 items-center justify-between gap-3 border-b border-white/[0.07] pb-3">
                  <span className="shrink-0 text-xs text-gray-500">
                    Achievements
                  </span>
                  <span className="text-xs font-medium text-gray-200">
                    {nominee.achievements?.length ?? 0}
                  </span>
                </div>

                <div className="flex min-w-0 items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-gray-500">
                    Voter comments
                  </span>
                  <span className="text-xs font-medium text-gray-200">
                    {comments.length}
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* --------------------------------------------------
            FOOTER
        -------------------------------------------------- */}

        <footer className="mt-8 border-t border-white/[0.07] px-3 py-7 text-center">
          <p className="text-xs leading-6 text-gray-500">
            Voting performance is based on the votes currently available
            for nominees in this project.
          </p>

          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-500/70">
            VoteSphere
          </p>
        </footer>
      </div>
    </main>
  );
}
