
export default function ProjectLoading() {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center bg-[#050b08]"
      role="status"
      aria-label="Loading your project"
    >
      <div className="flex items-center gap-2.5">
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className="loading-dot h-2.5 w-2.5 rounded-full bg-emerald-400"
            style={{ animationDelay: `${dot * 0.18}s` }}
          />
        ))}
      </div>

      <p className="mt-5 text-sm font-medium tracking-wide text-emerald-100/70">
        Loading your project
      </p>

      <style jsx>{`
        .loading-dot {
          animation: bounce 0.8s ease-in-out infinite;
          box-shadow: 0 0 12px rgba(52, 211, 153, 0.35);
        }

        @keyframes bounce {
          0%, 60%, 100% {
            transform: translateY(0) scale(0.85);
            opacity: 0.55;
          }

          30% {
            transform: translateY(-9px) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
