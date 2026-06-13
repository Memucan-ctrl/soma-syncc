/**
 * SomaSync — Moodle Data Hooks (v2 — SWR Cached)
 * React hooks with stale-while-revalidate caching for instant tab switching.
 */

import { useState, useEffect, useCallback } from "react";
import * as api from "../services/api";
import { useCachedData } from "./useDataCache";



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

export function useProfile() {
  return useCachedData("profile", api.fetchProfile, { ttl: 10 * 60 * 1000 }); // 10 min
}

export function useMyCourses() {
  const result = useCachedData("my-courses", api.fetchMyCourses, { ttl: 5 * 60 * 1000 });
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
  return useCachedData("upcoming-events", api.fetchUpcomingEvents, { ttl: 3 * 60 * 1000 }); // 3 min
}

export function useGrades() {
  return useCachedData("grades", api.fetchGrades, { ttl: 10 * 60 * 1000 });
}

export function useAssignments(courseIds = "") {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.fetchAssignments(courseIds);
      setData(result);
    } catch (err) {
      setError(err.message || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, [courseIds]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

export function useRecentCourses() {
  const result = useCachedData("recent-courses", api.fetchRecentCourses, { ttl: 5 * 60 * 1000 });
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
  return useCachedData("notifications", api.fetchNotifications, { ttl: 2 * 60 * 1000 }); // 2 min
}
