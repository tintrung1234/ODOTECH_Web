const categoriesService = require("../services/ticketCategoriesService");

/**
 * GET /api/ticket-categories
 * Get all categories
 */
async function getAllCategories(req, res, next) {
    try {
        const type = req.query.type;
        const categories = await categoriesService.getAllCategories(type);
        res.json(categories);
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/ticket-categories/:id
 * Get category by ID
 */
async function getCategoryById(req, res, next) {
    try {
        const id = parseInt(req.params.id);
        const category = await categoriesService.getCategoryById(id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.json(category);
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/ticket-categories
 * Create new category (admin only)
 */
async function createCategory(req, res, next) {
    try {
        // Check if user is admin
        if (req.user.role_system !== 'admin') {
            return res.status(403).json({ message: 'Only admins can create categories' });
        }

        const category = await categoriesService.createCategory(req.body);
        res.status(201).json(category);
    } catch (error) {
        next(error);
    }
}

/**
 * PUT /api/ticket-categories/:id
 * Update category (admin only)
 */
async function updateCategory(req, res, next) {
    try {
        // Check if user is admin
        if (req.user.role_system !== 'admin') {
            return res.status(403).json({ message: 'Only admins can update categories' });
        }

        const id = parseInt(req.params.id);
        const category = await categoriesService.updateCategory(id, req.body);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.json(category);
    } catch (error) {
        next(error);
    }
}

/**
 * DELETE /api/ticket-categories/:id
 * Delete category (admin only)
 */
async function deleteCategory(req, res, next) {
    try {
        // Check if user is admin
        if (req.user.role_system !== 'admin') {
            return res.status(403).json({ message: 'Only admins can delete categories' });
        }

        const id = parseInt(req.params.id);
        const success = await categoriesService.deleteCategory(id);

        if (!success) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
};
