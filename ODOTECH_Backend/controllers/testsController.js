const testsService = require('../services/testsService');

/**
 * GET /api/tests
 * Get all tests
 */
async function getAllTests(req, res, next) {
    try {
        const { courseId, status, limit, offset } = req.query;
        const tests = await testsService.getAllTests({
            courseId: courseId ? parseInt(courseId, 10) : null,
            status,
            limit: limit ? parseInt(limit, 10) : 100,
            offset: offset ? parseInt(offset, 10) : 0,
        });
        res.json(tests);
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/tests/:id
 * Get test by ID
 */
async function getTestById(req, res, next) {
    try {
        const { id } = req.params;
        const test = await testsService.getTestById(parseInt(id, 10));
        res.json(test);
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/tests
 * Create new test
 */
async function createTest(req, res, next) {
    try {
        const accountId = req.user?.uid;
        const testData = {
            ...req.body,
            created_by: accountId,
        };
        const test = await testsService.createTest(testData);
        res.status(201).json(test);
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/tests/:id
 * Update test
 */
async function updateTest(req, res, next) {
    try {
        const { id } = req.params;
        const test = await testsService.updateTest(parseInt(id, 10), req.body);
        res.json(test);
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/tests/:id
 * Delete test
 */
async function deleteTest(req, res, next) {
    try {
        const { id } = req.params;
        await testsService.deleteTest(parseInt(id, 10));
        res.status(204).send();
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/tests/:id/submit
 * Submit test result
 */
async function submitTest(req, res, next) {
    try {
        const { id } = req.params;
        const accountId = req.user?.uid;
        if (!accountId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { answers, started_at, enrollment_id } = req.body;
        if (!answers || !started_at) {
            return res.status(400).json({ message: 'Answers and started_at are required' });
        }

        const result = await testsService.submitTestResult(
            parseInt(id, 10),
            accountId,
            answers,
            started_at,
            enrollment_id
        );
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/tests/my-results
 * Get test results for current user
 */
async function getMyResults(req, res, next) {
    try {
        const accountId = req.user?.uid;
        if (!accountId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { testId } = req.query;
        const results = await testsService.getTestResultsByAccount(
            accountId,
            testId ? parseInt(testId, 10) : null
        );
        res.json(results);
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/tests/:id/results
 * Get all results for a test (admin/manager only)
 */
async function getTestResults(req, res, next) {
    try {
        const { id } = req.params;
        const results = await testsService.getTestResultsByTest(parseInt(id, 10));
        res.json(results);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getAllTests,
    getTestById,
    createTest,
    updateTest,
    deleteTest,
    submitTest,
    getMyResults,
    getTestResults,
};
