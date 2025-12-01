export interface User {
  id: string;
  email: string;
  role: 'admin' | 'parent' | 'student';
  name: string;
  linkedStudentEmail?: string; // For parents
}

export interface Subject {
  id: string;
  name: string;
  description: string;
  chapters: Chapter[];
}

export interface Chapter {
  id: string;
  title: string;
  subjectId: string;
  pdfUrl: string;
  uploadedAt: string;
}

export interface Doubt {
  id: string;
  studentId: string;
  chapterId: string;
  question: string;
  answer: string;
  timestamp: string;
  resolved: boolean;
}

export interface StudentProgress {
  studentId: string;
  studentName: string;
  subjectProgress: {
    subjectId: string;
    subjectName: string;
    completionPercentage: number;
    chaptersCompleted: number;
    totalChapters: number;
  }[];
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: 'student' | 'parent';
  linkedStudentEmail?: string;
}