
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Plus,
  Vote,
  Users,
  CalendarDays,
  ChartNoAxesCombined,
  Clock3,
  CircleDot,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import useApp from "@/lib/useApp";

type UserProfile = {
  name: string;
  email: string;
};

const stats = [
  { label: "Total elections", value: "00", icon: Vote, detail: "All your elections" },
  { label: "Total nominees", value: "00", icon: Users, detail: "Across all elections" },
  { label: "Active elections", value: "00", icon: CircleDot, detail: "Currently running" },
  { label: "Total votes", value: "00", icon: ChartNoAxesCombined, detail: "Votes received" },
];

const activities = [
  { title: "Welcome to VoteSphere", detail: "Your election workspace is ready.", time: "Just now" },
  { title: "Set up your first election", detail: "Start by creating an election.", time: "Next step" },
];

export default function HomePage() {
  const { setUserInfo } = useApp();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileError, setProfileError] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadProfile = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error) throw error;

        if (data.user && isActive) {
          setUserInfo(data.user.id);

          const email = data.user.email ?? "";
          const metadataName =
            data.user.user_metadata?.full_name ??
            data.user.user_metadata?.name ??
            data.user.user_metadata?.display_name;

          setProfile({
            name:
              typeof metadataName === "string" && metadataName.trim()
                ? metadataName.trim()
                : email.split("@")[0] || "VoteSphere user",
            email,
          });
        }
      } catch (error: unknown) {
        if (isActive) {
          setProfileError(
            error instanceof Error
              ? error.message
              : "Unable to load your account details."
          );
        }
      } finally {
        if (isActive) setProfileLoading(false);
      }
    };

    void loadProfile();

    return () => {
      isActive = false;
    };
  }, [setUserInfo]);

  return (
    <div className="w-full min-w-0 space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-emerald-400">
            <Sparkles size={14} />
            YOUR ELECTION WORKSPACE
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Dashboard<span className="text-emerald-400">.</span>
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage your elections and keep every vote organized.
          </p>
        </div>

        <button
          type="button"
          disabled
          title="Election creation will be connected in the next stage"
          className="inline-flex h-10 cursor-not-allowed items-center gap-2 rounded-xl bg-emerald-400 px-4 text-xs font-bold text-[#062116] opacity-70"
        >
          <Plus size={16} />
          Create election
        </button>
      </header>

      <section
        aria-label="Signed-in account"
        className="flex min-w-0 flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-2xl border border-white/[0.07] bg-[#0d1310] px-4 py-3"
      >
        <p className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-400">
          Signed-in account
        </p>
        {profileLoading ? (
          <p role="status" className="text-sm text-zinc-400">
            Loading account details...
          </p>
        ) : profileError ? (
          <p role="alert" className="text-sm text-red-300">
            {profileError}
          </p>
        ) : profile ? (
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="font-semibold text-zinc-100">{profile.name}</p>
            <p className="break-all text-sm text-zinc-400">
              {profile.email || "No email address is available."}
            </p>
          </div>
        ) : (
          <p className="text-sm text-zinc-400">
            No signed-in user was found.
          </p>
        )}
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-emerald-400/15 bg-gradient-to-br from-[#103323] via-[#0c1c14] to-[#0b110e] p-4 sm:p-5">
        <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-emerald-400/10 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-56 w-56 rounded-full bg-emerald-500/[0.07] blur-[80px]" />

        <div className="relative max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[10px] font-semibold tracking-wider text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            WELCOME TO VOTESPHERE
          </span>

          <h2 className="mt-3 text-xl font-bold leading-tight sm:text-2xl">
            Every voice deserves
            <span className="block text-emerald-400">to be heard.</span>
          </h2>

          <p className="mt-2 max-w-md text-sm leading-5 text-zinc-400">
            Create organized elections, manage nominees, invite voters and
            follow results from one secure workspace.
          </p>

          <Link
            href="/home/nominees"
            className="mt-3 inline-flex h-9 items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-4 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/20"
          >
            Explore nominees
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="pointer-events-none absolute bottom-4 right-5 hidden h-28 w-28 items-center justify-center rounded-full border border-emerald-300/10 bg-emerald-300/[0.04] sm:flex">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-400/[0.06] shadow-[0_0_50px_rgba(16,185,129,0.12)]">
            <Vote size={36} className="text-emerald-300" strokeWidth={1.2} />
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Your overview</h2>
            <p className="mt-1 text-xs text-zinc-500">A snapshot of your workspace</p>
          </div>
          <span className="text-[10px] text-zinc-600">LIVE DATA COMING SOON</span>
        </div>

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {stats.map(({ label, value, icon: Icon, detail }) => (
            <div
              key={label}
              className="rounded-2xl border border-white/[0.07] bg-[#0d1310] p-3 transition hover:border-emerald-400/20 sm:p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-zinc-500">{label}</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-400/[0.09] text-emerald-400">
                  <Icon size={16} />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
              <p className="mt-1 text-[10px] text-zinc-600">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid min-w-0 gap-3 xl:grid-cols-[1.4fr_1fr]">
        <div className="min-w-0 rounded-2xl border border-white/[0.07] bg-[#0d1310] p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Recent elections</h2>
              <p className="mt-1 text-xs text-zinc-500">Your latest election activity</p>
            </div>
            <CalendarDays size={18} className="text-emerald-400" />
          </div>

          <div className="mt-4 flex min-h-24 flex-col items-center justify-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.025] text-zinc-500">
              <Vote size={22} />
            </div>
            <p className="mt-3 text-xs font-medium text-zinc-300">No elections yet</p>
            <p className="mt-1 max-w-xs text-[11px] leading-5 text-zinc-600">
              Your elections will appear here when you create your first one.
            </p>
          </div>
        </div>

        <div className="min-w-0 rounded-2xl border border-white/[0.07] bg-[#0d1310] p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Getting started</h2>
              <p className="mt-1 text-xs text-zinc-500">Your next steps</p>
            </div>
            <Clock3 size={18} className="text-emerald-400" />
          </div>

          <div className="mt-4 space-y-3">
            {activities.map((activity, index) => (
              <div key={activity.title} className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-xs font-bold text-emerald-400">
                  {index + 1}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-zinc-200">{activity.title}</p>
                  <p className="mt-1 text-[11px] text-zinc-500">{activity.detail}</p>
                  <p className="mt-1 text-[10px] text-zinc-600">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="flex items-center justify-between border-t border-white/[0.06] pt-4 text-[10px] text-zinc-600">
        <span>VoteSphere Workspace</span>
        <span className="flex items-center gap-1.5">
          <ArrowUpRight size={12} />
          Your voice. Your choice.
        </span>
      </footer>
    </div>
  );
}