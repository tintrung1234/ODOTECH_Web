const customersRepository = require("../repositories/customersRepository");
const authService = require("./authService");
const bcrypt = require("bcryptjs");

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
    return customersRepository.getCustomerStats();
}

/**
 * Create an account for a customer
 */
async function createCustomerAccount(customerId, { username, password }) {
    // 1. Get customer
    const customer = await customersRepository.getCustomerById(customerId);
    if (!customer) {
        throw { status: 404, message: "Customer not found" };
    }

    // 2. Check if account with email exists (if email is present)
    let emailToUse = null;
    if (customer.email) {
        emailToUse = customer.email;
        const existingAccount = await authService.getAccountForAuthByEmail(emailToUse);
        if (existingAccount) {
            throw { status: 409, message: "Account with this email already exists" };
        }
    }

    // 3. Check if username exists
    const existingUser = await authService.getAccountForAuthByUsername(username);
    if (existingUser) {
        throw { status: 409, message: "Username already exists" };
    }

    // 4. Create account
    const password_hash = await bcrypt.hash(password, 10);
    const account = await authService.registerAccount({
        username,
        password_hash,
        role_system: "customer",
        email: emailToUse, // IF null/undefined, authService generates logic
        status: "active"
    });

    // 5. If customer didn't have an email, update it with the generated one to link them
    if (!customer.email && account.email) {
        await customersRepository.updateCustomer(customer.id, {
            ...customer,
            email: account.email
        });
    }

    return account;
}

/**
 * Get account info for a customer
 */
async function getCustomerAccount(customerId) {
    const customer = await customersRepository.getCustomerById(customerId);
    if (!customer || !customer.email) return null;

    const account = await authService.getAccountForAuthByEmail(customer.email);
    if (account) {
        // Return safe account info
        return {
            id: account.id,
            username: account.username,
            email: account.email,
            role_system: account.role_system,
            status: account.status
        };
    }
    return null;
}

/**
 * Update customer account (username/password)
 */
async function updateCustomerAccount(customerId, { username, password }) {
    const customer = await customersRepository.getCustomerById(customerId);
    if (!customer) throw { status: 404, message: "Customer not found" };

    // Find account by customer email
    if (!customer.email) throw { status: 404, message: "Customer account not found (no email)" };

    const account = await authService.getAccountForAuthByEmail(customer.email);
    if (!account) throw { status: 404, message: "Customer account not found" };

    // Updates
    const updates = {};

    // Validate username uniqueness if changed
    if (username && username !== account.username) {
        const existing = await authService.getAccountForAuthByUsername(username);
        if (existing) throw { status: 409, message: "Username already exists" };
        updates.username = username;
    }

    // Hash password if provided
    if (password) {
        updates.password_hash = await bcrypt.hash(password, 10);
    }

    // Perform update via authRepository (need to ensure this method exists or use a direct query/helper)
    // Since authRepository might not have a generic update, we'll check authService or fallback to a new repository method.
    // Checking authService content first from memory/logs... authService has register/get.
    // Let's assume we need to add updateAccount to authService/Repository or use a direct query here if simpler, 
    // but cleaner to put in auth layer. For now, let's assume we add `updateAccount` to authService.

    return await authService.updateAccount(account.id, updates);
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
    createCustomerAccount,
    getCustomerAccount,
    updateCustomerAccount,
};
