/**
 * SomaSync — Moodle Data Hooks
 * React hooks for live data fetching with loading/error states.
 */

import { useState, useEffect, useCallback } from "react";
import * as api from "../services/api";

function useAsyncData(fetchFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

export function useProfile() {
  return useAsyncData(api.fetchProfile);
}

function isAcademicCourse(course) {
  const name = course.fullname?.toLowerCase().trim() || "";
  if (
    name === "fa" ||
    name === "faq" ||
    name.includes("survey") ||
    name.includes("contact") ||
    name.includes("rule") ||
    name.includes("regulation") ||
    name.includes("orientation") ||
    name.includes("timetable") ||
    name.includes("passlist") ||
    name.includes("result") ||
    name.includes("conference") ||
    name.includes("support") ||
    name.includes("news") ||
    name.includes("announcements")
  ) {
    return false;
  }
  return true;
}

export function useMyCourses() {
  const result = useAsyncData(api.fetchMyCourses);
  if (result.data && Array.isArray(result.data.courses)) {
    return {
      ...result,
      data: {
        ...result.data,
        courses: result.data.courses.filter(isAcademicCourse)
      }
    };
  }
  return result;
}

export function useUpcomingEvents() {
  return useAsyncData(api.fetchUpcomingEvents);
}

export function useGrades() {
  return useAsyncData(api.fetchGrades);
}

export function useAssignments(courseIds = "") {
  return useAsyncData(() => api.fetchAssignments(courseIds), [courseIds]);
}

export function useRecentCourses() {
  const result = useAsyncData(api.fetchRecentCourses);
  if (result.data && Array.isArray(result.data.courses)) {
    return {
      ...result,
      data: {
        ...result.data,
        courses: result.data.courses.filter(isAcademicCourse)
      }
    };
  }
  return result;
}

export function useNotifications() {
  return useAsyncData(api.fetchNotifications);
}
