
export type ProjectDetail = {
  name: string;
  description: string | null;
  duration_ms: number;
};

export type Project = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  duration_ms: number;
  deleted: boolean;
  nominees?: Nominee[];
};

export type ProjectForm = ProjectDetail;

export type Achievement = {
  id: string;
  nominee_id: string;
  project: string;
  created_at: string;
};

export type AchievementForm = {
  project: string;
};

export type Voter = {
  id: string;
  nominee_id: string;
  name: string | null;
  comment: string | null;
  user_id: string;
};

export type Nominee = {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  manifesto: string;
  image: string | null;
  created_at: string;
  achievements?: Achievement[];
  voters?: Voter[];
};

export type NomineeForm = {
  name: string;
  manifesto: string;
  image: File | null;
  achievements: AchievementForm[];
};

export type RegistrationState = {
  project: Project | null;
  nominees: NomineeForm[];
};
