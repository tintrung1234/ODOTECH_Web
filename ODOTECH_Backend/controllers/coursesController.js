const coursesService = require('../services/coursesService');

/**
 * GET /api/courses
 * Get all courses
 */
async function getAllCourses(req, res, next) {
    try {
        const { status, category, level, limit, offset } = req.query;
        const courses = await coursesService.getAllCourses({
            status,
            category,
            level,
            limit: limit ? parseInt(limit, 10) : 100,
            offset: offset ? parseInt(offset, 10) : 0,
        });
        res.json(courses);
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/courses/:id
 * Get course by ID
 */
async function getCourseById(req, res, next) {
    try {
        const { id } = req.params;
        const course = await coursesService.getCourseById(parseInt(id, 10));
        res.json(course);
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/courses
 * Create new course
 */
async function createCourse(req, res, next) {
    try {
        const course = await coursesService.createCourse(req.body);
        res.status(201).json(course);
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/courses/:id
 * Update course
 */
async function updateCourse(req, res, next) {
    try {
        const { id } = req.params;
        const course = await coursesService.updateCourse(parseInt(id, 10), req.body);
        res.json(course);
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/courses/:id
 * Delete course
 */
async function deleteCourse(req, res, next) {
    try {
        const { id } = req.params;
        await coursesService.deleteCourse(parseInt(id, 10));
        res.status(204).send();
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/courses/:id/enrollments
 * Get enrollments for course
 */
async function getEnrollmentsByCourse(req, res, next) {
    try {
        const { id } = req.params;
        const enrollments = await coursesService.getEnrollmentsByCourse(parseInt(id, 10));
        res.json(enrollments);
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/courses/my-enrollments
 * Get enrollments for current user
 */
async function getMyEnrollments(req, res, next) {
    try {
        const accountId = req.user?.uid;
        if (!accountId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const enrollments = await coursesService.getEnrollmentsByAccount(accountId);
        res.json(enrollments);
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/courses/:id/enroll
 * Enroll in course
 */
async function enrollInCourse(req, res, next) {
    try {
        const { id } = req.params;
        const accountId = req.user?.uid;
        if (!accountId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const enrollment = await coursesService.enrollAccount(parseInt(id, 10), accountId);
        res.status(201).json(enrollment);
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/courses/enrollments/:id/progress
 * Update enrollment progress
 */
async function updateEnrollmentProgress(req, res, next) {
    try {
        const { id } = req.params;
        const { progress, status } = req.body;
        const enrollment = await coursesService.updateProgress(
            parseInt(id, 10),
            progress,
            status || 'in_progress'
        );
        res.json(enrollment);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getAllCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
    getEnrollmentsByCourse,
    getMyEnrollments,
    enrollInCourse,
    updateEnrollmentProgress,
};
