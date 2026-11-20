"use client";

import { useRouter } from "next/navigation";
import { Plus, Vote, Sparkles, Users, ShieldCheck } from "lucide-react";

export default function NoProject() {
  const router = useRouter();

  const handleCreateProject = () => {
    router.push("/home/starting");
  };

  return (
    <main className="page-shell relative isolate flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[#050a07] px-3 py-4 sm:px-4 sm:py-8">

      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[450px] w-[450px] rounded-full bg-emerald-500/[0.09] blur-[140px]" />
        <div className="absolute -bottom-48 -right-40 h-[500px] w-[500px] rounded-full bg-green-500/[0.08] blur-[150px]" />
        <div className="absolute left-1/2 top-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-900/[0.12] blur-[120px]" />

        {/* Dotted background texture */}
        <div
          className="absolute inset-0 opacity-[0.13]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(52,211,153,0.45) 0.7px, transparent 0.7px)",
            backgroundSize: "25px 25px",
            maskImage:
              "radial-gradient(ellipse at center, black 15%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 15%, transparent 80%)",
          }}
        />

        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#050a07_85%)] opacity-60" />
      </div>

      {/* Floating glass orbs */}
      <div className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
        <div className="absolute left-[12%] top-[18%] h-20 w-20 animate-[float_8s_ease-in-out_infinite] rounded-full border border-emerald-300/15 bg-emerald-300/[0.035] shadow-[inset_0_0_25px_rgba(52,211,153,0.06),0_0_35px_rgba(16,185,129,0.06)] backdrop-blur-sm" />

        <div className="absolute right-[14%] top-[22%] h-12 w-12 animate-[float_10s_ease-in-out_infinite] rounded-full border border-emerald-300/20 bg-emerald-300/[0.04] shadow-[inset_0_0_18px_rgba(52,211,153,0.08),0_0_30px_rgba(16,185,129,0.08)]" />

        <div className="absolute bottom-[17%] left-[20%] h-14 w-14 animate-[float_9s_ease-in-out_infinite] rounded-full border border-emerald-300/15 bg-emerald-300/[0.035] shadow-[0_0_35px_rgba(16,185,129,0.07)]" />

        <div className="absolute bottom-[20%] right-[18%] h-24 w-24 animate-[float_11s_ease-in-out_infinite] rounded-full border border-emerald-300/10 bg-emerald-300/[0.025] shadow-[inset_0_0_30px_rgba(52,211,153,0.05),0_0_40px_rgba(16,185,129,0.05)]" />

        <div className="absolute left-[48%] top-[10%] h-3 w-3 rounded-full bg-emerald-300/30 shadow-[0_0_18px_rgba(52,211,153,0.5)]" />
        <div className="absolute bottom-[12%] left-[55%] h-2 w-2 rounded-full bg-emerald-300/25 shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
      </div>

      {/* Main card */}
      <section className="relative z-10 w-full max-w-[420px]">
        <div className="absolute -inset-px rounded-[28px] bg-gradient-to-br from-emerald-400/25 via-emerald-900/10 to-emerald-300/15 opacity-70 blur-[1px]" />

        <div className="project-card relative overflow-hidden rounded-[25px] border border-emerald-400/[0.16] bg-[#0b120e]/95 px-5 py-7 text-center shadow-[0_25px_100px_rgba(0,0,0,0.55),0_0_50px_rgba(16,185,129,0.045)] backdrop-blur-xl sm:rounded-[27px] sm:px-9 sm:py-11">

          {/* Card ambient glow */}
          <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-emerald-400/[0.09] blur-[85px]" />
          <div className="pointer-events-none absolute -bottom-28 -left-20 h-52 w-52 rounded-full bg-green-500/[0.06] blur-[85px]" />

          {/* Top label */}

          {/* Icon */}
          <div className="card-icon relative mx-auto mt-5 flex h-16 w-16 items-center justify-center rounded-[23px] border border-emerald-300/20 bg-gradient-to-br from-emerald-400/[0.14] to-emerald-950/40 text-emerald-300 shadow-[inset_0_0_25px_rgba(52,211,153,0.08),0_0_35px_rgba(16,185,129,0.09)] sm:mt-7 sm:h-[76px] sm:w-[76px]">
            <Vote size={34} strokeWidth={1.4} />

            <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-emerald-300/20 bg-[#101b14] text-emerald-300 shadow-lg">
              <Sparkles size={13} />
            </div>
          </div>

          {/* Heading */}
          <h2 className="relative mt-4 text-[22px] font-bold tracking-tight text-white sm:mt-6 sm:text-2xl">
            No project yet<span className="text-emerald-400">.</span>
          </h2>

          <p className="relative mx-auto mt-2 max-w-[310px] text-[12px] leading-[1.65] text-zinc-400 sm:mt-3 sm:text-[13px] sm:leading-6">
            Your voting workspace is ready. Create your first election
            project and give everyone a chance to make their voice count.
          </p>

          {/* Feature details */}

          {/* Button */}
          <button
            type="button"
            onClick={handleCreateProject}
            title="Add a new vote"
            aria-label="Add a new vote"
            className="group cursor-pointer relative mx-auto mt-5 inline-flex h-11 w-full max-w-[230px] items-center justify-center gap-2 overflow-hidden rounded-xl bg-emerald-400 px-6 text-sm font-bold text-[#062116] shadow-[0_5px_25px_rgba(16,185,129,0.15)] transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-300 hover:shadow-[0_8px_35px_rgba(16,185,129,0.25)] active:translate-y-0 active:scale-[0.98] sm:mt-7 sm:h-12"
          >
            <Plus size={18} strokeWidth={2.5} />
            Create your first vote
          </button>

          <p className="relative mt-3 text-[9px] tracking-wide text-zinc-600 sm:mt-5 sm:text-[10px]">
            YOUR VOICE. YOUR CHOICE. YOUR VOTE.
          </p>
        </div>
      </section>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-16px);
          }
        }

        @media (max-height: 700px) and (max-width: 480px) {
          .page-shell {
            padding-top: 8px !important;
            padding-bottom: 8px !important;
          }

          .project-card {
            padding-top: 18px !important;
            padding-bottom: 18px !important;
          }

          .card-icon {
            margin-top: 12px !important;
            width: 54px !important;
            height: 54px !important;
            border-radius: 18px !important;
          }

          .card-icon > svg {
            width: 27px;
            height: 27px;
          }
        }

        @media (max-height: 620px) and (max-width: 480px) {
          .project-card {
            padding-top: 13px !important;
            padding-bottom: 13px !important;
          }

          .card-icon {
            margin-top: 8px !important;
            width: 46px !important;
            height: 46px !important;
          }

          .project-card h2 {
            margin-top: 10px !important;
            font-size: 19px !important;
          }

          .project-card p {
            margin-top: 6px !important;
            line-height: 1.4 !important;
          }

          .project-card button {
            margin-top: 12px !important;
            height: 38px !important;
          }

          .project-card .feature-row {
            margin-top: 10px !important;
            padding-top: 8px !important;
            padding-bottom: 8px !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .page-shell div[class*="animate-"] {
            animation: none !important;
          }
        }
      `}</style>
    </main>
  );
}