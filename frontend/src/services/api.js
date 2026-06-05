/**
 * SomaSync — API Service Layer
 * Centralized fetch functions for all backend endpoints.
 */

const API_BASE = "/api";

async function apiFetch(endpoint) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail?.message || `API error ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error(`[SomaSync API] ${endpoint}:`, error);
    throw error;
  }
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
