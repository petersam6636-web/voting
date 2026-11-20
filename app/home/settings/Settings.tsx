
"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Settings,
  UserRound,
  ShieldCheck,
  Bell,
  Palette,
  Database,
  LogOut,
  LoaderCircle,
  X,
  Code2,
  Sparkles,
  ChevronRight,
  Mail,
  Info,
} from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { supabase } from "@/lib/supabase-client";

// ------------------------------------------------------
// GSAP CONFIGURATION
// ------------------------------------------------------

gsap.registerPlugin(ScrollTrigger, useGSAP);

// ------------------------------------------------------
// TYPES
// ------------------------------------------------------

type User = {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    display_name?: string;
    avatar_url?: string;
    picture?: string;
    profile_image?: string;
  };
};

// ------------------------------------------------------
// APPLICATION SETTINGS
// ------------------------------------------------------

const settings = [
  {
    title: "Profile",
    description: "Manage your account information and personal details.",
    icon: UserRound,
  },
  {
    title: "Security",
    description: "Review account security and authentication options.",
    icon: ShieldCheck,
  },
  {
    title: "Notifications",
    description: "Manage election updates and notification preferences.",
    icon: Bell,
  },
  {
    title: "Appearance",
    description: "VoteSphere uses its dark emerald interface.",
    icon: Palette,
  },
  {
    title: "Data and privacy",
    description: "Information about your account and election data.",
    icon: Database,
  },
];

// ------------------------------------------------------
// SETTINGS PAGE
// ------------------------------------------------------

