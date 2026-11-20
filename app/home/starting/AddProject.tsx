
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase-client";
import useApp from "@/lib/useApp";

import ProjectLoading from "@/components/ProjectLoading";

type DurationUnit = "minutes" | "hours" | "days" | "weeks";

type DurationPreset = {
  label: string;
  description: string;
  value: number;
  unit: DurationUnit;
};

const durationMultipliers: Record<DurationUnit, number> = {
  minutes: 60 * 1000,
  hours: 60 * 60 * 1000,
  days: 24 * 60 * 60 * 1000,
  weeks: 7 * 24 * 60 * 60 * 1000,
};

const durationPresets: DurationPreset[] = [
  {
    label: "30 minutes",
    description: "Quick election",
    value: 30,
    unit: "minutes",
  },
  {
    label: "1 hour",
    description: "Recommended",
    value: 1,
    unit: "hours",
  },
  {
    label: "12 hours",
    description: "More time to participate",
    value: 12,
    unit: "hours",
  },
  {
    label: "1 day",
    description: "Extended election",
    value: 1,
    unit: "days",
  },
];

export default function CreateProjectPage() {
  const router = useRouter();

  const {
    userInfo,
    setUserInfo,
    setProjectDetails,
    setCurrentProject,
    setProject,
    setTaskKey,
  } = useApp();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [durationMode, setDurationMode] = useState<"preset" | "custom">(
    "preset"
  );

  const [selectedPreset, setSelectedPreset] = useState("1 hour");

  const [duration, setDuration] = useState("3");
  const [unit, setUnit] = useState<DurationUnit>("days");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Verify authenticated user.
  useEffect(() => {
    let active = true;

    const verifyUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error) throw error;

        if (!data.user) {
          router.replace("/");
          return;
        }

        if (!active) return;

        setUserInfo(data.user.id);
      } catch (err: unknown) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to verify your account."
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    void verifyUser();

    return () => {
      active = false;
    };
  }, [router, setUserInfo]);

  // Calculate election duration.
  const getDurationInMilliseconds = () => {
    if (durationMode === "preset") {
      const preset = durationPresets.find(
        (item) => item.label === selectedPreset
      );

      if (!preset) {
        throw new Error("Please select a valid election duration.");
      }

      return preset.value * durationMultipliers[preset.unit];
    }

    const durationNumber = Number(duration);

    if (!Number.isFinite(durationNumber) || durationNumber <= 0) {
      throw new Error("Please enter a valid custom duration.");
    }

    return durationNumber * durationMultipliers[unit];
  };

  // Create project.
  const handleCreateProject = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!userInfo) {
      setError("Your account could not be verified. Please sign in again.");
      return;
    }

    if (!name.trim()) {
      setError("Please enter a project name.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const durationMs = getDurationInMilliseconds();

      const projectDetails = {
        name: name.trim(),
        description: description.trim() || null,
        duration_ms: durationMs,
      };

      // STEP 1: Create the project.
      const { data, error: insertError } = await supabase
        .from("projects")
        .insert({
          user_id: userInfo,
          name: projectDetails.name,
          description: projectDetails.description,
          duration_ms: projectDetails.duration_ms,
          deleted: false,
        })
        .select("*")
        .single();

      if (insertError) throw insertError;

      // STEP 2: Activate inactive tasks.
      const { error: taskError } = await supabase
        .from("tasks")
        .update({ key: true })
        .eq("user_id", userInfo)
        .eq("key", false);

      if (taskError) {
        // Clean up project if task activation fails.
        await supabase
          .from("projects")
          .delete()
          .eq("id", data.id)
          .eq("user_id", userInfo);

        throw new Error(
          `Your project could not finish setting up because task activation failed: ${taskError.message}`
        );
      }

      // STEP 3: Update shared application state.
      setProjectDetails(projectDetails);
      setCurrentProject(data);
      setTaskKey(true);

      setProject((previous) => [
        ...(previous ?? []),
        {
          ...data,
          nominees: [],
        },
      ]);

      // STEP 4: Continue to nominee registration.
      router.push("/home/register");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create your project."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ProjectLoading />;
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-1 py-4 text-white sm:py-5">

      {/* Static decorative glass bubbles - scattered around the page */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">

        {/* Large upper-left bubble */}
        <div className="absolute left-[5%] top-[12%] h-40 w-40 rounded-full border border-emerald-300/15 bg-gradient-to-br from-emerald-300/[0.09] via-emerald-500/[0.035] to-transparent shadow-[inset_0_0_35px_rgba(52,211,153,0.07)] sm:left-[10%] sm:h-52 sm:w-52" />

        {/* Small upper-middle bubble */}
        <div className="absolute left-[38%] top-[16%] h-7 w-7 rounded-full border border-emerald-300/25 bg-emerald-300/[0.07] sm:h-10 sm:w-10" />

        {/* Medium upper-right bubble */}
        <div className="absolute right-[8%] top-[24%] h-16 w-16 rounded-full border border-emerald-300/20 bg-emerald-300/[0.05] shadow-[inset_0_0_20px_rgba(52,211,153,0.10)] sm:right-[14%] sm:h-24 sm:w-24" />

        {/* Small left-middle bubble */}
        <div className="absolute left-[18%] top-[48%] h-8 w-8 rounded-full border border-emerald-300/25 bg-emerald-300/[0.07] sm:left-[24%] sm:h-11 sm:w-11" />

        {/* Large right-middle bubble */}
        <div className="absolute -right-12 top-[47%] h-44 w-44 rounded-full border border-emerald-300/15 bg-gradient-to-br from-emerald-300/[0.08] via-emerald-500/[0.03] to-transparent shadow-[inset_0_0_40px_rgba(52,211,153,0.07)] sm:right-[3%] sm:h-56 sm:w-56" />

        {/* Small lower-middle bubble */}
        <div className="absolute left-[48%] top-[76%] h-6 w-6 rounded-full border border-emerald-300/25 bg-emerald-300/[0.07] sm:h-9 sm:w-9" />

        {/* Medium lower-left bubble */}
        <div className="absolute bottom-[8%] left-[7%] h-20 w-20 rounded-full border border-emerald-300/15 bg-emerald-300/[0.05] shadow-[inset_0_0_25px_rgba(52,211,153,0.08)] sm:left-[16%] sm:h-28 sm:w-28" />

        {/* Small far-right bubble */}
        <div className="absolute bottom-[16%] right-[12%] h-8 w-8 rounded-full border border-emerald-300/25 bg-emerald-300/[0.07] sm:right-[22%] sm:h-10 sm:w-10" />

      </div>

      {/* Main content */}
      <div className="relative z-10 mx-auto flex min-h-[85vh] max-w-3xl items-center justify-center">

        {/* Main Card */}
        <form
          onSubmit={handleCreateProject}
          className="w-full max-w-2xl rounded-3xl border border-emerald-400/15 bg-[#0b1913]/95 p-6 shadow-[0_0_55px_rgba(0,0,0,0.30)] backdrop-blur-xl sm:p-8"
        >

          {/* Header */}
          <div className="mb-7">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
                Project setup · Step 1
              </p>
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Create your election
            </h1>

            <p className="mt-2 max-w-lg text-sm leading-6 text-white/50">
              Set up your project before adding the people who will
              participate in the election. Give your election a name,
              description, and voting period.
            </p>
          </div>

          <div className="space-y-6">

            {/* Project Name */}
            <div>
              <label
                htmlFor="project-name"
                className="mb-2 block text-sm font-medium text-white/80"
              >
                Project name
              </label>

              <input
                id="project-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Student Representative Election"
                required
                className="w-full rounded-xl border border-emerald-400/15 bg-black/30 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10 [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[box-shadow:0_0_0px_1000px_#0b1913_inset]"
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="project-description"
                className="mb-2 block text-sm font-medium text-white/80"
              >
                Description

                <span className="ml-2 text-xs font-normal text-white/35">
                  Optional
                </span>
              </label>

              <textarea
                id="project-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe what this election is about..."
                rows={4}
                className="w-full resize-none rounded-xl border border-emerald-400/15 bg-black/30 px-4 py-3.5 text-sm leading-6 text-white outline-none transition placeholder:text-white/25 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/10 [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[box-shadow:0_0_0px_1000px_#0b1913_inset]"
              />
            </div>

            {/* Election Duration */}
            <div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-white/80">
                  Election duration
                </label>

                <p className="mt-1.5 text-xs leading-5 text-white/40">
                  Choose how long participants will have to vote.
                </p>
              </div>

              {/* Duration Presets */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {durationPresets.map((preset) => {
                  const selected =
                    durationMode === "preset" &&
                    selectedPreset === preset.label;

                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setDurationMode("preset");
                        setSelectedPreset(preset.label);
                      }}
                      className={`min-h-[112px] rounded-xl border p-3.5 text-left transition ${
                        selected
                          ? "border-emerald-400/70 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.08)]"
                          : "border-emerald-400/15 bg-black/20 hover:border-emerald-400/40"
                      }`}
                    >
                      <div className="flex h-full flex-col justify-between gap-3">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-sm font-semibold text-white">
                            {preset.label}
                          </span>

                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                              selected
                                ? "border-emerald-400"
                                : "border-white/30"
                            }`}
                          >
                            {selected && (
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            )}
                          </span>
                        </div>

                        <div>
                          <p className="text-[11px] leading-5 text-white/40">
                            {preset.description}
                          </p>

                          {preset.label === "1 hour" && (
                            <span className="mt-2 inline-block text-[9px] font-semibold uppercase tracking-wider text-emerald-400">
                              Popular choice
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Duration */}
              <button
                type="button"
                onClick={() => setDurationMode("custom")}
                className={`mt-3 flex w-full items-center justify-between rounded-xl border p-4 text-left transition ${
                  durationMode === "custom"
                    ? "border-emerald-400/70 bg-emerald-500/10"
                    : "border-emerald-400/15 bg-black/20 hover:border-emerald-400/40"
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-white">
                    Custom duration
                  </p>

                  <p className="mt-1 text-xs leading-5 text-white/40">
                    Set your own election time.
                  </p>
                </div>

                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                    durationMode === "custom"
                      ? "border-emerald-400"
                      : "border-white/30"
                  }`}
                >
                  {durationMode === "custom" && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  )}
                </span>
              </button>

              {/* Custom Duration Inputs */}
              {durationMode === "custom" && (
                <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl border border-emerald-400/15 bg-black/20 p-4">
                  <div>
                    <label
                      htmlFor="custom-duration"
                      className="mb-2 block text-xs font-medium text-white/60"
                    >
                      Amount
                    </label>

                    <input
                      id="custom-duration"
                      type="number"
                      min="1"
                      step="1"
                      value={duration}
                      onChange={(event) =>
                        setDuration(event.target.value)
                      }
                      required={durationMode === "custom"}
                      className="w-full min-w-0 rounded-xl border border-emerald-400/15 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/60"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="custom-unit"
                      className="mb-2 block text-xs font-medium text-white/60"
                    >
                      Unit
                    </label>

                    <select
                      id="custom-unit"
                      value={unit}
                      onChange={(event) =>
                        setUnit(event.target.value as DurationUnit)
                      }
                      className="w-full min-w-0 rounded-xl border border-emerald-400/15 bg-[#102019] px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/60"
                    >
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                    </select>
                  </div>
                </div>
              )}

              <p className="mt-3 text-[11px] leading-5 text-white/35">
                Your election will automatically reach its scheduled
                expiration time. Choose a duration that gives participants
                enough time to take part.
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p
              role="alert"
              className="mt-5 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={saving || !userInfo}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-4 text-sm font-semibold text-[#04100a] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Creating project..." : "Continue to nominees"}

            {!saving && <span aria-hidden="true">→</span>}
          </button>

          <p className="mt-4 text-center text-[10px] text-white/30">
            You can proceed to add nominees after creating your election.
          </p>
        </form>
      </div>
    </main>
  );
}
