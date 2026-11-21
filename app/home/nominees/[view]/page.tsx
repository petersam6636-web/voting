
import type { Metadata } from "next";
import BiewPage from "./Biew";
export const metadata: Metadata = {
  title: "Nominee Details | VoteSphere",
  description:
    "View nominee information, voting results, and comments on VoteSphere.",
};

type PageProps = {
  params: Promise<{
    view: string;
  }>;
};

export default async function NomineePage({ params }: PageProps) {
  const { view } = await params;

  return <BiewPage nomineeId={view} />;
}