export default function SettingsPage() {
  const router = useRouter();

  // Layout references
  const layoutRef = useRef<HTMLDivElement>(null);
  const accountCardRef = useRef<HTMLElement>(null);
  const settingsCardRef = useRef<HTMLElement>(null);

  // Account state
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Logout state
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");

  // Modal state
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeveloperModal, setShowDeveloperModal] = useState(false);

  // ------------------------------------------------------
  // FETCH AUTHENTICATED USER
  // ------------------------------------------------------

  useEffect(() => {
    let active = true;

    const getUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error) throw error;

        if (active) {
          setUser(data.user as User | null);
        }
      } catch (err) {
        console.error("Unable to load user:", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    getUser();

    return () => {
      active = false;
    };
  }, []);

  // ------------------------------------------------------
  // DESKTOP ACCOUNT CARD SCROLL PINNING
  // ------------------------------------------------------

  useGSAP(
    () => {
      const accountCard = accountCardRef.current;
      const settingsCard = settingsCardRef.current;

      if (!accountCard || !settingsCard) return;

      const media = gsap.matchMedia();

      media.add("(min-width: 1024px)", () => {
        const accountHeight = accountCard.offsetHeight;
        const settingsHeight = settingsCard.offsetHeight;

        // Only pin when the settings card is taller.
        const scrollDistance = settingsHeight - accountHeight;

        if (scrollDistance <= 0) return;

        const trigger = ScrollTrigger.create({
          trigger: layoutRef.current,
          pin: accountCard,
          scrub: 0.1,
          start: "top top+=24",
          end: () => {
            const currentAccountHeight = accountCard.offsetHeight;
            const currentSettingsHeight = settingsCard.offsetHeight;

            return `+=${Math.max(
              0,
              currentSettingsHeight - currentAccountHeight
            )}`;
          },
          pinSpacing: false,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        });

        return () => {
          trigger.kill();
        };
      });

      return () => {
        media.revert();
      };
    },
    {
      scope: layoutRef,
      dependencies: [loading],
      revertOnUpdate: true,
    }
  );
  // ------------------------------------------------------
  // HANDLE ESCAPE KEY FOR MODALS
  // ------------------------------------------------------

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loggingOut) {
        setShowDeveloperModal(false);
        setShowLogoutModal(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [loggingOut]);
console.log(2)
  // ------------------------------------------------------
  // USER INFORMATION
  // ------------------------------------------------------

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    "User";

  const userEmail = user?.email || "No email available";

  const profileImage =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    user?.user_metadata?.profile_image;

  // ------------------------------------------------------
  // SIGN OUT
  // ------------------------------------------------------

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    setError("");

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        setError("Unable to sign out. Please try again.");
        setLoggingOut(false);
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("Unable to sign out. Please try again.");
      setLoggingOut(false);
    }
  };

  // ------------------------------------------------------
  // OPEN LOGOUT MODAL
  // ------------------------------------------------------

  const openLogoutModal = () => {
    setError("");
    setShowLogoutModal(true);
  };

  // ------------------------------------------------------
  // RENDER
  // ------------------------------------------------------

  return (
    <main className="relative min-h-screen overflow-hidden px-2 py-4 text-white sm:px-3">
      {/* --------------------------------------------------
          STATIC BACKGROUND DECORATION
      -------------------------------------------------- */}

      {/* MAIN CONTENT */}

      <div className="relative mx-auto max-w-7xl">

        {/* --------------------------------------------------
            HEADER
        -------------------------------------------------- */}

        <header className="mb-9">
          <div className="mb-3 flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.09] bg-white/[0.045] shadow-lg shadow-emerald-950/20">
              <Settings className="h-5 w-5 text-gray-300" />
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-emerald-400">
                Account workspace
              </p>

              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                Settings<span className="text-emerald-400">.</span>
              </h1>
            </div>

          </div>

          <p className="max-w-2xl text-sm leading-6 text-gray-400">
            Manage your account, review your application preferences, and
            learn more about the people behind VoteSphere.
          </p>
        </header>

        {/* --------------------------------------------------
            MAIN LAYOUT
        -------------------------------------------------- */}

        <div
          ref={layoutRef}
          className="grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-[0.85fr_1.4fr]"
        >

          {/* --------------------------------------------------
              ACCOUNT CARD
          -------------------------------------------------- */}

          <section
            ref={accountCardRef}
            className="h-fit min-w-0 overflow-hidden rounded-3xl border border-white/[0.09] bg-[#0b1510]/95 shadow-2xl shadow-black/30"
          >

            {/* Card Header */}

            <div className="border-b border-white/[0.07] px-6 py-5">

              <div className="flex items-center gap-3">
                <UserRound className="h-5 w-5 text-gray-400" />

                <h2 className="font-semibold">
                  Your account
                </h2>
              </div>

              <p className="mt-1 text-sm text-gray-500">
                Your personal VoteSphere account information.
              </p>

            </div>

            {/* Account Information */}

            <div className="p-5 sm:p-6">

              {loading ? (

                <div className="flex min-h-48 items-center justify-center">
                  <div className="flex flex-col items-center gap-3">

                    <LoaderCircle className="h-7 w-7 animate-spin text-emerald-400" />

                    <p className="text-xs text-gray-500">
                      Preparing your account...
                    </p>

                  </div>
                </div>

              ) : (

                <div className="space-y-6">

                  {/* Welcome Message */}

                  <div className="rounded-2xl border border-emerald-400/[0.12] bg-gradient-to-br from-emerald-400/[0.08] via-white/[0.025] to-transparent p-5">

                    <div className="flex items-center gap-4">

                      {/* Profile Image */}

                      <div className="relative shrink-0">

                        <div className="absolute -inset-1 rounded-[22px] bg-emerald-400/20 blur-md" />

                        <div className="relative flex h-[76px] w-[76px] items-center justify-center overflow-hidden rounded-[20px] border border-emerald-400/20 bg-[#14231a] shadow-lg shadow-black/20">

                          {profileImage ? (

                            <img
                              src={profileImage}
                              alt={`${userName}'s profile`}
                              className="h-full w-full object-cover"
                            />

                          ) : (

                            <span className="text-3xl font-semibold text-emerald-300">
                              {userName.charAt(0).toUpperCase()}
                            </span>

                          )}

                        </div>

                      </div>

                      {/* User Details */}

                      <div className="min-w-0 flex-1">

                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
                          Welcome back
                        </p>

                        <h3 className="mt-1.5 truncate text-lg font-semibold tracking-tight text-white sm:text-xl">
                          {userName}
                        </h3>

                        <p className="mt-1 text-xs text-gray-400">
                          Your VoteSphere account
                        </p>

                      </div>

                    </div>

                    <div className="mt-5 border-t border-white/[0.07] pt-4">

                      <p className="text-xs leading-5 text-gray-400">
                        Welcome to your account space. Here you can view
                        your personal information and manage your
                        VoteSphere experience.
                      </p>

                    </div>

                  </div>

                  {/* Email Information */}

                </div>

              )}

            </div>

          </section>

          {/* --------------------------------------------------
              APPLICATION SETTINGS CARD
          -------------------------------------------------- */}

          <section
            ref={settingsCardRef}
            className="min-w-0 overflow-hidden rounded-3xl border border-white/[0.09] bg-[#0b1510]/95 shadow-2xl shadow-black/30"
          >

            {/* Card Header */}

            <div className="border-b border-white/[0.07] px-6 py-5">

              <div className="flex items-center gap-3">

                <Settings className="h-5 w-5 text-gray-400" />

                <h2 className="font-semibold">
                  Application settings
                </h2>

              </div>

              <p className="mt-1 text-sm text-gray-500">
                Your VoteSphere application preferences and information.
              </p>

            </div>

            <div className="p-3 sm:p-4">

              {/* EXISTING SETTINGS */}

              <div className="space-y-1">

                {settings.map((item) => {

                  const Icon = item.icon;

                  return (

                    <div
                      key={item.title}
                      className="group flex items-center gap-4 rounded-2xl px-3 py-4 transition-all duration-200 hover:bg-white/[0.035] sm:px-4"
                    >

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.035] transition-all duration-200 group-hover:border-emerald-400/15 group-hover:bg-emerald-400/[0.045]">

                        <Icon className="h-[19px] w-[19px] text-gray-400 transition-colors group-hover:text-emerald-300" />

                      </div>

                      <div className="min-w-0 flex-1">

                        <h3 className="text-sm font-medium text-gray-200">
                          {item.title}
                        </h3>

                        <p className="mt-1 text-xs leading-5 text-gray-500 sm:text-sm">
                          {item.description}
                        </p>

                      </div>

                      <span className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.035] px-2.5 py-1 text-[10px] font-medium text-gray-500">
                        Coming next
                      </span>

                    </div>

                  );

                })}

              </div>

              {/* ABOUT THE DEVELOPER */}

              <div className="my-3 border-t border-white/[0.07]" />

              <button
                type="button"
                onClick={() => setShowDeveloperModal(true)}
                className="group flex w-full items-center gap-4 rounded-2xl px-3 py-4 text-left transition-all duration-200 hover:bg-emerald-400/[0.045] sm:px-4"
              >

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] transition-all duration-200 group-hover:border-emerald-400/20 group-hover:bg-emerald-400/[0.06]">

                  <Info className="h-[19px] w-[19px] text-gray-400 transition-colors group-hover:text-emerald-300" />

                </div>

                <div className="min-w-0 flex-1">

                  <h3 className="text-sm font-medium text-gray-200">
                    About the Developer
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-gray-500 sm:text-sm">
                    Learn about the developer and the team behind VoteSphere.
                  </p>

                </div>

                <div className="flex shrink-0 items-center gap-2">

                  <span className="hidden rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-2.5 py-1 text-[10px] font-medium text-emerald-300 sm:inline-flex">
                    Learn more
                  </span>

                  <ChevronRight className="h-4 w-4 text-gray-500 transition-all duration-200 group-hover:translate-x-1 group-hover:text-emerald-300" />

                </div>

              </button>

              {/* SIGN OUT */}

              <div className="my-3 border-t border-white/[0.07]" />

              <div className="flex flex-col gap-4 rounded-2xl px-3 py-4 transition-colors duration-200 hover:bg-red-400/[0.025] sm:flex-row sm:items-center sm:justify-between sm:px-4">

                <div className="flex items-center gap-4">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-400/10 bg-red-400/[0.055] shadow-lg shadow-red-950/10">

                    <LogOut className="h-[19px] w-[19px] text-red-400" />

                  </div>

                  <div>

                    <h3 className="text-sm font-medium text-gray-200">
                      Sign out of your account
                    </h3>

                    <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                      End your current VoteSphere session.
                    </p>

                  </div>

                </div>

                <button
                  type="button"
                  onClick={openLogoutModal}
                  className="rounded-xl border border-red-400/20 bg-red-400/[0.07] px-5 py-2.5 text-xs font-semibold text-red-300 transition-all duration-200 hover:border-red-400/40 hover:bg-red-400/[0.13] hover:shadow-lg hover:shadow-red-950/20 sm:ml-auto"
                >
                  Sign out
                </button>

              </div>

            </div>

          </section>

        </div>

        {/* FOOTER */}

        <p className="mt-8 text-center text-xs text-gray-600">
          VoteSphere · Account and application settings
        </p>

      </div>

      {/* ==================================================
          ABOUT THE DEVELOPER MODAL
      ================================================== */}

      {showDeveloperModal && (

        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/75 px-4 py-8 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowDeveloperModal(false);
            }
          }}
        >

          <div className="relative my-auto w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">

            {/* Emerald Modal Glow */}

            <div className="pointer-events-none absolute -inset-1 rounded-[30px] bg-emerald-500/[0.10] blur-2xl" />

            {/* Modal Container */}

            <div className="relative overflow-hidden rounded-[28px] border border-white/[0.11] bg-[#0b1510] shadow-2xl shadow-black/50">

              {/* Static Modal Decoration */}

              <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-emerald-400/[0.08] blur-[90px]" />

              <div className="pointer-events-none absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-teal-400/[0.06] blur-[90px]" />

              {/* MODAL HEADER */}

              <div className="relative flex items-center justify-between border-b border-white/[0.07] px-6 py-5">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.09] bg-white/[0.04]">

                    <Info className="h-5 w-5 text-gray-300" />

                  </div>

                  <div>

                    <h2 className="font-semibold text-white">
                      About the Developer
                    </h2>

                    <p className="mt-0.5 text-xs text-gray-500">
                      The person behind VoteSphere
                    </p>

                  </div>

                </div>

                <button
                  type="button"
                  onClick={() => setShowDeveloperModal(false)}
                  aria-label="Close developer information"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.035] text-gray-400 transition-all hover:border-white/[0.15] hover:bg-white/[0.09] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>

              </div>

              {/* MODAL CONTENT */}

              <div className="relative p-6 sm:p-7">

                {/* Developer Profile */}

                <div className="flex flex-col items-center text-center">

                  {/* Business Logo With Emerald Glow */}

                  <div className="relative">

                    <div className="pointer-events-none absolute -inset-4 rounded-[32px] bg-emerald-400/[0.16] blur-2xl" />

                    <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-[26px] border border-emerald-400/20 bg-[#101b14] p-3 shadow-[0_0_25px_rgba(16,185,129,0.12),0_12px_35px_rgba(0,0,0,0.45)]">

                      <Image
                        src="/business-logo.png"
                        alt="Business logo"
                        fill
                        priority
                        sizes="128px"
                        className="rounded-[22px] object-contain p-3"
                      />

                    </div>

                  </div>

                  {/* Developer Badge */}

                  <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">

                    <Sparkles className="h-3 w-3" />

                    Meet the developer

                  </span>

                  {/* Developer Name */}

                  <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white">
                    Solomon Arthur
                  </h3>

                  <p className="mt-1 text-sm text-gray-400">
                    Application Developer
                  </p>

                </div>

                {/* DEVELOPER INFORMATION */}

                <div className="mt-7 space-y-3">

                  <div className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 transition-colors hover:bg-white/[0.04]">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.045]">

                      <Code2 className="h-5 w-5 text-gray-300" />

                    </div>

                    <div>

                      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-gray-500">
                        Working name
                      </p>

                      <p className="mt-1 text-sm font-semibold text-gray-100">
                        VisionCraft
                      </p>

                    </div>

                  </div>

                </div>

                {/* MODAL FOOTER */}

                <div className="mt-6 flex items-center justify-between border-t border-white/[0.07] pt-5">

                  <div>

                    <p className="text-xs font-semibold tracking-wide text-gray-300">
                      VisionCraft <span className="text-emerald-400">·</span>
                    </p>

                    <p className="mt-1 text-[10px] text-gray-600">
                      Behind the VoteSphere experience
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={() => setShowDeveloperModal(false)}
                    className="rounded-xl border border-white/[0.1] bg-white/[0.045] px-5 py-2.5 text-xs font-semibold text-gray-200 transition-all hover:border-emerald-400/20 hover:bg-white/[0.09]"
                  >
                    Close
                  </button>

                </div>

              </div>

            </div>

          </div>

        </div>

      )}

      {/* ==================================================
          SIGN OUT CONFIRMATION MODAL
      ================================================== */}

      {showLogoutModal && (

        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 px-4 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !loggingOut) {
              setShowLogoutModal(false);
            }
          }}
        >

          <div className="relative w-full max-w-md animate-in fade-in zoom-in-95 duration-200">

            {/* Red Modal Glow */}

            <div className="pointer-events-none absolute -inset-1 rounded-[28px] bg-red-500/[0.08] blur-2xl" />

            {/* Modal Container */}

            <div className="relative overflow-hidden rounded-[26px] border border-red-400/15 bg-[#101310] p-6 shadow-2xl shadow-black/50 sm:p-7">

              {/* Logout Icon */}

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-400/15 bg-red-400/[0.08] shadow-lg shadow-red-950/20">

                <LogOut className="h-6 w-6 text-red-400" />

              </div>

              {/* Modal Heading */}

              <h2 className="mt-5 text-xl font-semibold text-white">
                Are you sure?
              </h2>

              {/* Modal Description */}

              <p className="mt-3 text-sm leading-6 text-gray-400">
                Are you sure you want to sign out of your VoteSphere account?
                You will need to log in again to access your workspace.
              </p>

              {/* Error Message */}

              {error && (

                <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-sm text-red-300">
                  {error}
                </div>

              )}

              {/* Modal Actions */}

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                {/* Cancel */}

                <button
                  type="button"
                  disabled={loggingOut}
                  onClick={() => {
                    setShowLogoutModal(false);
                    setError("");
                  }}
                  className="rounded-xl border border-white/[0.09] bg-white/[0.035] px-5 py-3 text-sm font-medium text-gray-300 transition-all hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  No, stay
                </button>

                {/* Confirm Logout */}

                <button
                  type="button"
                  disabled={loggingOut}
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-500 px-5 py-3 text-sm font-semibold text-white transition-all hover:border-red-400/40 hover:bg-red-400 hover:shadow-lg hover:shadow-red-950/20 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {loggingOut ? (

                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Signing out...
                    </>

                  ) : (

                    <>
                      <LogOut className="h-4 w-4" />
                      Yes, sign out
                    </>

                  )}

                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}
