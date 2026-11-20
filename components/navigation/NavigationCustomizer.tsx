
"use client";

import { useEffect, useRef, useState } from "react";
import { Check, PanelBottom, PanelLeft, PanelRight, Plus, X } from "lucide-react";

export type NavigationPosition = "left" | "right" | "bottom";

interface NavigationCustomizerProps {
  position: NavigationPosition;
  onPositionChange: (position: NavigationPosition) => void;
}

const positions = [
  { value: "left", label: "Left", icon: PanelLeft },
  { value: "right", label: "Right", icon: PanelRight },
  { value: "bottom", label: "Bottom", icon: PanelBottom },
] as const;

export default function NavigationCustomizer({
  position,
  onPositionChange,
}: NavigationCustomizerProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const selectPosition = (value: NavigationPosition) => {
    onPositionChange(value);
    setOpen(false);
  };

  const panelPosition =
    position === "left"
      ? "left-full top-0 ml-3"
      : position === "right"
        ? "right-full top-0 mr-3"
        : "";
  const controlPosition =
    position === "bottom"
      ? "right-2 top-1/2 -translate-y-1/2"
      : "left-1/2 top-2 -translate-x-1/2";

  return (
    <div
      ref={panelRef}
      className={`absolute z-[100] hidden md:block ${controlPosition}`}
    >
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-label="Customize navigation position"
        aria-expanded={open}
        className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border transition-all ${
          open
            ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-300"
            : "border-white/[0.08] bg-white/[0.04] text-zinc-400 hover:border-emerald-400/30 hover:bg-emerald-400/10 hover:text-emerald-300"
        }`}
      >
        {open ? <X size={15} /> : <Plus size={15} />}
      </button>

      {open && (
        <div
          className={`absolute z-[100] max-h-[calc(100dvh-2rem)] w-44 overflow-y-auto rounded-xl border border-emerald-400/15 bg-[#0c1510]/95 p-2 shadow-[0_18px_55px_rgba(0,0,0,0.6)] backdrop-blur-2xl ${panelPosition}`}
          style={
            position === "bottom"
              ? { right: 0, bottom: "calc(100% + 0.75rem)" }
              : undefined
          }
        >
          <div className="mb-2 px-1">
            <p className="text-[11px] font-semibold text-white">Navigation</p>
            <p className="mt-0.5 text-[10px] text-zinc-500">Choose a position.</p>
          </div>

          <div className="space-y-1">
            {positions.map(({ value, label, icon: Icon }) => {
              const active = position === value;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => selectPosition(value)}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-lg border px-2.5 py-2 text-[11px] transition-all ${
                    active
                      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                      : "border-transparent text-zinc-400 hover:border-white/[0.07] hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon size={15} />
                    {label}
                  </span>

                  {active && <Check size={15} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
