const express = require("express");

const authMiddleware = require("../middlewares/authMiddleware");
const { validate, queryIntOptional, queryStringOptional, bodyStringOptional, bodyRequiredString } = require("../middlewares/validate");

const {
    listCustomers,
    getCustomerById,
    getCustomerProjects,
    updateCustomer,
    createCustomer,
    deleteCustomer,
    getCustomerStats,
} = require("../controllers/customersController");

const router = express.Router();

router.get("/health", (req, res) => {
    res.json({ ok: true, service: "customers" });
});

router.use(authMiddleware);

// GET /api/customers - List customers
router.get(
    "/",
    validate([
        queryIntOptional("limit", { min: 1, max: 200, message: "Invalid limit" }),
        queryIntOptional("offset", { min: 0, message: "Invalid offset" }),
        queryStringOptional("q", { maxLen: 500, message: "Invalid q" }),
        queryStringOptional("nguon_khach", { maxLen: 100, message: "Invalid nguon_khach" }),
        queryStringOptional("sale_id", { maxLen: 100, message: "Invalid sale_id" }),
    ]),
    listCustomers
);

// GET /api/customers/stats - Get customer statistics
router.get("/stats", getCustomerStats);

// GET /api/customers/:id - Get customer by ID
router.get("/:id", getCustomerById);

// GET /api/customers/:id/projects - Get customer projects
router.get("/:id/projects", getCustomerProjects);

// POST /api/customers - Create new customer
router.post(
    "/",
    validate([
        bodyRequiredString("ma_kh", { maxLen: 50, message: "ma_kh is required" }),
        bodyRequiredString("name", { maxLen: 255, message: "name is required" }),
        bodyStringOptional("phone", { maxLen: 50, message: "Invalid phone" }),
        bodyStringOptional("email", { maxLen: 255, message: "Invalid email" }),
        bodyStringOptional("zalo_fb", { maxLen: 255, message: "Invalid zalo_fb" }),
        bodyStringOptional("company", { maxLen: 255, message: "Invalid company" }),
        bodyStringOptional("nguon_khach", { maxLen: 100, message: "Invalid nguon_khach" }),
        bodyStringOptional("nhu_cau", { maxLen: 5000, message: "Invalid nhu_cau" }),
        bodyStringOptional("san_pham_dv", { maxLen: 5000, message: "Invalid san_pham_dv" }),
        bodyStringOptional("website", { maxLen: 255, message: "Invalid website" }),
    ]),
    createCustomer
);

// PUT /api/customers/:id - Update customer
router.put(
    "/:id",
    validate([
        bodyRequiredString("name", { maxLen: 255, message: "name is required" }),
        bodyStringOptional("phone", { maxLen: 50, message: "Invalid phone" }),
        bodyStringOptional("email", { maxLen: 255, message: "Invalid email" }),
        bodyStringOptional("zalo_fb", { maxLen: 255, message: "Invalid zalo_fb" }),
        bodyStringOptional("company", { maxLen: 255, message: "Invalid company" }),
        bodyStringOptional("nguon_khach", { maxLen: 100, message: "Invalid nguon_khach" }),
        bodyStringOptional("nhu_cau", { maxLen: 5000, message: "Invalid nhu_cau" }),
        bodyStringOptional("san_pham_dv", { maxLen: 5000, message: "Invalid san_pham_dv" }),
        bodyStringOptional("website", { maxLen: 255, message: "Invalid website" }),
    ]),
    updateCustomer
);

// DELETE /api/customers/:id - Delete customer (admin only)
router.delete("/:id", deleteCustomer);

module.exports = router;