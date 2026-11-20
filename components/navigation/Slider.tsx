
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  Users,
  Share2,
  History,
  Settings,
} from "lucide-react";

import NavigationCustomizer, {
  type NavigationPosition,
} from "./NavigationCustomizer";

interface SliderProps {
  position: NavigationPosition;
  onPositionChange: (position: NavigationPosition) => void;
  showNomineesIndicator: boolean;
}

const navigation = [
  { label: "Home", href: "/home", icon: House },
  { label: "Nominees", href: "/home/nominees", icon: Users },
  { label: "Share", href: "/home/share", icon: Share2 },
  { label: "History", href: "/home/history", icon: History },
  { label: "Settings", href: "/home/settings", icon: Settings },
];

const homePaths = ["/home", "/home/starting", "/home/register"];

export default function Slider({
  position,
  onPositionChange,
  showNomineesIndicator,
}: SliderProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/home") {
      return homePaths.includes(pathname);
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const vertical = position !== "bottom";

  const tooltipPosition =
    position === "left"
      ? "left-full top-1/2 ml-3 -translate-y-1/2"
      : position === "right"
        ? "right-full top-1/2 mr-3 -translate-y-1/2"
        : "bottom-full left-1/2 mb-3 -translate-x-1/2";

  return (
    <>
      {/* Desktop and tablet navigation */}
      <aside
        className={`fixed z-50 hidden border border-white/[0.08] bg-[#0b120e]/90 shadow-[0_10px_50px_rgba(0,0,0,0.35)] backdrop-blur-2xl transition-all duration-300 md:flex ${
          vertical
            ? `top-1/2 w-[64px] -translate-y-1/2 flex-col items-center rounded-[20px] px-2 pb-2 pt-11 ${
                position === "left" ? "left-3" : "right-3"
              }`
            : "bottom-4 left-1/2 h-[64px] w-auto -translate-x-1/2 items-center rounded-[20px] py-2 pl-2 pr-12"
        }`}
      >
        <nav
          aria-label="Main navigation"
          className={`flex ${vertical ? "flex-col items-center gap-1" : "items-center gap-1"}`}
        >
          {navigation.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);

            return (
              <Link
                key={href}
                href={href}
                title={label}
                aria-label={
                  showNomineesIndicator && href === "/home/nominees"
                    ? "Nominees, election activity needs attention"
                    : label
                }
                aria-current={active ? "page" : undefined}
                className={`group relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl transition-all duration-200 ${
                  active
                    ? "bg-emerald-400/15 text-emerald-300 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.17),0_0_20px_rgba(16,185,129,0.08)]"
                    : "text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-100"
                }`}
              >
                {active && vertical && (
                  <span className="absolute -left-[10px] h-5 w-[3px] rounded-r-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]" />
                )}

                <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />

                {showNomineesIndicator && href === "/home/nominees" && (
                  <span
                    aria-hidden="true"
                    className="absolute right-1 top-1 h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.8)] after:absolute after:inset-0 after:animate-ping after:rounded-full after:bg-emerald-300/70 motion-reduce:after:animate-none"
                  />
                )}

                <span
                  className={`pointer-events-none absolute z-[60] hidden whitespace-nowrap rounded-lg border border-white/10 bg-[#111b15] px-2.5 py-1.5 text-[10px] font-medium text-white opacity-0 shadow-xl transition-all group-hover:block group-hover:opacity-100 ${tooltipPosition}`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        <span
          aria-hidden="true"
          className={
            vertical
              ? "absolute left-1/2 top-9 h-px w-8 -translate-x-1/2 bg-white/[0.08]"
              : "absolute right-10 top-1/2 h-8 w-px -translate-y-1/2 bg-white/[0.08]"
          }
        />

        <NavigationCustomizer
          position={position}
          onPositionChange={onPositionChange}
        />
      </aside>

      {/* Mobile navigation */}
      <nav
        aria-label="Mobile navigation"
        className="fixed bottom-3 left-1/2 z-50 flex w-[calc(100%-24px)] max-w-[410px] -translate-x-1/2 items-center justify-around rounded-[20px] border border-white/[0.10] bg-[#0b120e]/95 px-2 py-2 shadow-[0_12px_45px_rgba(0,0,0,0.55)] backdrop-blur-2xl md:hidden"
      >
        {navigation.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);

          return (
            <Link
              key={href}
              href={href}
              aria-label={
                showNomineesIndicator && href === "/home/nominees"
                  ? "Nominees, election activity needs attention"
                  : label
              }
              aria-current={active ? "page" : undefined}
              className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                active
                  ? "bg-emerald-400/15 text-emerald-300"
                  : "text-zinc-500 hover:bg-white/[0.05] hover:text-white"
              }`}
            >
              <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />

              {showNomineesIndicator && href === "/home/nominees" && (
                <span
                  aria-hidden="true"
                  className="absolute right-1 top-1 h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.8)] after:absolute after:inset-0 after:animate-ping after:rounded-full after:bg-emerald-300/70 motion-reduce:after:animate-none"
                />
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
