export type UserRole = 'curator' | 'user' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  department: string;
  position: string;
  directorate?: string;
  company?: string;
  allowed_categories?: string[];
  allowed_tests?: string[];
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon_name: string;
  topics: string[];
}

export interface Question {
  id?: string;
  type?: 'standard' | 'nps';
  question: string;
  options: string[];
  correctIndex: number;
  skill: string;
  explanation?: string;
}

export interface CustomTest {
  id?: string;
  category: string;
  topic: string;
  questions: Question[];
  allow_file_upload?: boolean;
  allow_text_input?: boolean;
  has_timer?: boolean;
  time_limit?: number; // in seconds
  has_attempts_limit?: boolean;
  attempts_limit?: number;
  include_in_average?: boolean;
  created_at?: string;
  created_by?: string;
}

export interface TestResult {
  id: string;
  user_id: string;
  user_name: string;
  category: string;
  topic: string;
  scores: Record<string, number>;
  user_comment?: string;
  file_url?: string;
  finished_by_timeout?: boolean;
  total_questions?: number;
  answered_questions?: number;
  created_at: string;
}

export interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'alert' | 'confirm';
  onConfirm?: () => void;
}
