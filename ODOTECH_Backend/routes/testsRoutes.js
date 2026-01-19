const express = require('express');
const router = express.Router();
const testsController = require('../controllers/testsController');
const authenticate = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(authenticate);

// Test routes
router.get('/', testsController.getAllTests);
router.get('/my-results', testsController.getMyResults);
router.get('/:id', testsController.getTestById);
router.post('/', testsController.createTest);
router.put('/:id', testsController.updateTest);
router.delete('/:id', testsController.deleteTest);

// Test submission and results
router.post('/:id/submit', testsController.submitTest);
router.get('/:id/results', testsController.getTestResults);

module.exports = router;
