const express = require('express');
const router = express.Router();
const coursesController = require('../controllers/coursesController');
const authenticate = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(authenticate);

// Course routes
router.get('/', coursesController.getAllCourses);
router.get('/my-enrollments', coursesController.getMyEnrollments);
router.get('/:id', coursesController.getCourseById);
router.post('/', coursesController.createCourse);
router.put('/:id', coursesController.updateCourse);
router.delete('/:id', coursesController.deleteCourse);

// Enrollment routes
router.get('/:id/enrollments', coursesController.getEnrollmentsByCourse);
router.post('/:id/enroll', coursesController.enrollInCourse);
router.put('/enrollments/:id/progress', coursesController.updateEnrollmentProgress);

module.exports = router;
