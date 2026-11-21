"use client";

import { useEffect, useState, type ReactNode } from "react";

import { appContext } from "./appContext";

import type {
  Project,
  ProjectDetail,
} from "@/types/project";

export default function ContextFile({
  children,
}: {
  children: ReactNode;
}) {
  const [project, setProject] = useState<Project[] | null>(null);

  const [taskKey, setTaskKey] = useState<boolean | null>(null);

  const [userInfo, setUserInfo] = useState("");

  const [projectDetails, setProjectDetails] =
    useState<ProjectDetail | null>(null);

  const [currentProject, setCurrentProject] =
    useState<Project | null>(null);

  const [linkingId, setLinkingId] = useState<string>("");

  return (
    <appContext.Provider
      value={{
        userInfo,
        setUserInfo,

        project,
        setProject,

        taskKey,
        setTaskKey,

        projectDetails,
        setProjectDetails,

        currentProject,
        setCurrentProject,

        linkingId,
        setLinkingId,
      }}
    >
      {children}
    </appContext.Provider>
  );
}