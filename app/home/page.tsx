"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase-client";
import useApp from "@/lib/useApp";
import { ensureUserTask } from "@/lib/tasks";

import NoProject from "@/components/NoProject";
import ActiveProject from "@/components/ActiveProject";
import FinishedProject from "@/components/FinishedProject";
import ProjectLoading from "@/components/ProjectLoading";

import type { Project } from "@/types/project";

export default function HomePage() {
  const {
    userInfo,
    setUserInfo,
    project,
    setProject,
    taskKey,
    setTaskKey,
  } = useApp();

  const router = useRouter();

  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Verify the authenticated user.
  useEffect(() => {
    let active = true;

    const checkUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error) throw error;

        if (!data.user) {
          router.replace("/");
          return;
        }

        if (!active) return;

        setUserInfo(data.user.id);
        await ensureUserTask(data.user.id);
        setAuthReady(true);
      } catch (err: unknown) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to verify your account."
        );

        setLoading(false);
      }
    };

    void checkUser();

    return () => {
      active = false;
    };
  }, [setUserInfo, router]);

  // Fetch the user's tasks and projects with their nominees and achievements.
  useEffect(() => {
    if (!authReady || !userInfo) return;

    let active = true;

    const loadHomepage = async () => {
      setLoading(true);
      setError("");

      try {
        const [taskResult, projectResult] = await Promise.all([
          supabase
            .from("tasks")
            .select("key")
            .eq("user_id", userInfo)
            .limit(1)
            .maybeSingle(),

          supabase
            .from("projects").
            select(`*, nominees (*, achievements (*), voters (*))`)
            .eq("user_id", userInfo)
            .eq("deleted", false)
            .order("created_at", { ascending: true }),
        ]);

        if (taskResult.error) throw taskResult.error;
        if (projectResult.error) throw projectResult.error;

        if (!active) return;

        setTaskKey(taskResult.data?.key === true);

        setProject((projectResult.data ?? []) as Project[]);
      } catch (err: unknown) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your projects."
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadHomepage();

    return () => {
      active = false;
    };
  }, [authReady, userInfo, setProject, setTaskKey]);

  if (loading || !authReady || taskKey === null) {
    return <ProjectLoading />;
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <p role="alert" className="text-center text-sm text-red-300">
          {error}
        </p>
      </div>
    );
  }

  // No project and voting has not been activated.
  if (taskKey === false && (!project || project.length === 0)) {
    return <NoProject />;
  }

  // Project exists, but voting has not been activated.
  if (taskKey === false && project && project.length > 0) {
    return <FinishedProject />
  }

  // Voting has been activated and projects exist.
  if (taskKey === true && project && project.length > 0) {
    return <ActiveProject  />;
  }

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <p className="text-center text-sm text-amber-300">
        Your election workspace needs attention. Please try again.
      </p>
    </div>
  );
}