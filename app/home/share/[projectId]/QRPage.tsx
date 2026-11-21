
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Clock3,
  Info,
  Loader2,
  MessageSquare,
  ShieldCheck,
  Users,
  Vote,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import type { Achievement, Nominee, Project } from "@/types/project";
import ProjectLoading from "@/components/ProjectLoading";

type QRPageProps = {
  projectId: string;
};

type VoteForm = {
  name: string;
  comment: string;
};

type VoteCheckResult = {
  hasVoted: boolean;
  voterId: string;
};

type VoterCommentRow = {
  nominee_id: string;
  comment: string | null;
};

type QueryPage<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

const QUERY_PAGE_SIZE = 100;

async function fetchAllPages<T>(
  fetchPage: (
    from: number,
    to: number
  ) => PromiseLike<QueryPage<T>>
): Promise<T[]> {
  const rows: T[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await fetchPage(
      offset,
      offset + QUERY_PAGE_SIZE - 1
    );

    if (error) throw error;

    const page = data ?? [];
    if (page.length === 0) return rows;

    rows.push(...page);
    offset += page.length;
  }
}

const getVoteStorageKey = (projectId: string | number) =>
  `votesphere-voted-${projectId}`;

const isValidUUID = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );

const createVoterId = () => crypto.randomUUID();

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

