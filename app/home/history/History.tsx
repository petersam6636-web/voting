
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  CheckCircle2,
  Clock3,
  Crown,
  Ellipsis,
  FolderOpen,
  MessageCircle,
  Medal,
  Search,
  Sparkles,
  Trash2,
  Trophy,
  Users,
  Vote,
  X,
  AlertTriangle,
} from "lucide-react";

import { supabase } from "@/lib/supabase-client";
import useApp from "@/lib/useApp";
import { getElectionDurationMs } from "@/lib/electionTimer";

import type {
  Project,
  Nominee,
  Achievement,
  Voter,
} from "@/types/project";

type HistorySection = "select" | "view";

function formatDate(date?: string | null): string {
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

function formatDuration(milliseconds: number | null): string {
  if (
    milliseconds === null ||
    !Number.isFinite(milliseconds) ||
    milliseconds <= 0
  ) {
    return "Not available";
  }

  const seconds = Math.floor(milliseconds / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const parts: string[] = [];

  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  if (parts.length === 0) {
    parts.push(`${remainingSeconds}s`);
  }

  return parts.join(" ");
}

function getProjectVotes(project: Project): number {
  return (project.nominees ?? []).reduce(
    (total, nominee) => total + (nominee.voters?.length ?? 0),
    0
  );
}

function getProjectWinners(nominees: Nominee[]): Nominee[] {
  const highestVotes = Math.max(
    0,
    ...nominees.map((nominee) => nominee.voters?.length ?? 0)
  );

  if (highestVotes === 0) return [];

  return nominees.filter(
    (nominee) => (nominee.voters?.length ?? 0) === highestVotes
  );
}

async function deleteProjectAndRelatedData(
  projectId: string,
  userId: string
): Promise<void> {
  const { data: ownedProject, error: ownershipError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  if (ownershipError) throw ownershipError;
  if (!ownedProject) {
    throw new Error("The project could not be found or you do not have permission to delete it.");
  }

  const { data: nominees, error: nomineeLookupError } = await supabase
    .from("nominees")
    .select("id")
    .eq("project_id", projectId);

  if (nomineeLookupError) throw nomineeLookupError;

  const nomineeIds = (nominees ?? []).map((nominee) => nominee.id);

  if (nomineeIds.length > 0) {
    const { error: voterError } = await supabase
      .from("voters")
      .delete()
      .in("nominee_id", nomineeIds);

    if (voterError) throw voterError;

    const { error: achievementError } = await supabase
      .from("achievements")
      .delete()
      .in("nominee_id", nomineeIds);

    if (achievementError) throw achievementError;

    const { error: nomineeDeleteError } = await supabase
      .from("nominees")
      .delete()
      .eq("project_id", projectId);

    if (nomineeDeleteError) throw nomineeDeleteError;
  }

  const { data: deletedProject, error: projectDeleteError } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", userId)
    .select("id");

  if (projectDeleteError) throw projectDeleteError;
  if (!deletedProject?.length) {
    throw new Error("The project could not be deleted. Check your permissions.");
  }
}

export default function HistoryPage() {
  const {
    project,
    setProject,
    userInfo,
  } = useApp();

  const [section, setSection] = useState<HistorySection>("select");

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );

  const [searchQuery, setSearchQuery] = useState("");

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [projectToDelete, setProjectToDelete] = useState<Project | null>(
    null
  );
  const [showDeleteAllConfirmation, setShowDeleteAllConfirmation] =
    useState(false);

  const [deleting, setDeleting] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const panelRef = useRef<HTMLDivElement>(null);

  // Animate the active section whenever the user changes sections.

  // Exclude the project with the earliest valid creation date.
  const historyProjects = useMemo(() => {
    const projects = project ?? [];

    if (projects.length === 0) return [];

    const validDates = projects
      .map((item) => ({
        id: item.id,
        timestamp: new Date(item.created_at).getTime(),
      }))
      .filter((item) => Number.isFinite(item.timestamp));

    if (validDates.length === 0) return projects;

    const oldestProject = validDates.reduce((oldest, current) =>
      current.timestamp < oldest.timestamp ? current : oldest
    );

    return projects.filter((item) => item.id !== oldestProject.id);
  }, [project]);

  const activeProjectId = useMemo(() => {
    const projects = project ?? [];

    if (projects.length === 0) return null;

    const earliestProject = [...projects].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      const timestampA = Number.isFinite(dateA)
        ? dateA
        : Number.POSITIVE_INFINITY;
      const timestampB = Number.isFinite(dateB)
        ? dateB
        : Number.POSITIVE_INFINITY;

      return timestampA - timestampB;
    })[0];

    return earliestProject?.id ?? null;
  }, [project]);

  const projectsToDelete = useMemo(
    () => historyProjects.filter((item) => item.id !== activeProjectId),
    [historyProjects, activeProjectId]
  );

  // Search history projects.
  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return historyProjects;

    return historyProjects.filter((item) =>
      item.name.toLowerCase().includes(query)
    );
  }, [historyProjects, searchQuery]);

  // Selected project and its complete election data.
  const selectedProject = useMemo(
    () =>
      historyProjects.find((item) => item.id === selectedProjectId) ?? null,
    [historyProjects, selectedProjectId]
  );

  const selectedNominees = selectedProject?.nominees ?? [];

  // Calculate election results.
  const results = useMemo(() => {
    if (!selectedProject) return null;

    const nominees = selectedProject.nominees ?? [];

    const rankedNominees = [...nominees].sort(
      (a, b) => (b.voters?.length ?? 0) - (a.voters?.length ?? 0)
    );

    const totalVotes = nominees.reduce(
      (total, nominee) => total + (nominee.voters?.length ?? 0),
      0
    );

    const highestVotes = Math.max(
      0,
      ...nominees.map((nominee) => nominee.voters?.length ?? 0)
    );

    const winners = getProjectWinners(nominees);

    const durationValue = getElectionDurationMs(
      selectedProject.duration_ms,
      selectedProject.created_at
    );

    const duration =
      Number.isFinite(durationValue) && durationValue > 0
        ? durationValue
        : null;

    return {
      nominees,
      rankedNominees,
      totalVotes,
      highestVotes,
      winners,
      duration,
    };
  }, [selectedProject]);

  // Open a project's results.
  const handleViewProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setOpenMenuId(null);
    setError("");
    setSuccess("");
    setSection("view");
  };

  // Return to project selection.
  const handleBack = () => {
    setSection("select");
    setSelectedProjectId(null);
    setOpenMenuId(null);
    setError("");
  };

  // Delete the project and all its associated records.
  const handleDeleteProject = async () => {
    if (!projectToDelete || !userInfo) {
      setError("Unable to verify the project owner.");
      return;
    }

    setDeleting(true);
    setError("");
    setSuccess("");

    try {
      const projectId = projectToDelete.id;
      await deleteProjectAndRelatedData(projectId, userInfo);

      // Update the shared application state.
      setProject((current) =>
        (current ?? []).filter((item) => item.id !== projectId)
      );

      // Reset the view if the deleted project was open.
      if (selectedProjectId === projectId) {
        setSelectedProjectId(null);
        setSection("select");
      }

      setProjectToDelete(null);
      setOpenMenuId(null);

      setSuccess("Project and all its associated data were deleted.");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete this project."
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAllHistory = async () => {
    if (!userInfo) {
      setError("Unable to verify the project owner.");
      return;
    }

    const targets = projectsToDelete;

    if (targets.length === 0) {
      setShowDeleteAllConfirmation(false);
      setSuccess("There are no historical projects to delete.");
      return;
    }

    setDeletingAll(true);
    setError("");
    setSuccess("");

    const deletedIds: string[] = [];

    try {
      for (const item of targets) {
        await deleteProjectAndRelatedData(item.id, userInfo);
        deletedIds.push(item.id);

        setProject((current) =>
          (current ?? []).filter((projectItem) => projectItem.id !== item.id)
        );
      }

      setSelectedProjectId(null);
      setOpenMenuId(null);
      setSection("select");
      setShowDeleteAllConfirmation(false);
      setSuccess(
        `${deletedIds.length} historical ${
          deletedIds.length === 1 ? "project was" : "projects were"
        } deleted. Your current election was kept.`
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred.";

      setError(
        deletedIds.length > 0
          ? `Deleted ${deletedIds.length} of ${targets.length} projects. The remaining projects were kept. ${message}`
          : `No projects were deleted. ${message}`
      );

      if (deletedIds.length > 0) {
        setShowDeleteAllConfirmation(false);
      }
    } finally {
      setDeletingAll(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-1 py-5 text-white sm:px-3 ">

      {/* Ambient background */}
      {/* <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-[130px]" />

      <div className="pointer-events-none absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-green-500/[0.07] blur-[140px]" />

      <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:radial-gradient(#a7f3d0_1px,transparent_1px)] [background-size:25px_25px]" /> */}

      <div className="relative z-10 mx-auto w-full max-w-6xl">

        {/* Header */}
        <header className="mb-10 flex flex-col justify-between gap-5 border-b border-white/[0.07] pb-6 sm:flex-row sm:items-center">

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.09] text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.08)]">
              <Vote size={23} />
            </div>

            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                VoteSphere
              </h1>

              <p className="text-xs text-white/40">
                Election history
              </p>
            </div>
          </div>

          {/* Section navigation */}
          <div className="flex items-center gap-1 rounded-xl border border-white/[0.07] bg-white/[0.025] p-1">

            <button
              type="button"
              onClick={() => {
                setSection("select");
                setSelectedProjectId(null);
                setError("");
              }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-medium transition-all duration-300 sm:flex-none ${
                section === "select"
                  ? "bg-emerald-400 text-[#04130c] shadow-lg shadow-emerald-500/10"
                  : "text-white/45 hover:bg-white/[0.05] hover:text-white"
              }`}
            >
              <FolderOpen size={15} />
              Select
            </button>

            <button
              type="button"
              onClick={() => {
                if (selectedProject) {
                  setSection("view");
                  setError("");
                }
              }}
              disabled={!selectedProject}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-medium transition-all duration-300 sm:flex-none ${
                section === "view"
                  ? "bg-emerald-400 text-[#04130c] shadow-lg shadow-emerald-500/10"
                  : "text-white/45 hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              }`}
            >
              <ChartNoAxesColumnIncreasing size={15} />
              View results
            </button>

          </div>
        </header>

        {/* Feedback */}
        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/[0.07] p-4 text-sm text-red-300"
          >
            <AlertTriangle size={17} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] p-4 text-sm text-emerald-300"
          >
            <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* ================================================= */}
        {/* SELECT SECTION */}
        {/* ================================================= */}

        {section === "select" && (
          <div ref={panelRef}>

            <section className="mb-9">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1.5 text-xs font-medium text-emerald-300">
                <Sparkles size={13} />
                Recorded activities
              </div>

              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Your election{" "}
                <span className="text-emerald-400">history.</span>
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/45">
                Explore your previous election projects, review their
                achievements, and revisit the results whenever you need them.
              </p>
            </section>

            {/* History count and search */}
            <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.17em] text-white/35">
                  Your records
                </p>

                <p className="mt-1 text-sm text-white/60">
                  {projectsToDelete.length}{" "}
                  {projectsToDelete.length === 1 ? "project" : "projects"}{" "}
                  available in history
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full sm:max-w-xs">
                  <Search
                    size={16}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                  />

                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search your projects..."
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.025] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-emerald-400/40 focus:bg-emerald-400/[0.025]"
                  />
                </div>

                <button
                  type="button"
                  disabled={projectsToDelete.length === 0 || deletingAll}
                  onClick={() => {
                    setProjectToDelete(null);
                    setError("");
                    setSuccess("");
                    setShowDeleteAllConfirmation(true);
                  }}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm font-medium text-red-300 transition hover:border-red-400/35 hover:bg-red-400/[0.12] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 size={15} />
                  Delete all
                </button>
              </div>

            </section>

            {/* Project cards */}
            {filteredProjects.length === 0 ? (

              <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.025] px-6 py-16 text-center shadow-2xl shadow-black/20 sm:px-12">

                <div className="pointer-events-none absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 rounded-full bg-emerald-400/[0.08] blur-[70px]" />

                <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300">
                  <FolderOpen size={34} />
                </div>

                <h3 className="text-xl font-semibold">
                  {searchQuery
                    ? "No matching projects"
                    : "No election history yet"}
                </h3>

                <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/40">
                  {searchQuery
                    ? "Try searching with another project name."
                    : "Your previous election projects and their results will appear here once they become available."}
                </p>

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] px-5 py-3 text-sm font-medium text-emerald-300 transition hover:bg-emerald-400/15"
                  >
                    Clear search
                  </button>
                )}

              </section>

            ) : (

              <section className="grid grid-cols-1 gap-5 md:grid-cols-2">

                {filteredProjects.map((item, index) => {
                  const nomineeCount = item.nominees?.length ?? 0;
                  const totalVotes = getProjectVotes(item);

                  return (
                    <article
                      key={item.id}
                      className="group relative overflow-visible rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#102019]/90 via-[#0b1711]/95 to-[#09110d] p-5 shadow-[0_15px_55px_rgba(0,0,0,0.20)] transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400/25 hover:shadow-[0_20px_60px_rgba(0,0,0,0.3)] sm:p-6"
                    >

                      {/* Decorative glow */}
                      <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-emerald-400/[0.055] blur-[55px]" />

                      <div className="relative">

                        {/* Card heading */}
                        <div className="flex items-start justify-between gap-3">

                          <div className="flex min-w-0 items-center gap-3">

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300">
                              <Vote size={20} />
                            </div>

                            <div className="min-w-0">
                              <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-emerald-300/50">
                                Historical election
                              </p>

                              <p className="mt-1 truncate text-xs text-white/40">
                                Project {String(index + 1).padStart(2, "0")}
                              </p>
                            </div>

                          </div>

                          {/* Three-dot menu */}
                          <div className="relative shrink-0">

                            <button
                              type="button"
                              aria-label="Project options"
                              aria-expanded={openMenuId === item.id}
                              onClick={() =>
                                setOpenMenuId((current) =>
                                  current === item.id ? null : item.id
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.035] text-white/45 transition hover:border-emerald-400/25 hover:bg-emerald-400/[0.08] hover:text-emerald-300"
                            >
                              <Ellipsis size={20} />
                            </button>

                            {openMenuId === item.id && (
                              <div className="absolute right-0 top-11 z-30 w-52 overflow-hidden rounded-xl border border-white/10 bg-[#101c15] p-1.5 shadow-2xl shadow-black/50">

                                <button
                                  type="button"
                                  onClick={() => {
                                    setProjectToDelete(item);
                                    setOpenMenuId(null);
                                    setError("");
                                  }}
                                  className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-xs font-medium text-red-300 transition hover:bg-red-400/[0.09]"
                                >
                                  <Trash2 size={15} />
                                  Delete project & all data
                                </button>

                              </div>
                            )}

                          </div>

                        </div>

                        {/* Project details */}
                        <div className="mt-7">

                          <h3 className="break-words text-xl font-semibold tracking-tight text-white transition group-hover:text-emerald-200">
                            {item.name || "Untitled election"}
                          </h3>

                          <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-6 text-white/40">
                            {item.description || "No project description provided."}
                          </p>

                          <div className="mt-5 flex items-center gap-2 text-xs text-white/35">
                            <CalendarDays size={14} className="text-emerald-400/70" />
                            Created {formatDate(item.created_at)}
                          </div>

                        </div>

                        {/* Statistics */}
                        <div className="mt-6 grid grid-cols-3 gap-2">

                          <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
                            <Users size={16} className="text-emerald-300" />

                            <p className="mt-3 text-xl font-semibold tabular-nums">
                              {nomineeCount}
                            </p>

                            <p className="mt-1 text-[10px] text-white/35">
                              Nominees
                            </p>
                          </div>

                          <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
                            <Vote size={16} className="text-emerald-300" />

                            <p className="mt-3 text-xl font-semibold tabular-nums">
                              {totalVotes.toLocaleString()}
                            </p>

                            <p className="mt-1 text-[10px] text-white/35">
                              Total votes
                            </p>
                          </div>

                          <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
                            <Trophy size={16} className="text-yellow-300" />

                            <p className="mt-3 text-xl font-semibold tabular-nums">
                              {getProjectWinners(item.nominees ?? []).length}
                            </p>

                            <p className="mt-1 text-[10px] text-white/35">
                              Winners
                            </p>
                          </div>

                        </div>

                        {/* View results button */}
                        <button
                          type="button"
                          onClick={() => handleViewProject(item.id)}
                          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.08] px-4 py-3.5 text-sm font-semibold text-emerald-300 transition-all duration-300 hover:border-emerald-400/40 hover:bg-emerald-400 hover:text-[#04130c]"
                        >
                          View election results
                          <ArrowRight
                            size={16}
                            className="transition-transform group-hover:translate-x-1"
                          />
                        </button>

                      </div>
                    </article>
                  );
                })}

              </section>
            )}

            <footer className="mt-12 border-t border-white/[0.06] py-6 text-center text-xs text-white/25">
              VoteSphere · Your elections, your decisions.
            </footer>

          </div>
        )}

        {/* ================================================= */}
        {/* VIEW RESULTS SECTION */}
        {/* ================================================= */}

        {section === "view" && (
          <div ref={panelRef}>

            {!selectedProject || !results ? (

              <section className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-10 text-center">
                <FolderOpen size={35} className="mx-auto text-emerald-400" />

                <h2 className="mt-5 text-xl font-semibold">
                  Project unavailable
                </h2>

                <p className="mt-2 text-sm text-white/40">
                  This project could not be found in your history.
                </p>

                <button
                  type="button"
                  onClick={handleBack}
                  className="mt-6 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-[#04130c]"
                >
                  Back to history
                </button>
              </section>

            ) : (

              <>

                {/* Results navigation */}
                <button
                  type="button"
                  onClick={handleBack}
                  className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/55 transition hover:border-emerald-400/30 hover:bg-emerald-400/10 hover:text-emerald-300"
                >
                  <ArrowLeft size={16} />
                  Back to history
                </button>

                {/* Results introduction */}
                <section className="mb-8">

                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1.5 text-xs font-medium text-emerald-300">
                    <Sparkles size={13} />
                    Historical election results
                  </div>

                  <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                    Election{" "}
                    <span className="text-emerald-400">results.</span>
                  </h2>

                  <p className="mt-3 max-w-2xl text-sm leading-7 text-white/45">
                    A complete record of the election, its participants,
                    achievements, voter feedback, and final results.
                  </p>

                </section>

                {/* Main project card */}
                <section className="relative overflow-hidden rounded-3xl border border-emerald-400/15 bg-gradient-to-br from-[#10251a] via-[#0b1711] to-[#09110d] p-5 shadow-[0_25px_90px_rgba(0,0,0,0.28)] sm:p-8">

                  <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full border border-emerald-300/[0.07]" />

                  <div className="pointer-events-none absolute right-10 top-10 h-32 w-32 rounded-full bg-emerald-400/[0.08] blur-[55px]" />

                  <div className="relative">

                    <div className="flex flex-wrap items-center justify-between gap-3">

                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-black/20 px-3 py-1.5 text-xs font-medium text-emerald-200">
                        <Trophy size={13} />
                        Historical election
                      </span>

                      <span className="inline-flex items-center gap-2 text-xs text-white/35">
                        <CalendarDays size={14} />
                        {formatDate(selectedProject.created_at)}
                      </span>

                    </div>

                    <div className="mt-8 max-w-3xl">

                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/60">
                        Project heading
                      </p>

                      <h3 className="break-words text-3xl font-semibold tracking-tight sm:text-4xl">
                        {selectedProject.name || "Untitled election"}
                      </h3>

                      {selectedProject.description && (
                        <p className="mt-4 text-sm leading-7 text-white/50">
                          {selectedProject.description}
                        </p>
                      )}

                    </div>

                    {/* Winner section */}
                    <div className="mt-8 rounded-2xl border border-emerald-300/15 bg-black/20 p-5 sm:p-6">

                      <div className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200/65">
                        <Crown size={15} />
                        Election result
                      </div>

                      {results.winners.length === 0 ? (

                        <div className="flex items-start gap-3">
                          <div className="rounded-xl bg-white/[0.06] p-3 text-white/50">
                            <AlertTriangle size={22} />
                          </div>

                          <div>
                            <p className="font-semibold">
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

                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-yellow-300/20 bg-yellow-300/[0.09] text-yellow-300">
                              <Trophy size={27} />
                            </div>

                            <div>

                              <p className="text-xs text-white/40">
                                {results.winners.length > 1
                                  ? "Joint winners"
                                  : "Winning nominee"}
                              </p>

                              <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1">
                                {results.winners.map((winner, index) => (
                                  <span
                                    key={winner.id}
                                    className="text-xl font-semibold sm:text-2xl"
                                  >
                                    {winner.name || "Unnamed nominee"}
                                    {index < results.winners.length - 1 && (
                                      <span className="text-emerald-300">,</span>
                                    )}
                                  </span>
                                ))}
                              </div>

                            </div>

                          </div>

                          <div className="rounded-xl border border-yellow-300/15 bg-yellow-300/[0.06] px-4 py-3 sm:text-right">

                            <p className="text-xs text-yellow-100/50">
                              Votes each
                            </p>

                            <p className="mt-1 text-2xl font-bold tabular-nums text-yellow-200">
                              {results.highestVotes.toLocaleString()}
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

                        <p className="mt-3 text-2xl font-semibold">
                          {formatDuration(results.duration)}
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

                        <p className="mt-3 text-2xl font-semibold tabular-nums">
                          {results.totalVotes.toLocaleString()}
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

                        <p className="mt-3 text-2xl font-semibold">
                          {results.nominees.length}
                        </p>

                        <p className="mt-1 text-xs text-white/30">
                          Participants in this election
                        </p>
                      </div>

                    </div>

                  </div>
                </section>

                {/* Nominee results */}
                <section className="mt-9">

                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-white">
                        Nominee results
                      </h3>

                      <p className="mt-1 text-xs text-white/40">
                        Vote distribution for this election
                      </p>
                    </div>

                    <span className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-white/45">
                      {results.nominees.length} nominees
                    </span>
                  </div>

                  {results.rankedNominees.length === 0 ? (

                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 text-center text-sm text-white/40">
                      No nominees were recorded for this project.
                    </div>

                  ) : (

                    <div className="space-y-3">

                      {results.rankedNominees.map((nominee, index) => {

                        const voteCount = nominee.voters?.length ?? 0;

                        const percentage =
                          results.totalVotes > 0
                            ? (voteCount / results.totalVotes) * 100
                            : 0;

                        const isWinner = results.winners.some(
                          (winner) => winner.id === nominee.id
                        );

                        return (

                          <article
                            key={nominee.id}
                            className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] transition-colors hover:border-emerald-400/20"
                          >

                            {/* Nominee ranking */}
                            <div className="p-4 sm:p-5">

                              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">

                                <div className="flex min-w-0 items-center gap-3">

                                  <div
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${
                                      isWinner
                                        ? "bg-emerald-400/15 text-emerald-300"
                                        : "bg-white/[0.06] text-white/45"
                                    }`}
                                  >
                                    {index + 1}
                                  </div>

                                  <div className="min-w-0">
                                    <p className="break-words font-medium text-white">
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
                                    {voteCount.toLocaleString()} votes
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

                            {/* Complete nominee information */}
                            <div className="border-t border-white/[0.06] bg-black/10 p-4 sm:p-5">

                              <div className="flex flex-col gap-5 sm:flex-row">

                                {nominee.image && (
                                  <img
                                    src={nominee.image}
                                    alt={nominee.name || "Nominee"}
                                    className="h-24 w-24 shrink-0 rounded-2xl border border-emerald-400/20 object-cover"
                                  />
                                )}

                                <div className="min-w-0 flex-1">

                                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.17em] text-emerald-300/60">
                                    Nominee manifesto
                                  </p>

                                  <p className="whitespace-pre-wrap text-sm leading-7 text-white/55">
                                    {nominee.manifesto?.trim() ||
                                      "No manifesto provided."}
                                  </p>

                                  <p className="mt-3 text-xs text-white/30">
                                    Registered {formatDate(nominee.created_at)}
                                  </p>

                                </div>

                              </div>

                              {/* Achievements */}
                              <div className="mt-6">

                                <div className="mb-3 flex items-center gap-2">
                                  <Award size={15} className="text-emerald-300" />

                                  <h4 className="text-xs font-semibold uppercase tracking-[0.13em] text-white/60">
                                    Achievements
                                  </h4>

                                  <span className="text-[10px] text-white/30">
                                    ({nominee.achievements?.length ?? 0})
                                  </span>
                                </div>

                                {(nominee.achievements?.length ?? 0) > 0 ? (

                                  <div className="space-y-2">

                                    {nominee.achievements?.map(
                                      (achievement: Achievement, achievementIndex) => (

                                        <div
                                          key={achievement.id ?? `${achievement.project}-${achievementIndex}`}
                                          className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3"
                                        >

                                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-400/10">
                                            <Award size={15} className="text-emerald-300" />
                                          </div>

                                          <div className="min-w-0">
                                            <p className="text-sm text-white/75">
                                              {achievement.project || "Achievement"}
                                            </p>

                                            <p className="mt-1 text-[11px] text-white/30">
                                              {formatDate(achievement.created_at)}
                                            </p>
                                          </div>

                                        </div>

                                      )
                                    )}

                                  </div>

                                ) : (

                                  <p className="rounded-xl border border-dashed border-white/[0.08] p-4 text-xs text-white/30">
                                    No achievements recorded.
                                  </p>

                                )}

                              </div>

                              {/* Voter feedback */}
                              <div className="mt-6">

                                <div className="mb-3 flex items-center gap-2">
                                  <MessageCircle size={15} className="text-emerald-300" />

                                  <h4 className="text-xs font-semibold uppercase tracking-[0.13em] text-white/60">
                                    Voter feedback
                                  </h4>

                                  <span className="text-[10px] text-white/30">
                                    ({(nominee.voters ?? []).filter(
                                      (voter) => Boolean(voter.comment?.trim())
                                    ).length})
                                  </span>
                                </div>

                                {(() => {
                                  const comments = (nominee.voters ?? [])
                                    .map((voter: Voter) => voter.comment?.trim())
                                    .filter((comment): comment is string =>
                                      Boolean(comment)
                                    );

                                  return comments.length > 0 ? (

                                    <div className="space-y-2">

                                      {comments.map((comment, commentIndex) => (

                                        <div
                                          key={`${nominee.id}-comment-${commentIndex}`}
                                          className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4"
                                        >

                                          <div className="mb-2 flex items-center gap-2">
                                            <MessageCircle
                                              size={12}
                                              className="text-emerald-500"
                                            />

                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">
                                              Voter feedback
                                            </span>
                                          </div>

                                          <p className="whitespace-pre-wrap text-sm leading-6 text-white/60">
                                            {comment}
                                          </p>

                                        </div>

                                      ))}

                                    </div>

                                  ) : (

                                    <p className="rounded-xl border border-dashed border-white/[0.08] p-4 text-xs text-white/30">
                                      No voter comments recorded.
                                    </p>

                                  );
                                })()}

                              </div>

                            </div>

                          </article>

                        );
                      })}

                    </div>

                  )}

                </section>

                {/* Results footer */}
                <section className="mt-9 flex flex-col items-start justify-between gap-4 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.045] p-5 sm:flex-row sm:items-center sm:p-6">

                  <div>
                    <h3 className="font-semibold text-white">
                      Explore another election
                    </h3>

                    <p className="mt-1 text-sm text-white/40">
                      Return to your history to review another project.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400 hover:text-[#04130c]"
                  >
                    Back to history
                    <ArrowRight size={16} />
                  </button>

                </section>

              </>
            )}

            <footer className="mt-10 border-t border-white/[0.06] py-6 text-center text-xs text-white/25">
              VoteSphere · Your elections, your decisions.
            </footer>

          </div>
        )}

      </div>

      {/* ================================================= */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ================================================= */}

      {projectToDelete && (

        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) {
              setProjectToDelete(null);
            }
          }}
        >

          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-red-400/20 bg-[#0b1711] shadow-[0_25px_100px_rgba(0,0,0,0.65)]">

            <div className="border-b border-white/[0.07] p-6">

              <div className="flex items-start justify-between gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-400/20 bg-red-400/[0.09] text-red-300">
                  <Trash2 size={22} />
                </div>

                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setProjectToDelete(null)}
                  aria-label="Close confirmation"
                  className="rounded-lg p-2 text-white/35 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-30"
                >
                  <X size={19} />
                </button>

              </div>

              <h3 className="mt-5 text-xl font-semibold text-white">
                Delete this project?
              </h3>

              <p className="mt-2 break-words text-sm leading-6 text-white/45">
                You are about to permanently delete{" "}
                <span className="font-semibold text-white">
                  {projectToDelete.name}
                </span>
                .
              </p>

            </div>

            <div className="space-y-3 p-6">

              <div className="rounded-xl border border-red-400/15 bg-red-400/[0.045] p-4">

                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.13em] text-red-300/80">
                  The following data will be deleted
                </p>

                <ul className="space-y-2 text-xs text-white/50">

                  <li className="flex items-center gap-2">
                    <Trash2 size={13} className="text-red-300/70" />
                    The entire election project
                  </li>

                  <li className="flex items-center gap-2">
                    <Users size={13} className="text-red-300/70" />
                    All associated nominees
                  </li>

                  <li className="flex items-center gap-2">
                    <Award size={13} className="text-red-300/70" />
                    All nominee achievements
                  </li>

                  <li className="flex items-center gap-2">
                    <Vote size={13} className="text-red-300/70" />
                    All recorded votes and voter comments
                  </li>

                </ul>

              </div>

              <p className="text-xs leading-5 text-white/30">
                This action cannot be undone. All associated records will be
                permanently removed from your database.
              </p>

              <button
                type="button"
                onClick={handleDeleteProject}
                disabled={deleting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Deleting project...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete project and all data
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={() => setProjectToDelete(null)}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-sm font-medium text-white/55 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-30"
              >
                Cancel
              </button>

            </div>

          </div>

        </div>

      )}

      {showDeleteAllConfirmation && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deletingAll) {
              setShowDeleteAllConfirmation(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-all-title"
            className="w-full max-w-md overflow-hidden rounded-3xl border border-red-400/20 bg-[#0b1711] shadow-[0_25px_100px_rgba(0,0,0,0.65)]"
          >
            <div className="border-b border-white/[0.07] p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-400/20 bg-red-400/[0.09] text-red-300">
                  <AlertTriangle size={22} />
                </div>

                <button
                  type="button"
                  disabled={deletingAll}
                  onClick={() => setShowDeleteAllConfirmation(false)}
                  aria-label="Close delete all confirmation"
                  className="rounded-lg p-2 text-white/35 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-30"
                >
                  <X size={19} />
                </button>
              </div>

              <h3
                id="delete-all-title"
                className="mt-5 text-xl font-semibold text-white"
              >
                Delete all history projects?
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/45">
                This will permanently delete {projectsToDelete.length}{" "}
                {projectsToDelete.length === 1 ? "project" : "projects"} and
                their nominees, achievements, votes, and voter comments.
              </p>
            </div>

            <div className="space-y-4 p-6">
              <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[0.045] p-4 text-xs leading-5 text-emerald-200/75">
                Your current election will be kept and will not be deleted.
              </div>

              <p className="text-xs leading-5 text-white/30">
                This action cannot be undone.
              </p>

              <button
                type="button"
                onClick={() => void handleDeleteAllHistory()}
                disabled={deletingAll || projectsToDelete.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletingAll ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Deleting projects...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete all history projects
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={deletingAll}
                onClick={() => setShowDeleteAllConfirmation(false)}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-sm font-medium text-white/55 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-30"
              >
                Cancel
              </button>
            </div>
          </section>
        </div>
      )}

    </main>
  );
}
