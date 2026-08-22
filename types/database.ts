export type OrgRole = "owner" | "manager" | "member";
export type CycleStatus = "draft" | "open" | "closed";
export type QuestionType = "rating" | "text";

export interface Organization {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export interface OrgMember {
  id: string;
  org_id: string;
  user_id: string;
  role: OrgRole;
  full_name: string;
  created_at: string;
}

export interface ReviewCycle {
  id: string;
  org_id: string;
  title: string;
  is_anonymous: boolean;
  status: CycleStatus;
  opens_at: string | null;
  closes_at: string | null;
  created_by: string;
  created_at: string;
}

export interface CycleQuestion {
  id: string;
  cycle_id: string;
  prompt: string;
  question_type: QuestionType;
  order_index: number;
}

export interface CycleParticipant {
  id: string;
  cycle_id: string;
  subject_user_id: string;
  reviewer_user_id: string;
  submitted: boolean;
  created_at: string;
}

export interface Response {
  id: string;
  participant_id: string;
  question_id: string;
  rating_value: number | null;
  text_value: string | null;
  created_at: string;
}

export interface CycleResponseSummary {
  cycle_id: string;
  subject_user_id: string;
  question_id: string;
  prompt: string;
  question_type: QuestionType;
  avg_rating: number | null;
  rating_count: number;
  text_responses: string[] | null;
}