export default function QRPage({ projectId }: QRPageProps) {
  const router = useRouter();
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [selectedNominee, setSelectedNominee] =
    useState<Nominee | null>(null);

  const [voteForm, setVoteForm] = useState<VoteForm>({
    name: "",
    comment: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteError, setVoteError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showAlreadyVoted, setShowAlreadyVoted] = useState(false);

  // Fetch the exact project identified by the URL projectId.
  // This page does not depend on the newest project in app context.
  const refreshProject = useCallback(async (): Promise<Project> => {
    if (!projectId) {
      throw new Error("No election ID was provided.");
    }

    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("deleted", false)
      .maybeSingle();

    if (projectError) throw projectError;

    if (!projectData) {
      throw new Error("This election could not be found or is no longer available.");
    }

    const nomineeData = await fetchAllPages<Nominee>((from, to) =>
      supabase
        .from("nominees")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true })
        .range(from, to)
    );

    const nomineeIds = nomineeData.map((nominee) => nominee.id);
    let achievementData: Achievement[] = [];
    let voterData: VoterCommentRow[] = [];

    if (nomineeIds.length > 0) {
      [achievementData, voterData] = await Promise.all([
        fetchAllPages<Achievement>((from, to) =>
          supabase
            .from("achievements")
            .select("*")
            .in("nominee_id", nomineeIds)
            .order("created_at", { ascending: true })
            .range(from, to)
        ),
        fetchAllPages<VoterCommentRow>((from, to) =>
          supabase
            .from("voters")
            .select("nominee_id, comment")
            .eq("project_id", projectId)
            .range(from, to)
        ),
      ]);
    }

    const achievementsByNominee = new Map<string, Achievement[]>();
    for (const achievement of achievementData) {
      const nomineeAchievements =
        achievementsByNominee.get(achievement.nominee_id) ?? [];
      nomineeAchievements.push(achievement);
      achievementsByNominee.set(
        achievement.nominee_id,
        nomineeAchievements
      );
    }

    const votersByNominee = new Map<string, VoterCommentRow[]>();
    for (const voter of voterData) {
      const nomineeVoters = votersByNominee.get(voter.nominee_id) ?? [];
      nomineeVoters.push(voter);
      votersByNominee.set(voter.nominee_id, nomineeVoters);
    }

    const nomineesWithData = nomineeData.map((nominee) => ({
      ...nominee,
      achievements: achievementsByNominee.get(nominee.id) ?? [],
      voters: votersByNominee.get(nominee.id) ?? [],
    }));

    const updatedProject = {
      ...projectData,
      nominees: nomineesWithData,
    } as Project;

    setCurrentProject(updatedProject);

    return updatedProject;
  }, [projectId]);

  // Check whether this browser has already voted in this exact project.
  const checkVotingStatus = useCallback(
    async (selectedProjectId: string | number): Promise<VoteCheckResult> => {
      const storageKey = getVoteStorageKey(selectedProjectId);

      let voterId = localStorage.getItem(storageKey);

      if (!voterId || !isValidUUID(voterId)) {
        voterId = createVoterId();
        localStorage.setItem(storageKey, voterId);
      }

      const { data, error } = await supabase
        .from("voters")
        .select("id, project_id")
        .eq("id", voterId)
        .eq("project_id", selectedProjectId)
        .maybeSingle();

      if (error) throw error;

      const alreadyVoted = Boolean(data);

      setHasVoted(alreadyVoted);

      return {
        hasVoted: alreadyVoted,
        voterId,
      };
    },
    []
  );

  // Load the project using the projectId supplied by the route.
  // The effect does not rely on useApp, taskKey, or a project array.
  useEffect(() => {
    if (!projectId) {
      setLoadError("No election ID was provided.");
      setLoadingProject(false);
      return;
    }

    let active = true;

    const loadProject = async () => {
      setLoadingProject(true);
      setLoadError("");

      try {
        const updated = await refreshProject();
        const voteStatus = await checkVotingStatus(updated.id);

        if (active) {
          setHasVoted(voteStatus.hasVoted);
        }
      } catch (error: unknown) {
        if (active) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Unable to load this election."
          );
        }
      } finally {
        if (active) {
          setLoadingProject(false);
        }
      }
    };

    void loadProject();

    // Listen for votes belonging only to this project.
    const channel = supabase
      .channel(`nominee-votes-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "voters",
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          void refreshProject().catch((error) => {
            console.error("Unable to refresh election results:", error);
          });
        }
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [projectId, refreshProject, checkVotingStatus]);

  // Hide the success notification automatically.
  useEffect(() => {
    if (!successMessage) return;

    const timeout = window.setTimeout(() => {
      setSuccessMessage("");
    }, 4500);

    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  // Sort nominees by vote count, highest first.
  // Nominees with zero votes remain in the list.
  const nominees = useMemo(() => {
    return [...(currentProject?.nominees ?? [])].sort((a, b) => {
      const votesA = a.voters?.length ?? 0;
      const votesB = b.voters?.length ?? 0;

      return votesB - votesA;
    });
  }, [currentProject?.nominees]);

  const totalVotes = nominees.reduce(
    (total, nominee) => total + (nominee.voters?.length ?? 0),
    0
  );

  const openVoteModal = async (nominee: Nominee) => {
    if (!currentProject?.id || submitting || hasVoted) return;

    setVoteError("");

    try {
      const voteStatus = await checkVotingStatus(currentProject.id);

      if (voteStatus.hasVoted) {
        setShowAlreadyVoted(true);
        return;
      }

      setSelectedNominee(nominee);
      setVoteForm({
        name: "",
        comment: "",
      });
    } catch (error: unknown) {
      console.error("Unable to check voting status:", error);

      setVoteError(
        error instanceof Error
          ? error.message
          : "We couldn't verify your voting status. Please try again."
      );
    }
  };

  const closeVoteModal = () => {
    if (submitting) return;

    setSelectedNominee(null);
    setVoteError("");

    setVoteForm({
      name: "",
      comment: "",
    });
  };

  // Submit a vote to the exact project identified by the route.
  const handleVote = async () => {
    if (!selectedNominee || !currentProject?.id || submitting) return;

    const name = voteForm.name.trim();
    const comment = voteForm.comment.trim();

    if (!name) {
      setVoteError("Please enter your name before voting.");
      return;
    }

    setSubmitting(true);
    setVoteError("");

    try {
      // Verify the exact browser UUID and project combination again.
      const voteStatus = await checkVotingStatus(currentProject.id);

      if (voteStatus.hasVoted) {
        setShowAlreadyVoted(true);
        setSelectedNominee(null);
        return;
      }

      const { error } = await supabase.from("voters").insert({
        id: voteStatus.voterId,
        project_id: currentProject.id,
        nominee_id: selectedNominee.id,
        name,
        comment: comment || null,
      });

      if (error) {
        // Check whether this exact voter/project combination
        // was inserted by another request.
        const {
          data: existingVote,
          error: checkError,
        } = await supabase
          .from("voters")
          .select("id")
          .eq("id", voteStatus.voterId)
          .eq("project_id", currentProject.id)
          .maybeSingle();

        if (checkError) throw checkError;

        if (existingVote) {
          setHasVoted(true);
          setShowAlreadyVoted(true);
          setSelectedNominee(null);
          return;
        }

        throw error;
      }

      setHasVoted(true);

      const nomineeName =
        selectedNominee.name || "your selected nominee";

      setSelectedNominee(null);

      setVoteForm({
        name: "",
        comment: "",
      });

      setSuccessMessage(
        `Thank you, ${name}! Your vote for ${nomineeName} was submitted successfully.`
      );

      // Fetch the latest data for this same project.
      try {
        await refreshProject();
        setLoadError("");
      } catch (refreshError: unknown) {
        console.error(
          "Vote saved, but project refresh failed:",
          refreshError
        );

        setLoadError(
          "Your vote was submitted, but the latest results could not be loaded. Please refresh the page."
        );
      }
    } catch (error: unknown) {
      console.error("Vote submission failed:", error);

      setVoteError(
        error instanceof Error
          ? error.message
          : "Your vote could not be submitted. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDetails = (nomineeId: string) => {
    router.push(`/home/nominees/${nomineeId}`);
  };

  const handleRefresh = async () => {
    setLoadingProject(true);
    setLoadError("");

    try {
      const updated = await refreshProject();
      const voteStatus = await checkVotingStatus(updated.id);

      setHasVoted(voteStatus.hasVoted);
    } catch (error: unknown) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Unable to reload the election."
      );
    } finally {
      setLoadingProject(false);
    }
  };

  // Loading the project from Supabase.
  if (loadingProject) {
    return <ProjectLoading />;
  }

  // Project not found or unable to load.
  if (loadError && !currentProject) {
    return (
      <div className="flex min-h-[calc(100dvh-5rem)] w-full items-center justify-center overflow-hidden px-4 py-4">
        <section className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/[0.09] bg-[#0b1510] p-7 text-center shadow-[0_25px_80px_rgba(0,0,0,0.35)] sm:p-9">
          <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-emerald-400/[0.08] blur-[65px]" />

          <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-400/20 bg-red-400/[0.08] text-red-300">
            <Info size={29} />
          </div>

          <h2 className="text-xl font-semibold tracking-tight text-white">
            Election unavailable
          </h2>

          <p className="mx-auto mt-3 max-w-sm break-words text-sm leading-6 text-white/45">
            {loadError}
          </p>

          <button
            type="button"
            onClick={() => void handleRefresh()}
            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3.5 text-sm font-semibold text-[#04130c] transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-300"
          >
            Try again
            <ArrowRight size={16} />
          </button>
        </section>
      </div>
    );
  }

  if (!currentProject) {
    return <ProjectLoading />;
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-2 py-4 text-white lg:px-6">
      <div className="pointer-events-none absolute left-1/4 top-0 h-72 w-72 rounded-full bg-emerald-500/[0.035] blur-[100px]" />
      <div className="pointer-events-none absolute bottom-20 right-0 h-64 w-64 rounded-full bg-emerald-400/[0.035] blur-[100px]" />

      <div className="relative mx-auto w-full max-w-7xl">
        {/* Election header */}
        <header className="mb-8 flex flex-col justify-between gap-5 border-b border-white/[0.07] pb-6 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-emerald-300/65">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              Live election
            </div>

            <h1 className="break-words text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {currentProject.name || "Untitled election"}
            </h1>

            <p className="mt-2 break-words text-sm text-white/40">
              {currentProject.description ||
                "View the nominees and cast your vote."}
            </p>
          </div>

          <div className="inline-flex w-fit shrink-0 items-center gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.06] px-3.5 py-2.5 text-xs font-medium text-emerald-300">
            <CheckCircle2 size={15} />
            Voting active
          </div>
        </header>

        {/* Election statistics */}
        <section className="mb-7 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40">Nominees</span>
              <Users size={17} className="text-emerald-300" />
            </div>

            <p className="mt-2 text-2xl font-semibold text-white">
              {nominees.length}
            </p>

            <p className="mt-1 text-xs text-white/30">
              Candidates in this election
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40">Total votes</span>
              <Vote size={17} className="text-emerald-300" />
            </div>

            <p className="mt-2 text-2xl font-semibold tabular-nums text-white">
              {totalVotes.toLocaleString()}
            </p>

            <p className="mt-1 text-xs text-white/30">
              Votes submitted so far
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40">Created</span>
              <Clock3 size={17} className="text-emerald-300" />
            </div>

            <p className="mt-2 text-base font-semibold text-white">
              {formatDate(currentProject.created_at)}
            </p>

            <p className="mt-1 text-xs text-white/30">
              Election creation date
            </p>
          </div>
        </section>

        {/* Refresh error */}
        {loadError && (
          <div
            role="alert"
            className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-amber-400/15 bg-amber-400/[0.05] p-3 text-xs text-amber-200"
          >
            <span>{loadError}</span>

            <button
              type="button"
              onClick={() => void handleRefresh()}
              className="shrink-0 underline underline-offset-2"
            >
              Refresh
            </button>
          </div>
        )}

        {/* Voter status */}
        {hasVoted && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.055] p-4">
            <ShieldCheck
              size={19}
              className="mt-0.5 shrink-0 text-emerald-300"
            />

            <div>
              <p className="text-sm font-semibold text-emerald-200">
                Your vote has been recorded
              </p>

              <p className="mt-1 text-xs leading-5 text-white/40">
                You have already submitted a vote for this election.
                You cannot vote again for this election.
              </p>
            </div>
          </div>
        )}

        {/* Nominee heading */}
        <section className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/30">
              Election participants
            </p>

            <h2 className="mt-1 text-xl font-semibold text-white">
              Meet the nominees
            </h2>

            <p className="mt-1 text-sm text-white/40">
              Nominees are arranged from the highest votes to the lowest.
            </p>
          </div>

          <span className="rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1.5 text-xs text-white/45">
            {nominees.length}{" "}
            {nominees.length === 1 ? "nominee" : "nominees"}
          </span>
        </section>

        {/* Nominee cards */}
        {nominees.length === 0 ? (
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.025] px-5 py-14 text-center">
            <Users className="mx-auto mb-4 text-white/30" size={30} />

            <h3 className="font-semibold text-white">
              No nominees available
            </h3>

            <p className="mt-2 text-sm text-white/40">
              Nominees will appear here when they are added to this election.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {nominees.map((nominee, index) => {
              const voteCount = nominee.voters?.length ?? 0;
              const comments = (nominee.voters ?? [])
                .map((voter) => voter.comment?.trim())
                .filter((comment): comment is string => Boolean(comment));

              const percentage =
                totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

              return (
                <article
                  key={nominee.id}
                  className="group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0b1510]/90 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400/20 hover:shadow-[0_18px_50px_rgba(0,0,0,0.22)] sm:p-6"
                >
                  <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-emerald-400/[0.035] blur-[65px] transition group-hover:bg-emerald-400/[0.07]" />

                  <div className="relative">
                    <div className="flex items-start gap-4">
                      {nominee.image ? (
                        <img
                          src={nominee.image}
                          alt={nominee.name || "Nominee"}
                          loading="lazy"
                          className="h-12 w-12 shrink-0 rounded-2xl border border-emerald-400/15 object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.08] text-lg font-semibold text-emerald-300">
                          {nominee.name?.trim().charAt(0).toUpperCase() || (
                            <Users size={22} />
                          )}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <h3 className="break-words text-lg font-semibold text-white">
                            {nominee.name || "Unnamed nominee"}
                          </h3>

                          {index === 0 && voteCount > 0 && (
                            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-2 py-1 text-[10px] font-semibold text-emerald-300">
                              Leading
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-white/35">
                          Election nominee
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-right">
                        <p className="text-lg font-semibold tabular-nums text-white">
                          {voteCount.toLocaleString()}
                        </p>

                        <p className="text-[10px] text-white/35">
                          {voteCount === 1 ? "vote" : "votes"}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mt-5">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-300/55">
                        Description
                      </p>

                      <p className="min-h-[48px] whitespace-pre-wrap break-words text-sm leading-6 text-white/50">
                        {nominee.manifesto ||
                          "This nominee has not provided a description yet."}
                      </p>
                    </div>

                    {(nominee.achievements?.length ?? 0) > 0 && (
                      <section className="mt-5">
                        <h4 className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-300/55">
                          <Award size={14} />
                          Achievements
                        </h4>
                        <ul className="space-y-2">
                          {nominee.achievements?.map((achievement) => (
                            <li
                              key={achievement.id}
                              className="rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-sm leading-5 text-white/55"
                            >
                              {achievement.project}
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    <section className="mt-5">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <h4 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
                          <MessageSquare size={14} />
                          Voter comments
                        </h4>
                        <span className="text-[11px] text-white/30">
                          {comments.length}
                        </span>
                      </div>

                      {comments.length > 0 ? (
                        <ul className="max-h-40 space-y-2 overflow-y-auto">
                          {comments.map((comment, commentIndex) => (
                            <li
                              key={`${nominee.id}-comment-${commentIndex}`}
                              className="whitespace-pre-wrap break-words rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-sm leading-5 text-white/55"
                            >
                              {comment}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-white/30">
                          No comments yet.
                        </p>
                      )}
                    </section>

                    {/* Vote progress */}
                    <div className="mt-6">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-xs text-white/40">
                          Vote distribution
                        </span>

                        <span className="text-xs font-semibold tabular-nums text-emerald-300">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>

                      <div
                        className="h-2 overflow-hidden rounded-full bg-white/[0.07]"
                        role="progressbar"
                        aria-label={`${nominee.name || "Nominee"} vote percentage`}
                        aria-valuenow={Number(percentage.toFixed(1))}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-300 transition-all duration-700 ease-out"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => handleDetails(nominee.id)}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.035] px-4 py-3 text-sm font-medium text-white/75 transition-all duration-300 hover:border-emerald-400/25 hover:bg-emerald-400/[0.07] hover:text-emerald-300"
                      >
                        <Info size={16} />
                        View details
                        <ArrowRight size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => void openVoteModal(nominee)}
                        disabled={hasVoted || submitting}
                        className="group/button inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-[#04130c] transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Vote size={16} />

                        {hasVoted ? "Already voted" : "Vote for nominee"}

                        {!hasVoted && (
                          <ArrowRight
                            size={15}
                            className="transition-transform group-hover/button:translate-x-1"
                          />
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <footer className="mt-10 border-t border-white/[0.06] py-6 text-center text-xs text-white/25">
          VoteSphere · Your voice, your decision.
        </footer>
      </div>

      {/* Success notification */}
      {successMessage && (
        <div
          role="status"
          className="fixed right-4 top-5 z-[120] flex w-[calc(100%-32px)] max-w-sm items-start gap-3 rounded-2xl border border-emerald-400/20 bg-[#10251a]/95 p-4 shadow-[0_15px_50px_rgba(0,0,0,0.4)] backdrop-blur-xl"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
            <CheckCircle2 size={19} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-emerald-200">
              Vote submitted successfully!
            </p>

            <p className="mt-1 text-xs leading-5 text-white/55">
              {successMessage}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            aria-label="Dismiss notification"
            className="rounded-lg p-1 text-white/40 transition hover:bg-white/[0.06] hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Already voted popup */}
      {showAlreadyVoted && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-white/[0.1] bg-[#0c1711] p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300">
              <ShieldCheck size={26} />
            </div>

            <h3 className="text-lg font-semibold text-white">
              Vote already submitted
            </h3>

            <p className="mt-2 text-sm leading-6 text-white/45">
              This voter ID already has a vote recorded for this election.
              You cannot vote again using this browser ID.
            </p>

            <button
              type="button"
              onClick={() => setShowAlreadyVoted(false)}
              className="mt-6 w-full rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-[#04130c] transition hover:bg-emerald-300"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* Voting modal */}
      {selectedNominee && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/75 px-4 py-6 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeVoteModal();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="vote-modal-title"
            className="relative my-auto w-full max-w-md overflow-hidden rounded-3xl border border-emerald-400/15 bg-[#0c1711] p-6 shadow-[0_25px_100px_rgba(0,0,0,0.6)] sm:p-7"
          >
            <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-emerald-400/[0.07] blur-[65px]" />

            <div className="relative">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300">
                    <Vote size={21} />
                  </div>

                  <h2
                    id="vote-modal-title"
                    className="text-xl font-semibold text-white"
                  >
                    Cast your vote
                  </h2>

                  <p className="mt-1 text-sm text-white/40">
                    You are voting for:
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeVoteModal}
                  disabled={submitting}
                  aria-label="Close voting dialog"
                  className="rounded-xl p-2 text-white/40 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="mb-6 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.055] p-4">
                <p className="font-semibold text-emerald-200">
                  {selectedNominee.name || "Unnamed nominee"}
                </p>

                <p className="mt-1 text-xs leading-5 text-white/40">
                  Your vote will be recorded for this nominee.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="voter-name"
                    className="mb-2 block text-xs font-medium text-white/65"
                  >
                    Your name <span className="text-emerald-300">*</span>
                  </label>

                  <input
                    id="voter-name"
                    type="text"
                    autoComplete="name"
                    maxLength={100}
                    value={voteForm.name}
                    onChange={(event) =>
                      setVoteForm((previous) => ({
                        ...previous,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Enter your name"
                    disabled={submitting}
                    className="w-full rounded-xl border border-white/[0.09] bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-emerald-400/45 focus:ring-2 focus:ring-emerald-400/10 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="voter-comment"
                    className="mb-2 flex items-center gap-2 text-xs font-medium text-white/65"
                  >
                    <MessageSquare size={13} />
                    Comment
                    <span className="text-white/30">(optional)</span>
                  </label>

                  <textarea
                    id="voter-comment"
                    rows={3}
                    maxLength={500}
                    value={voteForm.comment}
                    onChange={(event) =>
                      setVoteForm((previous) => ({
                        ...previous,
                        comment: event.target.value,
                      }))
                    }
                    placeholder="Share a short comment..."
                    disabled={submitting}
                    className="w-full resize-none rounded-xl border border-white/[0.09] bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-emerald-400/45 focus:ring-2 focus:ring-emerald-400/10 disabled:opacity-50"
                  />

                  <p className="mt-1 text-right text-[10px] text-white/25">
                    {voteForm.comment.length}/500
                  </p>
                </div>
              </div>

              {voteError && (
                <div
                  role="alert"
                  className="mt-4 rounded-xl border border-red-400/15 bg-red-400/[0.06] px-3 py-2.5 text-xs leading-5 text-red-300"
                >
                  {voteError}
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleVote}
                  disabled={submitting || !voteForm.name.trim()}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3.5 text-sm font-semibold text-[#04130c] transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Submitting vote...
                    </>
                  ) : (
                    <>
                      <Vote size={17} />
                      Confirm and vote
                      <ArrowRight
                        size={16}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={closeVoteModal}
                  disabled={submitting}
                  className="w-full rounded-xl border border-white/[0.08] px-4 py-3 text-sm font-medium text-white/50 transition hover:bg-white/[0.04] hover:text-white disabled:opacity-40"
                >
                  Cancel
                </button>
              </div>

              <p className="mt-5 text-center text-[11px] leading-5 text-white/25">
                Please review your choice carefully. You cannot vote again
                after submitting.
              </p>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
