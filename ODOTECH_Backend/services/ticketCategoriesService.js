const categoriesRepo = require("../repositories/ticketCategoriesRepository");
const { validateTicketCategoryData } = require("../models/ticketCategory");

/**
 * Get all categories
 */
async function getAllCategories(type) {
    return await categoriesRepo.getAllCategories(type);
}

/**
 * Get category by ID
 */
async function getCategoryById(id) {
    return await categoriesRepo.getCategoryById(id);
}

/**
 * Create new category
 */
async function createCategory(data) {
    const validation = validateTicketCategoryData(data);
    if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
    }

    return await categoriesRepo.createCategory(data);
}

/**
 * Update category
 */
async function updateCategory(id, data) {
    if (data.name || data.type) {
        const validation = validateTicketCategoryData({ ...data, name: data.name || 'temp', type: data.type || 'customer' });
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }
    }

    return await categoriesRepo.updateCategory(id, data);
}

/**
 * Delete category
 */
async function deleteCategory(id) {
    return await categoriesRepo.deleteCategory(id);
}

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
};
