const customersRepository = require("../repositories/customersRepository");

/**
 * List customers with filters and pagination
 */
async function listCustomers(filters) {
    return await customersRepository.listCustomers(filters);
}

/**
 * Get customer by ID
 */
async function getCustomerById(id) {
    const customer = await customersRepository.getCustomerById(id);
    if (!customer) {
        throw { status: 404, message: "Customer not found" };
    }
    return customer;
}

/**
 * Get customer by ma_kh
 */
async function getCustomerByMaKh(ma_kh) {
    const customer = await customersRepository.getCustomerByMaKh(ma_kh);
    if (!customer) {
        throw { status: 404, message: "Customer not found" };
    }
    return customer;
}

/**
 * Get customer projects
 */
async function getCustomerProjects(ma_kh) {
    // First verify customer exists
    await getCustomerByMaKh(ma_kh);

    const projects = await customersRepository.getCustomerProjects(ma_kh);
    return projects;
}

/**
 * Create new customer
 */
async function createCustomer(data) {
    // Validate required fields
    if (!data.ma_kh || !data.name) {
        throw { status: 400, message: "ma_kh and name are required" };
    }

    // Check if customer already exists
    const existing = await customersRepository.getCustomerByMaKh(data.ma_kh);
    if (existing) {
        throw { status: 409, message: "Customer with this ma_kh already exists" };
    }

    return await customersRepository.createCustomer(data);
}

/**
 * Update customer
 */
async function updateCustomer(id, data) {
    // Validate required fields
    if (!data.name) {
        throw { status: 400, message: "name is required" };
    }

    const customer = await customersRepository.updateCustomer(id, data);
    if (!customer) {
        throw { status: 404, message: "Customer not found" };
    }

    return customer;
}

/**
 * Delete customer
 */
async function deleteCustomer(id) {
    const deleted = await customersRepository.deleteCustomer(id);
    if (!deleted) {
        throw { status: 404, message: "Customer not found" };
    }
    return { message: "Customer deleted successfully" };
}

/**
 * Get customer statistics
 */
async function getCustomerStats() {
    return await customersRepository.getCustomerStats();
}

module.exports = {
    listCustomers,
    getCustomerById,
    getCustomerByMaKh,
    getCustomerProjects,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerStats,
};
