import axios from "axios";
import Cookies from "js-cookie";
import type {
  AuthResponse, User, Chat, Message,
  UploadedFile, QueryResponse, SystemPrompt
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
  const token = Cookies.get("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      Cookies.remove("token");
      window.location.href = "/auth/login";
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────

export const emailSignup = (data: {
  email: string; password: string; display_name: string;
}) => api.post("/api/v1/auth/email/signup", data).then(r => r.data);

export const emailLogin = (data: {
  email: string; password: string;
}): Promise<AuthResponse> =>
  api.post("/api/v1/auth/email/login", data).then(r => r.data);

export const googleAuth = (google_token: string): Promise<AuthResponse> =>
  api.post("/api/v1/auth/google", { google_token }).then(r => r.data);

export const logout = () =>
  api.post("/api/v1/auth/logout").then(r => r.data);

export const verifyEmail = (token: string) =>
  api.get(`/api/v1/auth/verify/${token}`).then(r => r.data);

export const requestPasswordReset = (email: string) =>
  api.post("/api/v1/auth/password/reset-request", { email }).then(r => r.data);

export const confirmPasswordReset = (token: string, new_password: string) =>
  api.post("/api/v1/auth/password/reset-confirm", { token, new_password }).then(r => r.data);

// ── Files ────────────────────────────────────

export const uploadFile = (
  file: File,
  onProgress?: (pct: number) => void
): Promise<{ file_id: string; filename: string; chunks_stored: number }> => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/api/v1/files/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total));
      }
    },
  }).then(r => r.data);
};

export const getUploadStatus = (file_id: string) =>
  api.get(`/api/v1/files/status/${file_id}`).then(r => r.data);

export const listFiles = (): Promise<{ files: UploadedFile[] }> =>
  api.get("/api/v1/files/").then(r => r.data);

export const deleteFile = (file_id: string) =>
  api.delete(`/api/v1/files/${file_id}`).then(r => r.data);

// ── Query ────────────────────────────────────

export const queryRAG = (
  question: string,
  top_k = 10
): Promise<QueryResponse> =>
  api.post("/api/v1/query/", { question, top_k }).then(r => r.data);

export const getQueryHistory = (): Promise<{ history: Message[] }> =>
  api.get("/api/v1/query/history").then(r => r.data);

// ── Prompts ──────────────────────────────────

export const listPrompts = (): Promise<{ prompts: SystemPrompt[] }> =>
  api.get("/api/v1/prompts/").then(r => r.data);

export const createPrompt = (name: string, prompt: string) =>
  api.post("/api/v1/prompts/", { name, prompt }).then(r => r.data);

export const activatePrompt = (prompt_id: string) =>
  api.patch(`/api/v1/prompts/${prompt_id}/activate`).then(r => r.data);

export const deletePrompt = (prompt_id: string) =>
  api.delete(`/api/v1/prompts/${prompt_id}`).then(r => r.data);
