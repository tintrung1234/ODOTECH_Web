const projectTasksRepository = require("../repositories/projectTasksRepository");
const notificationService = require("./notificationService");

function toInt(value, fallback) {
  const n = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

function uniqueIds(values) {
  return Array.from(
    new Set((Array.isArray(values) ? values : []).map((x) => notificationService.toNullableInt(x)).filter(Boolean))
  );
}

function makeTaskLabel(row) {
  const title = String(row?.tieu_de ?? row?.tieuDe ?? "").trim();
  return title || `#${row?.id ?? ""}`;
}

function formatDateString(value) {
  const s = String(value ?? "").trim();
  if (!s) return "";
  return s.slice(0, 10);
}

function computeReminderKind(hanChot) {
  const due = formatDateString(hanChot);
  if (!due) return null;

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const todayStr = `${yyyy}-${mm}-${dd}`;

  if (due < todayStr) return "task_overdue";
  if (due === todayStr) return "task_due_today";
  return "task_due_soon";
}

function buildMessage({ kind, taskLabel, projectCode, projectName, dueDate }) {
  const projectPart = projectCode || projectName ? ` (${[projectCode, projectName].filter(Boolean).join(" - ")})` : "";

  if (kind === "task_overdue") {
    return `Task ${taskLabel}${projectPart} đã quá hạn (hạn chót: ${dueDate}).`;
  }
  if (kind === "task_due_today") {
    return `Task ${taskLabel}${projectPart} đến hạn hôm nay (hạn chót: ${dueDate}).`;
  }
  return `Task ${taskLabel}${projectPart} sắp đến hạn (hạn chót: ${dueDate}).`;
}

async function sendReminderToUser(userId, payload) {
  const already = await notificationService.hasSentTaskReminderToday({ userId, taskId: payload.taskId, kind: payload.kind });
  if (already) return false;

  await notificationService.notifyUser({
    userId,
    type: "task_reminder",
    title: payload.title,
    message: payload.message,
    data: {
      kind: payload.kind,
      project_id: payload.projectId,
      task_id: payload.taskId,
      due_date: payload.dueDate,
      task_status: payload.taskStatus,
    },
  });

  return true;
}

async function runTaskDueReminderSweep({ dueBeforeDays = 1, overdueDays = 7, limit = 500 } = {}) {
  const rows = await projectTasksRepository.listTasksForDueReminders({ dueBeforeDays, overdueDays, limit });
  let sent = 0;

  for (const row of rows) {
    const kind = computeReminderKind(row.han_chot);
    if (!kind) continue;

    const recipients = uniqueIds([row.nguoi_chinh, row.nguoi_phu_trach, row.nguoi_ho_tro]);
    if (recipients.length === 0) continue;

    const dueDate = formatDateString(row.han_chot);
    const taskLabel = makeTaskLabel(row);
    const projectName = String(row.project_name ?? "").trim();
    const projectCode = String(row.project_code ?? "").trim();

    const title = kind === "task_overdue" ? "Task quá hạn" : kind === "task_due_today" ? "Task đến hạn hôm nay" : "Task sắp đến hạn";
    const message = buildMessage({ kind, taskLabel, projectCode, projectName, dueDate });

    for (const userId of recipients) {
      try {
        const ok = await sendReminderToUser(userId, {
          kind,
          title,
          message,
          projectId: Number(row.project_id),
          taskId: Number(row.id),
          dueDate,
          taskStatus: String(row.trang_thai ?? ""),
        });
        if (ok) sent += 1;
      } catch (e) {
        // swallow per-user to keep sweep going
        console.error("[taskReminder] send failed", { userId, taskId: row.id, error: e?.message || e });
      }
    }
  }

  return { tasks: rows.length, sent };
}

function startTaskReminderJob() {
  const enabledRaw = String(process.env.TASK_REMINDER_ENABLED ?? "true").trim().toLowerCase();
  const enabled = !(enabledRaw === "false" || enabledRaw === "0" || enabledRaw === "no");
  if (!enabled) {
    console.log("[taskReminder] disabled via TASK_REMINDER_ENABLED");
    return null;
  }

  const intervalMs = toInt(process.env.TASK_REMINDER_INTERVAL_MS, 30 * 60 * 1000);
  const dueBeforeDays = toInt(process.env.TASK_REMINDER_DUE_BEFORE_DAYS, 1);
  const overdueDays = toInt(process.env.TASK_REMINDER_OVERDUE_DAYS, 7);
  const limit = toInt(process.env.TASK_REMINDER_LIMIT, 500);

  const safeInterval = Math.max(60_000, intervalMs);

  const runOnce = async () => {
    try {
      const result = await runTaskDueReminderSweep({ dueBeforeDays, overdueDays, limit });
      console.log(`[taskReminder] sweep ok tasks=${result.tasks} sent=${result.sent}`);
    } catch (e) {
      console.error("[taskReminder] sweep failed", e);
    }
  };

  // Run shortly after startup
  setTimeout(runOnce, 10_000);

  const timer = setInterval(runOnce, safeInterval);
  timer.unref?.();
  console.log(`[taskReminder] started interval=${safeInterval}ms dueBeforeDays=${dueBeforeDays} overdueDays=${overdueDays}`);
  return timer;
}

module.exports = {
  runTaskDueReminderSweep,
  startTaskReminderJob,
};
