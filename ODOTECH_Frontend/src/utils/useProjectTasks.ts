import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { ProjectTask } from '../interface/type';

import { readErrorMessage } from './projectsTableHelpers.ts';

type TasksByProjectId = Record<number, ProjectTask[]>;

type LoadingByProjectId = Record<number, boolean>;

type DraftByProjectId = Record<number, ProjectTask>;

type UseProjectTasksArgs = {
  apiBaseUrl: string;
};

export function useProjectTasks({ apiBaseUrl }: UseProjectTasksArgs) {
  const [tasksByProjectId, setTasksByProjectId] = useState<TasksByProjectId>({});
  const [taskLoadingByProjectId, setTaskLoadingByProjectId] = useState<LoadingByProjectId>({});
  const pendingTaskSaveTimersRef = useRef<Map<string, number>>(new Map());

  const emptyDraftTask = useMemo<ProjectTask>(
    () => ({
      id: 0,
      tieuDe: '',
      nguoiPhuTrach: null,
      nguoiChinh: null,
      nguoiHoTro: null,
      batDau: '',
      hanChot: '',
      trangThai: 'Chưa làm',
      tienDo: 0,
      gioCong: 0,
      mucUuTien: 'medium',
      ghiChu: '',
    }),
    []
  );

  const [draftTaskByProjectId, setDraftTaskByProjectId] = useState<DraftByProjectId>({});

  const getDraftTask = useCallback(
    (projectId: number) => draftTaskByProjectId[projectId] ?? emptyDraftTask,
    [draftTaskByProjectId, emptyDraftTask]
  );

  const setDraftTask = useCallback(
    (projectId: number, patch: Partial<ProjectTask>) => {
      setDraftTaskByProjectId((prev) => ({
        ...prev,
        [projectId]: { ...(prev[projectId] ?? emptyDraftTask), ...patch },
      }));
    },
    [emptyDraftTask]
  );

  const loadTasks = useCallback(
    async (projectId: number) => {
      setTaskLoadingByProjectId((prev) => ({ ...prev, [projectId]: true }));
      try {
        const res = await fetch(`${apiBaseUrl}/api/projects/${projectId}/tasks`, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error(await readErrorMessage(res));
        const json = (await res.json()) as { items?: ProjectTask[] } | ProjectTask[];
        const items = Array.isArray(json) ? json : (json.items ?? []);
        setTasksByProjectId((prev) => ({ ...prev, [projectId]: items }));
      } catch (err) {
        console.error('Failed to load tasks', err);
      } finally {
        setTaskLoadingByProjectId((prev) => ({ ...prev, [projectId]: false }));
      }
    },
    [apiBaseUrl]
  );

  const addTask = useCallback(
    (projectId: number) => {
      const draft = getDraftTask(projectId);
      const title = draft.tieuDe.trim();
      if (!title) return;

      (async () => {
        try {
          const res = await fetch(`${apiBaseUrl}/api/projects/${projectId}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              tieuDe: title,
              nguoiPhuTrach: draft.nguoiPhuTrach,
              nguoiChinh: draft.nguoiChinh ?? null,
              nguoiHoTro: draft.nguoiHoTro ?? null,
              batDau: draft.batDau ?? '',
              hanChot: draft.hanChot,
              trangThai: draft.trangThai,
              tienDo: Number(draft.tienDo ?? 0),
              gioCong: Number(draft.gioCong ?? 0),
              mucUuTien: draft.mucUuTien ?? '',
              ghiChu: draft.ghiChu?.trim() || '',
            }),
          });
          if (!res.ok) throw new Error(await readErrorMessage(res));
          const created = (await res.json()) as ProjectTask;
          setTasksByProjectId((prev) => {
            const existing = prev[projectId] ?? [];
            return { ...prev, [projectId]: [created, ...existing] };
          });

          setDraftTaskByProjectId((prev) => ({
            ...prev,
            [projectId]: emptyDraftTask,
          }));
        } catch (err) {
          console.error('Failed to add task', err);
        }
      })();
    },
    [apiBaseUrl, emptyDraftTask, getDraftTask]
  );

  const updateTask = useCallback(
    (projectId: number, taskId: number, patch: Partial<ProjectTask>) => {
      setTasksByProjectId((prev) => {
        const existing = prev[projectId] ?? [];
        return {
          ...prev,
          [projectId]: existing.map((t) => (t.id === taskId ? { ...t, ...patch } : t)),
        };
      });

      const key = `${projectId}:${taskId}`;
      const existingTimer = pendingTaskSaveTimersRef.current.get(key);
      if (existingTimer) window.clearTimeout(existingTimer);

      const timer = window.setTimeout(() => {
        (async () => {
          try {
            const res = await fetch(`${apiBaseUrl}/api/projects/${projectId}/tasks/${taskId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(patch),
            });
            if (!res.ok) throw new Error(await readErrorMessage(res));
            const updated = (await res.json()) as ProjectTask;
            setTasksByProjectId((prev) => {
              const list = prev[projectId] ?? [];
              return {
                ...prev,
                [projectId]: list.map((t) => (t.id === taskId ? { ...t, ...updated } : t)),
              };
            });
          } catch (err) {
            console.error('Failed to update task', err);
          }
        })();
      }, 3000);

      pendingTaskSaveTimersRef.current.set(key, timer);
    },
    [apiBaseUrl]
  );

  const deleteTask = useCallback(
    (projectId: number, taskId: number) => {
      (async () => {
        try {
          const res = await fetch(`${apiBaseUrl}/api/projects/${projectId}/tasks/${taskId}`, {
            method: 'DELETE',
            credentials: 'include',
          });
          if (!res.ok) throw new Error(await readErrorMessage(res));
          setTasksByProjectId((prev) => {
            const existing = prev[projectId] ?? [];
            return { ...prev, [projectId]: existing.filter((t) => t.id !== taskId) };
          });
        } catch (err) {
          console.error('Failed to delete task', err);
        }
      })();
    },
    [apiBaseUrl]
  );

  useEffect(() => {
    const timers = pendingTaskSaveTimersRef.current;
    return () => {
      for (const timer of timers.values()) {
        window.clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  return {
    tasksByProjectId,
    taskLoadingByProjectId,
    loadTasks,
    addTask,
    updateTask,
    deleteTask,
    getDraftTask,
    setDraftTask,
  };
}
