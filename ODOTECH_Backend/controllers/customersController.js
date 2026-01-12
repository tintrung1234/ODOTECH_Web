const { requireUser } = require("../utils/authz");
const customersService = require("../services/customersService");

function canViewCustomers(role) {
    return ["admin", "sale", "sales_manager", "head_sales"].includes(role);
}

function canEditCustomers(role) {
    return ["admin", "sales_manager", "head_sales"].includes(role);
}

function getSaleScopeId(req) {
    return req.user?.id || null;
}

/**
 * List customers with aggregated data
 */
async function listCustomers(req, res, next) {
    try {
        const auth = requireUser(req);
        if (auth.error) return res.status(auth.error.status).json({ message: auth.error.message });
        if (!canViewCustomers(auth.role)) return res.status(403).json({ message: "Insufficient permissions" });

        const {
            limit = 50,
            offset = 0,
            q = "",
            nguon_khach = "",
            sale_id = "",
        } = req.query;

        const filters = {
            limit: Number(limit),
            offset: Number(offset),
            search: q,
            nguon_khach,
            sale_id: sale_id || null,
        };

        // Role-based filtering: sale can only see their own customers
        if (auth.role === "sale") {
            filters.sale_id = getSaleScopeId(req);
        }

        const result = await customersService.listCustomers(filters);
        res.json(result);
    } catch (err) {
        next(err);
    }
}

/**
 * Get customer details by ID or ma_kh
 */
async function getCustomerById(req, res, next) {
    try {
        const auth = requireUser(req);
        if (auth.error) return res.status(auth.error.status).json({ message: auth.error.message });
        if (!canViewCustomers(auth.role)) return res.status(403).json({ message: "Insufficient permissions" });

        const { id } = req.params;

        // Check if id is numeric or ma_kh
        // If it's a small number (< 1,000,000), treat as customer ID
        // Otherwise treat as ma_kh (string like "KH003" or "21541123534")
        let customer;
        const isNumeric = /^\d+$/.test(id);
        const numericValue = isNumeric ? parseInt(id) : null;

        if (isNumeric && numericValue < 1000000) {
            customer = await customersService.getCustomerById(numericValue);
        } else {
            customer = await customersService.getCustomerByMaKh(id);
        }

        // Role-based access: sale can only view their own customers
        if (auth.role === "sale" && customer.sale_id !== getSaleScopeId(req)) {
            return res.status(403).json({ message: "Access denied" });
        }

        res.json(customer);
    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ message: err.message });
        }
        next(err);
    }
}

/**
 * Get all projects for a specific customer
 */
async function getCustomerProjects(req, res, next) {
    try {
        const auth = requireUser(req);
        if (auth.error) return res.status(auth.error.status).json({ message: auth.error.message });
        if (!canViewCustomers(auth.role)) return res.status(403).json({ message: "Insufficient permissions" });

        const { id } = req.params;

        // Get customer first to check permissions
        let customer;
        const isNumeric = /^\d+$/.test(id);
        const numericValue = isNumeric ? parseInt(id) : null;

        if (isNumeric && numericValue < 1000000) {
            customer = await customersService.getCustomerById(numericValue);
        } else {
            customer = await customersService.getCustomerByMaKh(id);
        }

        // Role-based access: sale can only view their own customers
        if (auth.role === "sale" && customer.sale_id !== getSaleScopeId(req)) {
            return res.status(403).json({ message: "Access denied" });
        }

        const projects = await customersService.getCustomerProjects(customer.ma_kh);
        res.json({ projects });
    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ message: err.message });
        }
        next(err);
    }
}

/**
 * Update customer information
 */
async function updateCustomer(req, res, next) {
    try {
        const auth = requireUser(req);
        if (auth.error) return res.status(auth.error.status).json({ message: auth.error.message });
        if (!canEditCustomers(auth.role)) return res.status(403).json({ message: "Insufficient permissions" });

        const { id } = req.params;

        // Get customer first to check permissions
        let existingCustomer;
        const isNumeric = /^\d+$/.test(id);
        const numericValue = isNumeric ? parseInt(id) : null;

        if (isNumeric && numericValue < 1000000) {
            existingCustomer = await customersService.getCustomerById(numericValue);
        } else {
            existingCustomer = await customersService.getCustomerByMaKh(id);
        }

        // Role-based access: sales_manager can only edit their team's customers
        if (auth.role === "sales_manager" && existingCustomer.sale_id !== getSaleScopeId(req)) {
            return res.status(403).json({ message: "Access denied" });
        }

        const customer = await customersService.updateCustomer(existingCustomer.id, req.body);
        res.json(customer);
    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ message: err.message });
        }
        next(err);
    }
}

/**
 * Create new customer
 */
async function createCustomer(req, res, next) {
    try {
        const auth = requireUser(req);
        if (auth.error) return res.status(auth.error.status).json({ message: auth.error.message });
        if (!canEditCustomers(auth.role)) return res.status(403).json({ message: "Insufficient permissions" });

        const customer = await customersService.createCustomer(req.body);
        res.status(201).json(customer);
    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ message: err.message });
        }
        next(err);
    }
}

/**
 * Delete customer
 */
async function deleteCustomer(req, res, next) {
    try {
        const auth = requireUser(req);
        if (auth.error) return res.status(auth.error.status).json({ message: auth.error.message });
        if (auth.role !== "admin") return res.status(403).json({ message: "Only admins can delete customers" });

        const { id } = req.params;
        const result = await customersService.deleteCustomer(id);
        res.json(result);
    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ message: err.message });
        }
        next(err);
    }
}

/**
 * Get customer statistics
 */
async function getCustomerStats(req, res, next) {
    try {
        const auth = requireUser(req);
        if (auth.error) return res.status(auth.error.status).json({ message: auth.error.message });
        if (!canViewCustomers(auth.role)) return res.status(403).json({ message: "Insufficient permissions" });

        const stats = await customersService.getCustomerStats();
        res.json(stats);
    } catch (err) {
        next(err);
    }
}

module.exports = {
    listCustomers,
    getCustomerById,
    getCustomerProjects,
    updateCustomer,
    createCustomer,
    deleteCustomer,
    getCustomerStats,
};
