export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
    });
  } catch {
    throw new Error("The local Nivaran service is not running. Start the API and try again.");
  }
  const payload = await response.json().catch(() => ({ detail: "The service returned an unreadable response." }));
  if (!response.ok) throw new Error(payload.detail ?? payload.message ?? "Request failed");
  return payload as T;
}

export type Complaint = {
  id: string; reference_number: string; title?: string; original_text: string; safe_text: string; normalized_text?: string;
  language: string; source_channel: string; status: string; category?: string; category_confidence?: number;
  priority: string; priority_confidence?: number; location_text: string; ward?: string; ai_state: string;
  priority_reviewed: boolean; routing_approved: boolean;
  ai_explanation?: string; pii_detected: string[]; version: number; created_at: string; updated_at: string;
};
