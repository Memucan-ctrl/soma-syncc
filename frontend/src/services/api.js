/**
 * SomaSync — API Service Layer
 * Centralized fetch functions for all backend endpoints.
 */

// Dynamically use /api in dev (proxied to port 8000) or /_/backend/api in production (routed by Vercel)
const API_BASE = import.meta.env.DEV ? "/api" : "/_/backend/api";

async function apiFetch(endpoint, options = {}) {
  try {
    const token = localStorage.getItem("somasync_token");
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      // Token is invalid/expired
      localStorage.removeItem("somasync_token");
      localStorage.removeItem("somasync_profile");
      // Trigger a page reload to force redirect to login
      window.location.reload();
      throw new Error("Session expired. Please log in again.");
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail?.error || err.detail?.message || `API error ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error(`[SomaSync API] ${endpoint}:`, error);
    throw error;
  }
}

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail?.error || "Invalid username or password");
  }

  return await res.json();
}

export async function fetchProfile() {
  return apiFetch("/moodle/profile");
}

export async function fetchMyCourses() {
  return apiFetch("/moodle/my-courses");
}

export async function fetchAssignments(courseIds = "") {
  const params = courseIds ? `?course_ids=${courseIds}` : "";
  return apiFetch(`/moodle/assignments${params}`);
}

export async function fetchUpcomingEvents() {
  return apiFetch("/moodle/upcoming");
}

export async function fetchGrades() {
  return apiFetch("/moodle/grades");
}

export async function fetchCourseContents(courseId) {
  return apiFetch(`/moodle/course/${courseId}/contents`);
}

export async function fetchRecentCourses() {
  return apiFetch("/moodle/recent-courses");
}

export async function fetchNotifications() {
  return apiFetch("/moodle/notifications");
}

export async function fetchHealthCheck() {
  return apiFetch("/../health");
}

export async function sendConsultationQuery(message, courseCode = "", context = "") {
  return apiFetch("/ai/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, course_code: courseCode, context }),
  });
}
