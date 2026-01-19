const coursesRepository = require('../repositories/coursesRepository');

/**
 * Get all courses
 */
async function getAllCourses(filters) {
    return await coursesRepository.getAllCourses(filters);
}

/**
 * Get course by ID
 */
async function getCourseById(id) {
    const course = await coursesRepository.getCourseById(id);
    if (!course) {
        throw new Error('Course not found');
    }
    return course;
}

/**
 * Create course
 */
async function createCourse(courseData) {
    if (!courseData.title) {
        throw new Error('Course title is required');
    }
    return await coursesRepository.createCourse(courseData);
}

/**
 * Update course
 */
async function updateCourse(id, courseData) {
    const existing = await coursesRepository.getCourseById(id);
    if (!existing) {
        throw new Error('Course not found');
    }
    return await coursesRepository.updateCourse(id, courseData);
}

/**
 * Delete course
 */
async function deleteCourse(id) {
    const existing = await coursesRepository.getCourseById(id);
    if (!existing) {
        throw new Error('Course not found');
    }
    await coursesRepository.deleteCourse(id);
}

/**
 * Get enrollments for course
 */
async function getEnrollmentsByCourse(courseId) {
    return await coursesRepository.getEnrollmentsByCourse(courseId);
}

/**
 * Get enrollments for account
 */
async function getEnrollmentsByAccount(accountId) {
    return await coursesRepository.getEnrollmentsByAccount(accountId);
}

/**
 * Enroll in course
 */
async function enrollAccount(courseId, accountId) {
    const course = await coursesRepository.getCourseById(courseId);
    if (!course) {
        throw new Error('Course not found');
    }
    if (course.status !== 'published') {
        throw new Error('Cannot enroll in unpublished course');
    }
    return await coursesRepository.enrollAccount(courseId, accountId);
}

/**
 * Update progress
 */
async function updateProgress(enrollmentId, progress, status) {
    if (progress < 0 || progress > 100) {
        throw new Error('Progress must be between 0 and 100');
    }
    return await coursesRepository.updateProgress(enrollmentId, progress, status);
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
};
