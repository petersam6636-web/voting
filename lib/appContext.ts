"use client";

import {
  createContext,
  type Dispatch,
  type SetStateAction,
} from "react";

import type {
  Project,
  ProjectDetail,
} from "@/types/project";

export type AppContextType = {
  userInfo: string;
  setUserInfo: Dispatch<SetStateAction<string>>;

  project: Project[] | null;
  setProject: Dispatch<SetStateAction<Project[] | null>>;

  taskKey: boolean | null;
  setTaskKey: Dispatch<SetStateAction<boolean | null>>;

  projectDetails: ProjectDetail | null;
  setProjectDetails: Dispatch<SetStateAction<ProjectDetail | null>>;

  currentProject: Project | null;
  setCurrentProject: Dispatch<SetStateAction<Project | null>>;

  linkingId: string;
  setLinkingId: Dispatch<SetStateAction<string>>;
};

export const appContext = createContext<AppContextType | undefined>(
  undefined
);