const testsRepository = require('../repositories/testsRepository');
const { calculateScore } = require('../models/test');

/**
 * Get all tests
 */
async function getAllTests(filters) {
    return await testsRepository.getAllTests(filters);
}

/**
 * Get test by ID
 */
async function getTestById(id) {
    const test = await testsRepository.getTestById(id);
    if (!test) {
        throw new Error('Test not found');
    }
    return test;
}

/**
 * Create test
 */
async function createTest(testData) {
    if (!testData.title) {
        throw new Error('Test title is required');
    }
    if (!testData.questions || testData.questions.length === 0) {
        throw new Error('Test must have at least one question');
    }
    return await testsRepository.createTest(testData);
}

/**
 * Update test
 */
async function updateTest(id, testData) {
    const existing = await testsRepository.getTestById(id);
    if (!existing) {
        throw new Error('Test not found');
    }
    return await testsRepository.updateTest(id, testData);
}

/**
 * Delete test
 */
async function deleteTest(id) {
    const existing = await testsRepository.getTestById(id);
    if (!existing) {
        throw new Error('Test not found');
    }
    await testsRepository.deleteTest(id);
}

/**
 * Submit test result
 */
async function submitTestResult(testId, accountId, answers, startedAt, enrollmentId = null) {
    const test = await testsRepository.getTestById(testId);
    if (!test) {
        throw new Error('Test not found');
    }

    // Check attempt limit
    const attemptCount = await testsRepository.getAttemptCount(testId, accountId);
    if (attemptCount >= test.max_attempts) {
        throw new Error(`Maximum attempts (${test.max_attempts}) reached for this test`);
    }

    // Calculate score
    const scoreResult = calculateScore(test.questions, answers);
    const passed = scoreResult.score >= test.passing_score;

    const resultData = {
        test_id: testId,
        account_id: accountId,
        enrollment_id: enrollmentId,
        answers,
        score: scoreResult.score,
        passed,
        attempt_number: attemptCount + 1,
        started_at: startedAt,
    };

    return await testsRepository.submitTestResult(resultData);
}

/**
 * Get test results for account
 */
async function getTestResultsByAccount(accountId, testId = null) {
    return await testsRepository.getTestResultsByAccount(accountId, testId);
}

/**
 * Get test results for test
 */
async function getTestResultsByTest(testId) {
    return await testsRepository.getTestResultsByTest(testId);
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
};
