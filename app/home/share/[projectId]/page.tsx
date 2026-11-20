
import type { Metadata } from "next";
import { supabase } from "@/lib/supabase-client";
import QRPage from "./QRPage";

type SharePageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function generateMetadata({
  params,
}: SharePageProps): Promise<Metadata> {
  const { projectId } = await params;

  const { data: project } = await supabase
    .from("projects")
    .select("name")
    .eq("id", projectId)
    .eq("deleted", false)
    .single();

  return {
    title: project?.name || "VoteSphere",
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { projectId } = await params;

  return <QRPage projectId={projectId} />;
}
