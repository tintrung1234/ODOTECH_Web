const notificationsRepository = require("../repositories/notificationsRepository");

function toNullableInt(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

async function notifyUser({ userId, type, title, message, data = {} }) {
  const uid = toNullableInt(userId);
  if (!uid) return null;
  return notificationsRepository.createNotification({ userId: uid, type, title, message, data });
}

async function notifyUsers({ userIds, type, title, message, data = {} }) {
  const ids = Array.from(
    new Set((Array.isArray(userIds) ? userIds : []).map((x) => toNullableInt(x)).filter(Boolean))
  );
  if (ids.length === 0) return [];
  return notificationsRepository.createNotificationsForUsers({ userIds: ids, type, title, message, data });
}

async function notifyCompany({ type = "system", title, message, data = {}, excludeRoleSystems, includeRoleSystems }) {
  return notificationsRepository.createNotificationsForCompany({
    type,
    title,
    message,
    data,
    excludeRoleSystems,
    includeRoleSystems,
  });
}

async function notifyRoles({ roleSystems, type = "system", title, message, data = {}, onlyActive = true }) {
  return notificationsRepository.createNotificationsForRoles({ roleSystems, type, title, message, data, onlyActive });
}

async function hasSentTaskReminderToday({ userId, taskId, kind = "task_due" }) {
  return notificationsRepository.hasNotificationForUserToday({
    userId,
    type: "task_reminder",
    dataKind: kind,
    dataTaskId: taskId,
  });
}

/**
 * Notification service for multi-channel alerts
 * Currently supports console logging and database persistence
 * TODO: Implement email and Telegram notifications
 */

/**
 * Helper to ensure we have a valid user ID for the notification
 * @param {Object} assignment
 * @returns {number|null}
 */
function getTargetUserId(assignment) {
  if (!assignment) return null;
  // Prefer tech_user_id or try to parse from assigned_dev_name if needed, 
  // but ideally the caller should provide the target ID.
  // For now, we assume the caller passes objects that have user IDs or we might need to look them up.
  // Since this is a service, we'll ask for explicit user IDs in the future, 
  // but to support existing calls, we might need adjustments.

  // However, looking at the usage commands:
  // sendSecurityAlert(virusLog, assignment)
  // We need to know WHO receives the alert. 
  // Assignment likely has `tech_user_id` or similar.
  return assignment.tech_user_id || assignment.user_id;
}

/**
 * Send security alert notification
 */
async function sendSecurityAlert(virusLog, assignment) {
  const message = `
🚨 SECURITY ALERT 🚨
Website: ${virusLog.website_name}
Threat: ${virusLog.threat_type} (${virusLog.severity})
Assigned to: ${assignment.assigned_dev_name}
Detected at: ${virusLog.detected_at}
Description: ${virusLog.threat_description}
  `.trim();

  console.log(message);

  // Persist to DB
  const userId = getTargetUserId(assignment);
  if (userId) {
    await notificationsRepository.createNotification({
      userId,
      type: 'security_alert',
      title: `Security Alert: ${virusLog.website_name}`,
      message: `Threat: ${virusLog.threat_type} detected.`,
      data: { virus_log_id: virusLog.id, website_id: virusLog.website_id }
    });
  }

  // TODO: Send email notification
  // TODO: Send Telegram notification
  // TODO: Send in-app notification (handled via DB poll/socket)

  return { success: true, message: "Security alert sent" };
}

/**
 * Send delegation request notification
 */
async function sendDelegationRequest(assignment, toDevName, toDevId) {
  const message = `
📋 DELEGATION REQUEST
Assignment #${assignment.id} has been delegated to you
From: ${assignment.assigned_dev_name}
To: ${toDevName}
Virus Log: #${assignment.virus_log_id}
Please accept or decline within 15 minutes
  `.trim();

  console.log(message);

  if (toDevId) {
    await notificationsRepository.createNotification({
      userId: toDevId,
      type: 'delegation',
      title: 'Delegation Request',
      message: `Assignment #${assignment.id} from ${assignment.assigned_dev_name}`,
      data: { assignment_id: assignment.id, virus_log_id: assignment.virus_log_id }
    });
  }

  // TODO: Send email notification
  // TODO: Send Telegram notification

  return { success: true, message: "Delegation request sent" };
}

/**
 * Send password access alert
 */
async function sendPasswordAccessAlert(accessLog) {
  const message = `
🔐 PASSWORD ACCESS ALERT
User: ${accessLog.user_name}
Website: ${accessLog.website_name}
Credential Type: ${accessLog.credential_type}
Time: ${accessLog.accessed_at}
IP: ${accessLog.ip_address}
  `.trim();

  console.log(message);

  // TODO: Determine who gets this alert (Admins? Managers?). 
  // For now we just log it as the TODOs imply logic is missing.
  // If we had an admin ID list, we would loop and create notifications.

  // TODO: Send email notification to managers
  // TODO: Send Telegram notification

  return { success: true, message: "Password access alert sent" };
}

/**
 * Send storage alert notification
 */
async function sendStorageAlert(website) {
  const message = `
💾 STORAGE ALERT
Website: ${website.name}
Storage: ${website.storage_used}MB / ${website.storage_limit}MB (${website.storage_percentage}%)
Threshold: ${website.storage_alert_threshold}%
Action required: Please free up space or increase storage limit
  `.trim();

  console.log(message);

  // Who gets storage alerts? Website owner? Admins?
  // Assuming website.user_id exists
  if (website.user_id) {
    await notificationsRepository.createNotification({
      userId: website.user_id,
      type: 'system',
      title: `Storage Alert: ${website.name}`,
      message: `Storage usage at ${website.storage_percentage}%`,
      data: { website_id: website.id }
    });
  }

  // TODO: Send email notification to managers
  // TODO: Send Telegram notification

  return { success: true, message: "Storage alert sent" };
}

/**
 * Send delegation expired notification
 */
async function sendDelegationExpired(assignment, newAssignment) {
  const message = `
⏰ DELEGATION EXPIRED
Assignment #${assignment.id} delegation has expired
Reassigned to: ${newAssignment.assigned_dev_name}
Virus Log: #${assignment.virus_log_id}
  `.trim();

  console.log(message);

  // Notify the original assignee or the new one?
  // Let's notify the new assignee.
  const newDevId = getTargetUserId(newAssignment);
  if (newDevId) {
    await notificationsRepository.createNotification({
      userId: newDevId,
      type: 'assignment',
      title: 'Delegation Expired - Reassigned',
      message: `Assignment #${assignment.id} is now yours.`,
      data: { assignment_id: assignment.id }
    });
  }

  // TODO: Send email notification
  // TODO: Send Telegram notification

  return { success: true, message: "Delegation expired notification sent" };
}

// Pass-through methods for Controller to use
async function listNotifications(params) {
  return notificationsRepository.listNotifications(params);
}

async function markAsRead(id, userId) {
  return notificationsRepository.markAsRead(id, userId);
}

async function markAllAsRead(userId) {
  return notificationsRepository.markAllAsRead(userId);
}

async function countUnread(userId) {
  return notificationsRepository.countUnread(userId);
}

module.exports = {
  toNullableInt,
  notifyUser,
  notifyUsers,
  notifyCompany,
  notifyRoles,
  hasSentTaskReminderToday,
  sendSecurityAlert,
  sendDelegationRequest,
  sendPasswordAccessAlert,
  sendStorageAlert,
  sendDelegationExpired,
  listNotifications,
  markAsRead,
  markAllAsRead,
  countUnread
};
