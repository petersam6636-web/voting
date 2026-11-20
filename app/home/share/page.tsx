
import { Share2, QrCode, Link2, ShieldCheck, Users } from "lucide-react";

export default function SharePage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="mb-2 text-xs font-medium tracking-wider text-emerald-400">VOTER ACCESS</p>
        <h1 className="text-2xl font-bold">Share<span className="text-emerald-400">.</span></h1>
        <p className="mt-1 text-sm text-zinc-500">Invite voters and manage access to your elections.</p>
      </header>

      <section className="relative overflow-hidden rounded-3xl border border-emerald-400/15 bg-gradient-to-br from-[#103323] to-[#0b120e] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-400/[0.09] blur-[80px]" />
        <div className="relative max-w-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-300">
            <Share2 size={23} />
          </div>
          <h2 className="mt-5 text-xl font-bold">Make participation easy.</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Share election invitations and provide voters with secure access to the right election.
          </p>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.07] bg-[#0d1310] p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400">
            <Link2 size={19} />
          </div>
          <h3 className="mt-4 text-sm font-semibold">Election links</h3>
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            Generate and manage shareable links for your elections.
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-[#0d1310] p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-400">
            <QrCode size={19} />
          </div>
          <h3 className="mt-4 text-sm font-semibold">QR access</h3>
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            Create election-specific QR access credentials for eligible voters.
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-white/[0.07] bg-[#0d1310] p-5">
        <div className="flex items-center gap-3">
          <ShieldCheck size={20} className="text-emerald-400" />
          <div>
            <h3 className="text-sm font-semibold">Secure voter access</h3>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              QR scanning will verify access, not automatically cast a vote. Voters must deliberately select and confirm their choice.
            </p>
          </div>
        </div>
        <div className="mt-5 flex min-h-24 items-center justify-center rounded-xl border border-dashed border-white/10 text-center">
          <p className="text-xs text-zinc-600">Your election invitations will appear here.</p>
        </div>
      </section>
    </div>
  );
}