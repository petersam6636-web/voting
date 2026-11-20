
import type { Metadata } from "next";
import DetailsPage from "./details";

export const metadata: Metadata = {
  title: "Nominee Details | VoteSphere",
  description:
    "View nominee information, voting results, and comments on VoteSphere.",
};

type PageProps = {
  params: Promise<{
    nomineeId: string;
  }>;
};

export default async function NomineePage({ params }: PageProps) {
  const { nomineeId } = await params;

  return <DetailsPage nomineeId={nomineeId} />;
}
