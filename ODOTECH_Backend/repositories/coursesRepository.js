const { pool } = require('../config/postgres');
const { mapDbCourse } = require('../models/course');

/**
 * Get all courses with optional filters
 */
async function getAllCourses({ status, category, level, limit = 100, offset = 0 }) {
  let query = 'SELECT * FROM courses WHERE 1=1';
  const params = [];
  let paramIndex = 1;

  if (status) {
    query += ` AND status = $${paramIndex++}`;
    params.push(status);
  }
  if (category) {
    query += ` AND category = $${paramIndex++}`;
    params.push(category);
  }
  if (level) {
    query += ` AND level = $${paramIndex++}`;
    params.push(level);
  }

  query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);
  return result.rows.map(mapDbCourse);
}

/**
 * Get course by ID
 */
async function getCourseById(id) {
  const result = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);
  return mapDbCourse(result.rows[0]);
}

/**
 * Create new course
 */
async function createCourse(courseData) {
  const query = `
    INSERT INTO courses (
      title, description, instructor_id, category, level, 
      duration_hours, thumbnail_url, content, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;
  const params = [
    courseData.title,
    courseData.description || null,
    courseData.instructor_id || null,
    courseData.category || 'general',
    courseData.level || 'beginner',
    courseData.duration_hours || 0,
    courseData.thumbnail_url || null,
    courseData.content || null,
    courseData.status || 'draft',
  ];

  const result = await pool.query(query, params);
  return mapDbCourse(result.rows[0]);
}

/**
 * Update course
 */
async function updateCourse(id, courseData) {
  const query = `
    UPDATE courses SET
      title = $1,
      description = $2,
      instructor_id = $3,
      category = $4,
      level = $5,
      duration_hours = $6,
      thumbnail_url = $7,
      content = $8,
      status = $9,
      updated_at = NOW()
    WHERE id = $10
    RETURNING *
  `;
  const params = [
    courseData.title,
    courseData.description,
    courseData.instructor_id,
    courseData.category,
    courseData.level,
    courseData.duration_hours,
    courseData.thumbnail_url,
    courseData.content,
    courseData.status,
    id,
  ];

  const result = await pool.query(query, params);
  return mapDbCourse(result.rows[0]);
}

/**
 * Delete course
 */
async function deleteCourse(id) {
  await pool.query('DELETE FROM courses WHERE id = $1', [id]);
}

/**
 * Get enrollments for a course
 */
async function getEnrollmentsByCourse(courseId) {
  const query = `
    SELECT ce.*, a.name as account_name, a.email as account_email
    FROM course_enrollments ce
    JOIN accounts a ON ce.account_id = a.id
    WHERE ce.course_id = $1
    ORDER BY ce.enrolled_at DESC
  `;
  const result = await pool.query(query, [courseId]);
  return result.rows;
}

/**
 * Get enrollments for an account
 */
async function getEnrollmentsByAccount(accountId) {
  const query = `
    SELECT ce.*, c.title as course_title, c.category, c.level
    FROM course_enrollments ce
    JOIN courses c ON ce.course_id = c.id
    WHERE ce.account_id = $1
    ORDER BY ce.enrolled_at DESC
  `;
  const result = await pool.query(query, [accountId]);
  return result.rows;
}

/**
 * Enroll account in course
 */
async function enrollAccount(courseId, accountId) {
  const query = `
    INSERT INTO course_enrollments (course_id, account_id, status)
    VALUES ($1, $2, 'enrolled')
    ON CONFLICT (course_id, account_id) 
    DO UPDATE SET status = 'enrolled', updated_at = NOW()
    RETURNING *
  `;
  const result = await pool.query(query, [courseId, accountId]);
  return result.rows[0];
}

/**
 * Update enrollment progress
 */
async function updateProgress(enrollmentId, progress, status) {
  const query = `
    UPDATE course_enrollments SET
      progress = $1,
      status = $2,
      completed_at = CASE WHEN $1 >= 100 THEN NOW() ELSE completed_at END,
      updated_at = NOW()
    WHERE id = $3
    RETURNING *
  `;
  const result = await pool.query(query, [progress, status, enrollmentId]);
  return result.rows[0];
}

/**
 * Get enrollment by course and account
 */
async function getEnrollment(courseId, accountId) {
  const query = `
    SELECT * FROM course_enrollments
    WHERE course_id = $1 AND account_id = $2
  `;
  const result = await pool.query(query, [courseId, accountId]);
  return result.rows[0];
}

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getEnrollmentsByCourse,
  getEnrollmentsByAccount,
  enrollAccount,
  updateProgress,
  getEnrollment,
};
