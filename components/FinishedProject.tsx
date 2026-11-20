"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Crown,
  FolderPlus,
  Sparkles,
  Trophy,
  Users,
  Vote,
  Medal,
  AlertCircle,
} from "lucide-react";

import useApp from "@/lib/useApp";
import { getElectionDurationMs } from "@/lib/electionTimer";
import type { Project } from "@/types/project";

type ActivityNominee = {
  id?: string;
  name?: string | null;
  voters?: unknown[] | null;
};

type ActivityProject = Project & {
  nominees?: ActivityNominee[] | null;
  created_at?: string | null;
  duration_ms?: number | string | null;
};

function formatDuration(milliseconds: number) {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) {
    return "Not available";
  }

  const totalSeconds = Math.floor(milliseconds / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];

  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  // Show seconds when the election took less than a minute.
  if (parts.length === 0 || (days === 0 && hours === 0 && minutes === 0)) {
    parts.push(`${seconds}s`);
  }

  return parts.join(" ");
}

function formatDate(date: string | null | undefined) {
  if (!date) return "Date unavailable";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

export default function FinishedProject() {
  const router = useRouter();
  const { project } = useApp();

  const activity = useMemo(() => {
    const projects = (project ?? []) as ActivityProject[];

    if (projects.length === 0) {
      return null;
    }

    // Select the project with the earliest valid creation date.
    const sortedProjects = [...projects].sort((a, b) => {
      const dateA = a.created_at
        ? new Date(a.created_at).getTime()
        : Number.POSITIVE_INFINITY;

      const dateB = b.created_at
        ? new Date(b.created_at).getTime()
        : Number.POSITIVE_INFINITY;

      return dateA - dateB;
    });

    const selectedProject = sortedProjects[0];

    const nominees = selectedProject.nominees ?? [];

    // Count the voters attached to each nominee.
    const nomineeResults = nominees.map((nominee) => ({
      ...nominee,
      voteCount: nominee.voters?.length ?? 0,
    }));

    const highestVotes = Math.max(
      0,
      ...nomineeResults.map((nominee) => nominee.voteCount)
    );

    // No winner is declared when nobody received a vote.
    const winners =
      highestVotes > 0
        ? nomineeResults.filter(
            (nominee) => nominee.voteCount === highestVotes
          )
        : [];

    const createdAt = selectedProject.created_at
      ? new Date(selectedProject.created_at).getTime()
      : Number.NaN;

    // duration_ms stores the selected election duration in milliseconds.
    const durationValue = getElectionDurationMs(
      selectedProject.duration_ms,
      selectedProject.created_at
    );
    const duration =
      Number.isFinite(durationValue) && durationValue > 0
        ? durationValue
        : null;

    const totalVotes = nomineeResults.reduce(
      (total, nominee) => total + nominee.voteCount,
      0
    );

    return {
      project: selectedProject,
      nominees: nomineeResults,
      winners,
      highestVotes,
      totalVotes,
      duration,
    };
  }, [project]);

  const handleCreateProject = () => {
    router.push("/home/starting");
  };

  return (
    <main className="relative min-h-screen overflow-hidden  px-2 py-4 text-white sm:px-2 lg:px-4">
      {/* Ambient background */}

      <div className="relative mx-auto max-w-6xl">
        {/* Top navigation */}
        <header className="mb-10 flex flex-col gap-5 border-b border-white/[0.07] pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.09] text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.08)]">
              <Vote size={21} />
            </div>

            <div>
              <h1 className="text-lg font-semibold tracking-tight text-white">
                VoteSphere
              </h1>
              <p className="text-xs text-white/40">
                Election workspace
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCreateProject}
            className="group inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400 px-5 py-3 text-sm font-semibold text-[#04130c] shadow-[0_8px_30px_rgba(16,185,129,0.12)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-300 hover:shadow-[0_10px_35px_rgba(16,185,129,0.2)] active:translate-y-0"
          >
            <FolderPlus size={17} />
            Create New Project
            <ArrowRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </button>
        </header>

        {/* Page introduction */}
        <section className="mb-9">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1.5 text-xs font-medium text-emerald-300">
            <Sparkles size={13} />
            Workspace activity
          </div>

          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Your election{" "}
            <span className="text-emerald-400">journey.</span>
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45 sm:text-base">
            Take a look at the election activity in your workspace, celebrate
            the results, and start a new project whenever you are ready.
          </p>
        </section>

        {!activity ? (
          /* Empty state */
          <section className="relative overflow-hidden rounded-3xl border border-white/[0.09] bg-white/[0.025] px-6 py-16 text-center shadow-2xl shadow-black/20 sm:px-12">
            <div className="pointer-events-none absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 rounded-full bg-emerald-400/[0.08] blur-[70px]" />

            <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300">
              <Vote size={34} />
            </div>

            <h3 className="text-xl font-semibold text-white">
              No election activity yet
            </h3>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/45">
              Your election activity will appear here once you have a project
              in your workspace. Start by creating your first project.
            </p>

            <button
              type="button"
              onClick={handleCreateProject}
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-[#04130c] transition hover:bg-emerald-300"
            >
              <FolderPlus size={17} />
              Create a project
              <ArrowRight size={16} />
            </button>
          </section>
        ) : (
          <>
            {/* Activity heading */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">
                  Recorded activity
                </p>
                <h3 className="mt-1 text-lg font-semibold text-white">
                  Election overview
                </h3>
              </div>

              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1.5 text-xs text-emerald-300">
                <CheckCircle2 size={14} />
                Election completed
              </div>
            </div>

            {/* Main project card */}
            <section className="relative overflow-hidden rounded-3xl border border-emerald-400/15 bg-gradient-to-br from-[#10251a] via-[#0b1711] to-[#09110d] p-5 shadow-[0_25px_90px_rgba(0,0,0,0.28)] sm:p-8">
              <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full border border-emerald-300/[0.07]" />
              <div className="pointer-events-none absolute -right-10 -top-16 h-52 w-52 rounded-full border border-emerald-300/[0.06]" />
              <div className="pointer-events-none absolute right-10 top-10 h-32 w-32 rounded-full bg-emerald-400/[0.08] blur-[55px]" />

              <div className="relative">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-black/20 px-3 py-1.5 text-xs font-medium text-emerald-200">
                    <Trophy size={13} />
                    Featured election
                  </div>

                  <span className="text-xs text-white/35">
                    {formatDate(activity.project.created_at)}
                  </span>
                </div>

                <div className="mt-7 max-w-3xl">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/60">
                    Project heading
                  </p>

                  <h3 className="break-words text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    {activity.project.name || "Untitled election"}
                  </h3>

                  {activity.project.description && (
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-white/50">
                      {activity.project.description}
                    </p>
                  )}
                </div>

                {/* Winner */}
                <div className="mt-8 rounded-2xl border border-emerald-300/15 bg-black/20 p-5 sm:p-6">
                  <div className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200/65">
                    <Crown size={15} />
                    Election result
                  </div>

                  {activity.winners.length === 0 ? (
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-white/[0.06] p-3 text-white/50">
                        <AlertCircle size={22} />
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          No winner recorded
                        </p>
                        <p className="mt-1 text-sm text-white/40">
                          There are no recorded votes for this election.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-yellow-300/20 bg-yellow-300/[0.09] text-yellow-300 shadow-[0_0_25px_rgba(250,204,21,0.07)]">
                          <Trophy size={27} />
                        </div>

                        <div>
                          <p className="text-xs text-white/40">
                            {activity.winners.length > 1
                              ? "Joint winners"
                              : "Winning nominee"}
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            {activity.winners.map((winner, index) => (
                              <span
                                key={winner.id ?? `${winner.name}-${index}`}
                                className="text-xl font-semibold text-white sm:text-2xl"
                              >
                                {winner.name || "Unnamed nominee"}
                                {index < activity.winners.length - 1 && (
                                  <span className="text-emerald-300">,</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-yellow-300/15 bg-yellow-300/[0.06] px-4 py-3 sm:text-right">
                        <p className="text-xs text-yellow-100/50">
                          {activity.winners.length > 1
                            ? "Votes each"
                            : "Total votes"}
                        </p>
                        <p className="mt-1 text-2xl font-bold tabular-nums text-yellow-200">
                          {activity.highestVotes.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Statistics */}
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/[0.07] bg-black/15 p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/40">
                        Election duration
                      </span>
                      <Clock3 size={17} className="text-emerald-300" />
                    </div>
                    <p className="mt-3 text-2xl font-semibold text-white">
                      {activity.duration !== null
                        ? formatDuration(activity.duration)
                        : "—"}
                    </p>
                    <p className="mt-1 text-xs text-white/30">
                      Time allocated for the election
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/[0.07] bg-black/15 p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/40">
                        Total votes
                      </span>
                      <Users size={17} className="text-emerald-300" />
                    </div>
                    <p className="mt-3 text-2xl font-semibold text-white">
                      {activity.totalVotes.toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-white/30">
                      Votes across all nominees
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/[0.07] bg-black/15 p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/40">
                        Nominees
                      </span>
                      <Medal size={17} className="text-emerald-300" />
                    </div>
                    <p className="mt-3 text-2xl font-semibold text-white">
                      {activity.nominees.length}
                    </p>
                    <p className="mt-1 text-xs text-white/30">
                      Participants in this election
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Nominee results */}
            <section className="mt-8">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-white">
                    Nominee results
                  </h3>
                  <p className="mt-1 text-xs text-white/40">
                    Vote distribution for this election
                  </p>
                </div>

                <span className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-white/45">
                  {activity.nominees.length} nominees
                </span>
              </div>

              {activity.nominees.length === 0 ? (
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 text-center text-sm text-white/40">
                  No nominees were recorded for this project.
                </div>
              ) : (
                <div className="space-y-3">
                  {[...activity.nominees]
                    .sort((a, b) => b.voteCount - a.voteCount)
                    .map((nominee, index) => {
                      const percentage =
                        activity.totalVotes > 0
                          ? (nominee.voteCount / activity.totalVotes) * 100
                          : 0;

                      const isWinner =
                        activity.winners.some(
                          (winner) =>
                            winner.id && winner.id === nominee.id
                        ) ||
                        (activity.winners.length === 1 &&
                          !activity.winners[0].id &&
                          activity.winners[0].name === nominee.name);

                      return (
                        <div
                          key={nominee.id ?? `${nominee.name}-${index}`}
                          className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 transition-colors hover:border-emerald-400/20 sm:p-5"
                        >
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold ${
                                  isWinner
                                    ? "bg-emerald-400/15 text-emerald-300"
                                    : "bg-white/[0.06] text-white/45"
                                }`}
                              >
                                {index + 1}
                              </div>

                              <div>
                                <p className="font-medium text-white">
                                  {nominee.name || "Unnamed nominee"}
                                </p>
                                {isWinner && (
                                  <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-300">
                                    <Crown size={11} />
                                    Winner
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="font-semibold tabular-nums text-white">
                                {nominee.voteCount.toLocaleString()} votes
                              </p>
                              <p className="mt-0.5 text-xs text-white/35">
                                {percentage.toFixed(1)}%
                              </p>
                            </div>
                          </div>

                          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                isWinner
                                  ? "bg-emerald-400"
                                  : "bg-white/25"
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </section>

            {/* Bottom call to action */}
            <section className="mt-9 flex flex-col items-start justify-between gap-5 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.045] p-5 sm:flex-row sm:items-center sm:p-6">
              <div>
                <h3 className="font-semibold text-white">
                  Ready for another election?
                </h3>
                <p className="mt-1 text-sm text-white/40">
                  Create a new project and begin your next election.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCreateProject}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400 hover:text-[#04130c]"
              >
                Start a new project
                <ArrowRight size={16} />
              </button>
            </section>
          </>
        )}

        <footer className="mt-10 border-t border-white/[0.06] py-6 text-center text-xs text-white/25">
          VoteSphere · Your elections, your decisions.
        </footer>
      </div>
    </main>
  );
}