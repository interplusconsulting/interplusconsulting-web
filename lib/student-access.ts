'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useAuth } from './auth';
import { supabase } from './supabase';
import type { CatalogExam } from './types';

/* ── View mode for admins inside the student area ─────────────────────────────
   'student' (default): admins see exactly what a member sees — only what they bought.
   'admin': admins keep full access (handy for checking content). Kept per browser tab. */
const MODE_KEY = 'ip-learn-view-mode';
const MODE_EVENT = 'ip-learn-view-mode';
export type LearnViewMode = 'student' | 'admin';

function readMode(): LearnViewMode {
  try { return window.sessionStorage.getItem(MODE_KEY) === 'admin' ? 'admin' : 'student'; } catch { return 'student'; }
}

function subscribe(callback: () => void) {
  window.addEventListener(MODE_EVENT, callback);
  return () => window.removeEventListener(MODE_EVENT, callback);
}

export function setLearnViewMode(mode: LearnViewMode) {
  try { window.sessionStorage.setItem(MODE_KEY, mode); } catch { /* storage unavailable */ }
  window.dispatchEvent(new Event(MODE_EVENT));
}

export function useLearnViewMode(): LearnViewMode {
  return useSyncExternalStore(subscribe, readMode, () => 'student');
}

/**
 * The database gives admins access to everything, so in student mode we recompute access
 * for admins from their own purchases (exam_access) and course enrollments, like any member.
 */
export function useStudentAccess() {
  const { profile } = useAuth();
  const mode = useLearnViewMode();
  const isAdmin = profile?.role === 'admin';
  const simulate = isAdmin && mode === 'student';
  const [state, setState] = useState<{ ready: boolean; exams: Set<string>; courses: Set<string> }>({ ready: false, exams: new Set(), courses: new Set() });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!profile || !isAdmin) return; // members: the database already decides access
    const db = supabase();
    Promise.all([
      db.from('exam_access').select('exam_id').eq('user_id', profile.id),
      db.from('enrollments').select('course_id').eq('user_id', profile.id),
    ]).then(([examRows, courseRows]) => setState({
      ready: true,
      exams: new Set((examRows.data ?? []).map(row => row.exam_id as string)),
      courses: new Set((courseRows.data ?? []).map(row => row.course_id as string)),
    }));
  }, [profile, isAdmin, version]);

  // Free exams must be claimed too, so access comes only from exam_access or the linked course.
  const asStudent = (exam: CatalogExam): CatalogExam => {
    if (!simulate) return exam;
    const access = state.exams.has(exam.id) || (exam.course_id !== null && state.courses.has(exam.course_id));
    return { ...exam, has_access: access, url: access ? exam.url : '' };
  };

  return {
    ready: Boolean(profile) && (!isAdmin || state.ready), simulate, asStudent,
    hasCourse: (courseId: string) => !simulate || state.courses.has(courseId),
    /** Re-read the admin's own purchases/claims after claiming something. */
    refresh: () => setVersion(value => value + 1),
  };
}
