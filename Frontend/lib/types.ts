export interface User {
  id:           string;
  email:        string;
  display_name: string | null;
  avatar_url:   string | null;
  is_verified:  boolean;
  created_at:   string;
}

export interface AuthResponse {
  token: string;
  user:  User;
}

export interface Chat {
  id:          string;
  name:        string;
  file_id:     string;
  filename:    string;
  file_type:   string;
  created_at:  string;
  last_message?: string;
}

export interface Message {
  id:         string;
  role:       "user" | "assistant";
  content:    string;
  created_at: string;
  was_cached?: boolean;
}

export interface UploadedFile {
  file_id:       string;
  filename:      string;
  file_type:     string;
  file_size:     number;
  chunks_stored: number;
  status:        "processing" | "completed" | "failed";
  uploaded_at:   string;
}

export interface SystemPrompt {
  id:        string;
  name:      string;
  prompt:    string;
  is_active: boolean;
}

export interface QueryResponse {
  answer:        string;
  source:        "cache" | "rag";
  response_time?: number;
}

export interface UploadResponse {
  file_id:       string;
  filename:      string;
  chunks_stored: number;
  status:        string;
}
