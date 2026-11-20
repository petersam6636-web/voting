
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase-client";
import useApp from "@/lib/useApp";
import { getElectionStartStorageKey } from "@/lib/electionTimer";

import ProjectLoading from "@/components/ProjectLoading";
import NomineeImageUpload from "@/components/NomineeImageUpload";

import type {
  AchievementForm,
  NomineeForm,
  Project,
} from "@/types/project";

type RegisteredNominee = {
  form: NomineeForm;
  imageUrl: string | null;
};

const createEmptyNominee = (): NomineeForm => ({
  name: "",
  manifesto: "",
  image: null,
  achievements: [],
});

export default function Nominee() {
  const router = useRouter();

  const {
    userInfo,
    setUserInfo,
    currentProject,
    setCurrentProject,
    setProject,
    setTaskKey,
  } = useApp();

  const [draftNominee, setDraftNominee] =
    useState<NomineeForm>(createEmptyNominee);

  const [draftImageUrl, setDraftImageUrl] = useState<string | null>(
    null
  );

  const [registeredNominees, setRegisteredNominees] = useState<
    RegisteredNominee[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showNomineeConfirmation, setShowNomineeConfirmation] =
    useState(false);
  const [error, setError] = useState("");

  // Verify user and recover current project if necessary.
  useEffect(() => {
    let active = true;

    const prepareRegistration = async () => {
      try {
        const { data, error: authError } =
          await supabase.auth.getUser();

        if (authError) throw authError;

        if (!data.user) {
          router.replace("/");
          return;
        }

        if (!active) return;

        setUserInfo(data.user.id);

        if (!currentProject) {
          const { data: savedProject, error: projectError } =
            await supabase
              .from("projects")
              .select("*")
              .eq("user_id", data.user.id)
              .eq("deleted", false)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

          if (projectError) throw projectError;

          if (!savedProject) {
            router.replace("/home/projects/create");
            return;
          }

          if (!active) return;

          setCurrentProject(savedProject as Project);
        } else if (currentProject.user_id !== data.user.id) {
          throw new Error(
            "This project does not belong to your account."
          );
        }
      } catch (err: unknown) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to prepare nominee registration."
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    void prepareRegistration();

    return () => {
      active = false;
    };
  }, [
    currentProject,
    router,
    setUserInfo,
    setCurrentProject,
  ]);

  // Update the current nominee.
  const updateDraft = (updates: Partial<NomineeForm>) => {
    setDraftNominee((previous) => ({
      ...previous,
      ...updates,
    }));
  };

  // Add an achievement to the current nominee.
  const addAchievement = () => {
    setDraftNominee((previous) => ({
      ...previous,
      achievements: [
        ...previous.achievements,
        { project: "" },
      ],
    }));
  };

  const updateAchievement = (
    achievementIndex: number,
    value: string
  ) => {
    setDraftNominee((previous) => ({
      ...previous,
      achievements: previous.achievements.map(
        (achievement, index) =>
          index === achievementIndex
            ? { ...achievement, project: value }
            : achievement
      ),
    }));
  };

  const removeAchievement = (achievementIndex: number) => {
    setDraftNominee((previous) => ({
      ...previous,
      achievements: previous.achievements.filter(
        (_, index) => index !== achievementIndex
      ),
    }));
  };

  // Validate the current nominee before asking for confirmation.
  const registerNominee = () => {
    setError("");

    if (!draftNominee.name.trim()) {
      setError("Please enter the nominee's full name.");
      return;
    }

    if (!draftNominee.manifesto.trim()) {
      setError("Please enter the nominee's manifesto.");
      return;
    }

    const hasEmptyAchievement = draftNominee.achievements.some(
      (achievement) => !achievement.project.trim()
    );

    if (hasEmptyAchievement) {
      setError(
        "Please complete or remove every empty achievement."
      );
      return;
    }

    setShowNomineeConfirmation(true);
  };

  const confirmRegisterNominee = () => {
    setRegisteredNominees((previous) => [
      ...previous,
      {
        form: {
          ...draftNominee,
          achievements: draftNominee.achievements.map((item) => ({
            ...item,
          })),
        },
        imageUrl: draftImageUrl,
      },
    ]);

    // Reset the form for the next nominee.
    setDraftNominee(createEmptyNominee());
    setDraftImageUrl(null);
    setShowNomineeConfirmation(false);
  };

  // Check whether the current form contains unsaved information.
  const hasDraftContent =
    Boolean(draftNominee.name.trim()) ||
    Boolean(draftNominee.manifesto.trim()) ||
    draftNominee.achievements.length > 0 ||
    Boolean(draftImageUrl);

  // Refresh projects with nominees and achievements.
  const refreshProjects = async () => {
    if (!userInfo || !currentProject) {
      throw new Error("Project information is missing.");
    }

    const { data, error: fetchError } = await supabase
      .from("projects")
      .select(`
        *,
        nominees (
          *,
          achievements (*),
          voters (*)
        )
      `)
      .eq("user_id", userInfo)
      .eq("deleted", false)
      .order("created_at", { ascending: true });

    if (fetchError) throw fetchError;

    const updatedProjects = (data ?? []) as Project[];

    setProject(updatedProjects);

    const updatedCurrentProject = updatedProjects.find(
      (item) => item.id === currentProject.id
    );

    if (updatedCurrentProject) {
      setCurrentProject(updatedCurrentProject);
    }
  };

  // Save registered nominees and activate voting.
  const activateVoting = async () => {
    if (!userInfo || !currentProject) {
      setError("Your project information is missing. Please try again.");
      return;
    }

    if (registeredNominees.length === 0) {
      setError("Please register at least one nominee before continuing.");
      return;
    }

    if (hasDraftContent) {
      setError(
        "You have an unfinished nominee. Please register that nominee or clear the form before applying."
      );
      setShowConfirmation(false);
      return;
    }

    setSaving(true);
    setError("");

    let startStorageKey: string | null = null;
    let votingActivated = false;

    try {
      // STEP 1: Save all registered nominees.
      for (const registered of registeredNominees) {
        const nominee = registered.form;

        const { data: savedNominee, error: nomineeError } =
          await supabase
            .from("nominees")
            .insert({
              project_id: currentProject.id,
              user_id: userInfo,
              name: nominee.name.trim(),
              manifesto: nominee.manifesto.trim(),
              image: registered.imageUrl,
            })
            .select("id")
            .single();

        if (nomineeError) throw nomineeError;

        // STEP 2: Save achievements for this nominee.
        const achievements = nominee.achievements
          .filter((item: AchievementForm) => item.project.trim())
          .map((item) => ({
            nominee_id: savedNominee.id,
            project: item.project.trim(),
          }));

        if (achievements.length > 0) {
          const { error: achievementError } = await supabase
            .from("achievements")
            .insert(achievements);

          if (achievementError) throw achievementError;
        }
      }

      // STEP 3: Find one task belonging to this user.
      const { data: task, error: taskFetchError } = await supabase
        .from("tasks")
        .select("id")
        .eq("user_id", userInfo)
        .limit(1)
        .maybeSingle();

      if (taskFetchError) throw taskFetchError;

      // Start the timer when voting activates, not when project setup begins.
      startStorageKey = getElectionStartStorageKey(currentProject.id);
      try {
        localStorage.setItem(startStorageKey, String(Date.now()));
      } catch {
        throw new Error(
          "The election timer could not be saved in this browser. Enable browser storage and try again."
        );
      }

      // STEP 4: Activate the task or create one if none exists.
      if (task) {
        const { error: taskUpdateError } = await supabase
          .from("tasks")
          .update({ key: true })
          .eq("id", task.id)
          .eq("user_id", userInfo);

        if (taskUpdateError) throw taskUpdateError;
      } else {
        const { error: taskInsertError } = await supabase
          .from("tasks")
          .insert({
            user_id: userInfo,
            key: true,
          });

        if (taskInsertError) throw taskInsertError;
      }

      votingActivated = true;

      // STEP 5: Refresh projects and shared state.
      await refreshProjects();

      setTaskKey(true);

      // STEP 6: Return to homepage.
      router.replace("/home");
    } catch (err: unknown) {
      if (!votingActivated && startStorageKey) {
        try {
          localStorage.removeItem(startStorageKey);
        } catch (cleanupError) {
          console.warn(
            "Unable to clear the unstarted election timer:",
            cleanupError
          );
        }
      }

      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete nominee registration."
      );
    } finally {
      setSaving(false);
      setShowConfirmation(false);
    }
  };

  // Open confirmation before saving.
  const handleApplyForVoting = () => {
    setError("");

    if (registeredNominees.length === 0) {
      setError("Please register at least one nominee first.");
      return;
    }

    if (hasDraftContent) {
      setError(
        "Please register your current nominee before applying for voting."
      );
      return;
    }

    setShowConfirmation(true);
  };

  if (loading) {
    return <ProjectLoading />;
  }

  if (!currentProject) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#06110d] px-5 text-center text-white">
        <div>
          <p className="text-sm text-red-300">
            {error || "No project was found for this registration."}
          </p>

          <button
            type="button"
            onClick={() => router.push("/home/projects/create")}
            className="mt-5 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-[#04100a]"
          >
            Create a project
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden ] px-1 py-4 text-white sm:py-5">

      {/* Static decorative bubbles - same style and size as project creation */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        <div className="absolute left-[5%] top-[12%] h-40 w-40 rounded-full border border-emerald-300/15 bg-gradient-to-br from-emerald-300/[0.09] via-emerald-500/[0.035] to-transparent shadow-[inset_0_0_35px_rgba(52,211,153,0.07)] sm:left-[10%] sm:h-52 sm:w-52" />

        <div className="absolute left-[38%] top-[16%] h-7 w-7 rounded-full border border-emerald-300/25 bg-emerald-300/[0.07] sm:h-10 sm:w-10" />

        <div className="absolute right-[8%] top-[24%] h-16 w-16 rounded-full border border-emerald-300/20 bg-emerald-300/[0.05] shadow-[inset_0_0_20px_rgba(52,211,153,0.10)] sm:right-[14%] sm:h-24 sm:w-24" />

        <div className="absolute left-[18%] top-[48%] h-8 w-8 rounded-full border border-emerald-300/25 bg-emerald-300/[0.07] sm:left-[24%] sm:h-11 sm:w-11" />

        <div className="absolute -right-12 top-[47%] h-44 w-44 rounded-full border border-emerald-300/15 bg-gradient-to-br from-emerald-300/[0.08] via-emerald-500/[0.03] to-transparent shadow-[inset_0_0_40px_rgba(52,211,153,0.07)] sm:right-[3%] sm:h-56 sm:w-56" />

        <div className="absolute left-[48%] top-[76%] h-6 w-6 rounded-full border border-emerald-300/25 bg-emerald-300/[0.07] sm:h-9 sm:w-9" />

        <div className="absolute bottom-[8%] left-[7%] h-20 w-20 rounded-full border border-emerald-300/15 bg-emerald-300/[0.05] shadow-[inset_0_0_25px_rgba(52,211,153,0.08)] sm:left-[16%] sm:h-28 sm:w-28" />

        <div className="absolute bottom-[16%] right-[12%] h-8 w-8 rounded-full border border-emerald-300/25 bg-emerald-300/[0.07] sm:right-[22%] sm:h-10 sm:w-10" />

      </div>

      {/* Main content */}
      <div className="relative z-10 mx-auto max-w-3xl">

        {/* Page heading */}
        <div className="mb-7">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
              Project setup · Step 2
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Register your nominees
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-white/50">
                Add each nominee individually. Once registered, the
                form will be ready for the next person.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-3">
              <span className="text-xl font-bold tabular-nums text-emerald-300">
                {registeredNominees.length}
              </span>

              <span className="text-xs leading-4 text-white/50">
                Nominees
                <br />
                registered
              </span>
            </div>
          </div>
        </div>



        {/* Single nominee form */}
        <section className="rounded-3xl border border-emerald-400/15 bg-[#0b1913]/95 p-5 shadow-[0_0_55px_rgba(0,0,0,0.25)] backdrop-blur-xl sm:p-8">

          <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
                New nominee
              </p>

              <h2 className="mt-1 text-xl font-bold">
                Nominee information
              </h2>

              <p className="mt-1 text-xs text-white/40">
                Complete the details below and register this nominee.
              </p>
            </div>

            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-1.5 text-[10px] font-semibold text-emerald-300">
              #{registeredNominees.length + 1}
            </span>
          </div>

          <div className="space-y-6">

            {/* Full name */}
            <div>
              <label
                htmlFor="nominee-name"
                className="mb-2 block text-sm font-medium text-white/80"
              >
                Full name
              </label>

              <input
                id="nominee-name"
                value={draftNominee.name}
                onChange={(event) =>
                  updateDraft({ name: event.target.value })
                }
                placeholder="Enter nominee's full name"
                className="w-full rounded-xl border border-emerald-400/15 bg-black/30 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10 [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[box-shadow:0_0_0px_1000px_#0b1913_inset]"
              />
            </div>

            {/* Manifesto */}
            <div>
              <label
                htmlFor="nominee-manifesto"
                className="mb-2 block text-sm font-medium text-white/80"
              >
                Manifesto
              </label>

              <textarea
                id="nominee-manifesto"
                value={draftNominee.manifesto}
                onChange={(event) =>
                  updateDraft({ manifesto: event.target.value })
                }
                rows={4}
                placeholder="What does this nominee stand for? What changes or improvements do they want to bring?"
                className="w-full resize-none rounded-xl border border-emerald-400/15 bg-black/30 px-4 py-3.5 text-sm leading-6 text-white outline-none transition placeholder:text-white/25 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10"
              />
            </div>

            {/* Image upload component */}
            <div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-white/80">
                  Nominee image
                  <span className="ml-2 text-xs font-normal text-white/35">
                    Optional
                  </span>
                </label>

                <p className="mt-1 text-xs text-white/40">
                  Upload a clear picture of this nominee.
                </p>
              </div>

              <NomineeImageUpload
                key={registeredNominees.length}
                userId={userInfo || ""}
                projectId={currentProject.id}
                imageUrl={draftImageUrl}
                onUploaded={(file, url) => {
                  updateDraft({ image: file });
                  setDraftImageUrl(url);
                }}
                onRemove={() => {
                  updateDraft({ image: null });
                  setDraftImageUrl(null);
                }}
              />
            </div>

            {/* Achievements */}
            <div className="border-t border-white/10 pt-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Achievements
                  </h3>

                  <p className="mt-1 text-xs text-white/40">
                    Add achievements for this nominee, if any.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addAchievement}
                  className="rounded-lg border border-emerald-400/20 px-4 py-2.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/10"
                >
                  + Add achievement
                </button>
              </div>

              {draftNominee.achievements.length === 0 && (
                <div className="rounded-xl border border-dashed border-white/10 bg-black/10 px-4 py-6 text-center">
                  <p className="text-xs text-white/35">
                    No achievements added yet.
                  </p>

                  <p className="mt-1 text-[10px] text-white/25">
                    This section is optional.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {draftNominee.achievements.map(
                  (achievement, achievementIndex) => (
                    <div
                      key={achievementIndex}
                      className="flex items-start gap-2"
                    >
                      <textarea
                        value={achievement.project}
                        onChange={(event) =>
                          updateAchievement(
                            achievementIndex,
                            event.target.value
                          )
                        }
                        rows={2}
                        placeholder="Describe an achievement..."
                        className="min-w-0 flex-1 resize-none rounded-xl border border-emerald-400/15 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-emerald-400/60"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          removeAchievement(achievementIndex)
                        }
                        aria-label="Remove achievement"
                        className="rounded-lg border border-red-400/15 px-3 py-3 text-sm text-red-300 transition hover:bg-red-500/10"
                      >
                        ✕
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Register current nominee */}
          <button
            type="button"
            onClick={registerNominee}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.08] px-5 py-4 text-sm font-semibold text-emerald-300 transition hover:border-emerald-400/50 hover:bg-emerald-400/[0.14]"
          >
            <span className="text-lg">+</span>
            Register nominee ({registeredNominees.length})
          </button>

          <p className="mt-3 text-center text-[11px] text-white/30">
            Register this nominee to clear the form and add another person.
          </p>
        </section>

        {/* Registered nominee count */}
 
        {/* Error */}
        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            {error}
          </p>
        )}

        {/* Apply for voting */}
        <div className="mt-6 rounded-2xl border border-emerald-400/15 bg-[#0b1913]/90 p-5 backdrop-blur-xl sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Ready to apply?
              </h3>

              <p className="mt-1 text-xs text-white/40">
                {registeredNominees.length} nominee
                {registeredNominees.length === 1 ? "" : "s"} added to
                this election.
              </p>
            </div>

            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
              Step 2 of 2
            </span>
          </div>

          <button
            type="button"
            onClick={handleApplyForVoting}
            disabled={saving || registeredNominees.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-4 text-sm font-bold text-[#04100a] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Apply for voting
            <span aria-hidden="true">→</span>
          </button>

          <p className="mt-3 text-center text-[11px] leading-5 text-white/30">
            You will be asked to confirm before your nominees are saved
            and voting is activated.
          </p>
        </div>
      </div>

      {/* Confirmation modal */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmation-title"
            className="w-full max-w-md rounded-3xl border border-emerald-400/20 bg-[#0b1913] p-6 shadow-[0_0_60px_rgba(0,0,0,0.5)] sm:p-7"
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-xl text-emerald-300">
              ✓
            </div>

            <h2
              id="confirmation-title"
              className="text-xl font-bold text-white"
            >
              Apply for voting?
            </h2>

            <p className="mt-3 text-sm leading-6 text-white/50">
              Are you sure you want to continue? You are about to save{" "}
              <span className="font-semibold text-emerald-300">
                {registeredNominees.length} nominee
                {registeredNominees.length === 1 ? "" : "s"}
              </span>{" "}
              for <span className="font-semibold text-white">{currentProject.name}</span>{" "}
              and activate voting.
            </p>

            <p className="mt-3 text-xs leading-5 text-white/35">
              Make sure all nominee details are correct before continuing.
            </p>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => setShowConfirmation(false)}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/[0.08] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={activateVoting}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-[#04100a] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#04100a]/30 border-t-[#04100a]" />
                    Saving...
                  </>
                ) : (
                  "Yes, continue"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nominee registration confirmation */}
      {showNomineeConfirmation && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="register-nominee-title"
            className="w-full max-w-md rounded-3xl border border-emerald-400/20 bg-[#0b1913] p-6 shadow-[0_0_60px_rgba(0,0,0,0.5)] sm:p-7"
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-xl text-emerald-300">
              +
            </div>

            <h2
              id="register-nominee-title"
              className="text-xl font-bold text-white"
            >
              Register this nominee?
            </h2>

            <p className="mt-3 text-sm leading-6 text-white/50">
              Add{" "}
              <span className="font-semibold text-emerald-300">
                {draftNominee.name.trim()}
              </span>{" "}
              to the nominee list? The form will be cleared so you can add
              another nominee.
            </p>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowNomineeConfirmation(false)}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/[0.08]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmRegisterNominee}
                className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-[#04100a] transition hover:bg-emerald-400"
              >
                Yes, register
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
