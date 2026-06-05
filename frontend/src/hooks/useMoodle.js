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

export function useMyCourses() {
  return useAsyncData(api.fetchMyCourses);
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
  return useAsyncData(api.fetchRecentCourses);
}

export function useNotifications() {
  return useAsyncData(api.fetchNotifications);
}
