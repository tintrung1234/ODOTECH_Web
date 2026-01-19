const { pool } = require('../config/postgres');
const { mapDbTest } = require('../models/test');

/**
 * Get all tests with optional filters
 */
async function getAllTests({ courseId, status, limit = 100, offset = 0 }) {
  let query = 'SELECT * FROM tests WHERE 1=1';
  const params = [];
  let paramIndex = 1;

  if (courseId) {
    query += ` AND course_id = $${paramIndex++}`;
    params.push(courseId);
  }
  if (status) {
    query += ` AND status = $${paramIndex++}`;
    params.push(status);
  }

  query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);
  return result.rows.map(mapDbTest);
}

/**
 * Get test by ID
 */
async function getTestById(id) {
  const result = await pool.query('SELECT * FROM tests WHERE id = $1', [id]);
  return mapDbTest(result.rows[0]);
}

/**
 * Create new test
 */
async function createTest(testData) {
  const query = `
    INSERT INTO tests (
      course_id, title, description, questions, 
      duration_minutes, passing_score, max_attempts, status, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;
  const params = [
    testData.course_id || null,
    testData.title,
    testData.description || null,
    JSON.stringify(testData.questions || []),
    testData.duration_minutes || 30,
    testData.passing_score || 70,
    testData.max_attempts || 3,
    testData.status || 'draft',
    testData.created_by || null,
  ];

  const result = await pool.query(query, params);
  return mapDbTest(result.rows[0]);
}

/**
 * Update test
 */
async function updateTest(id, testData) {
  const query = `
    UPDATE tests SET
      course_id = $1,
      title = $2,
      description = $3,
      questions = $4,
      duration_minutes = $5,
      passing_score = $6,
      max_attempts = $7,
      status = $8,
      updated_at = NOW()
    WHERE id = $9
    RETURNING *
  `;
  const params = [
    testData.course_id,
    testData.title,
    testData.description,
    JSON.stringify(testData.questions),
    testData.duration_minutes,
    testData.passing_score,
    testData.max_attempts,
    testData.status,
    id,
  ];

  const result = await pool.query(query, params);
  return mapDbTest(result.rows[0]);
}

/**
 * Delete test
 */
async function deleteTest(id) {
  await pool.query('DELETE FROM tests WHERE id = $1', [id]);
}

/**
 * Submit test result
 */
async function submitTestResult(resultData) {
  const query = `
    INSERT INTO test_results (
      test_id, account_id, enrollment_id, answers, 
      score, passed, attempt_number, started_at, submitted_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    RETURNING *
  `;
  const params = [
    resultData.test_id,
    resultData.account_id,
    resultData.enrollment_id || null,
    JSON.stringify(resultData.answers || {}),
    resultData.score,
    resultData.passed,
    resultData.attempt_number,
    resultData.started_at,
  ];

  const result = await pool.query(query, params);
  return result.rows[0];
}

/**
 * Get test results for an account
 */
async function getTestResultsByAccount(accountId, testId = null) {
  let query = `
    SELECT tr.*, t.title as test_title, t.passing_score
    FROM test_results tr
    JOIN tests t ON tr.test_id = t.id
    WHERE tr.account_id = $1
  `;
  const params = [accountId];

  if (testId) {
    query += ' AND tr.test_id = $2';
    params.push(testId);
  }

  query += ' ORDER BY tr.created_at DESC';

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Get test results for a test
 */
async function getTestResultsByTest(testId) {
  const query = `
    SELECT tr.*, a.name as account_name, a.email as account_email
    FROM test_results tr
    JOIN accounts a ON tr.account_id = a.id
    WHERE tr.test_id = $1
    ORDER BY tr.created_at DESC
  `;
  const result = await pool.query(query, [testId]);
  return result.rows;
}

/**
 * Get attempt count for a test and account
 */
async function getAttemptCount(testId, accountId) {
  const query = `
    SELECT COUNT(*) as count
    FROM test_results
    WHERE test_id = $1 AND account_id = $2
  `;
  const result = await pool.query(query, [testId, accountId]);
  return parseInt(result.rows[0].count, 10);
}

module.exports = {
  getAllTests,
  getTestById,
  createTest,
  updateTest,
  deleteTest,
  submitTestResult,
  getTestResultsByAccount,
  getTestResultsByTest,
  getAttemptCount,
};
