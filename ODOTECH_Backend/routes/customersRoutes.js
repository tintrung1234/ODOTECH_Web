const express = require("express");

const authMiddleware = require("../middlewares/authMiddleware");
const { validate, queryIntOptional, queryStringOptional, bodyStringOptional } = require("../middlewares/validate");

const {
    listCustomers,
    getCustomerById,
    getCustomerProjects,
    updateCustomer,
} = require("../controllers/customersController");

const router = express.Router();

router.get("/health", (req, res) => {
    res.json({ ok: true, service: "customers" });
});

router.use(authMiddleware);

function parseCustomersListQuery(req, res, next) {
    const toInt = (val, def) => {
        const n = Number(val);
        return Number.isFinite(n) ? Math.floor(n) : def;
    };

    req.listQuery = {
        limit: Math.min(Math.max(toInt(req.query.limit, 50), 1), 200),
        offset: Math.max(toInt(req.query.offset, 0), 0),
        q: typeof req.query.q === "string" ? req.query.q.trim() : "",
        nguon_khach: typeof req.query.nguon_khach === "string" ? req.query.nguon_khach.trim() : "",
        sale_id: typeof req.query.sale_id === "string" ? req.query.sale_id.trim() : "",
    };
    next();
}

router.get(
    "/",
    validate([
        queryIntOptional("limit", { min: 1, max: 200, message: "Invalid limit" }),
        queryIntOptional("offset", { min: 0, message: "Invalid offset" }),
        queryStringOptional("q", { maxLen: 500, message: "Invalid q" }),
        queryStringOptional("nguon_khach", { maxLen: 100, message: "Invalid nguon_khach" }),
        queryStringOptional("sale_id", { maxLen: 100, message: "Invalid sale_id" }),
    ]),
    parseCustomersListQuery,
    listCustomers
);

router.get("/:id", getCustomerById);

router.get("/:id/projects", getCustomerProjects);

router.put(
    "/:id",
    validate([
        bodyStringOptional("ten_khach", { maxLen: 500, message: "Invalid ten_khach" }),
        bodyStringOptional("sdt", { maxLen: 50, message: "Invalid sdt" }),
        bodyStringOptional("zalo_fb", { maxLen: 200, message: "Invalid zalo_fb" }),
        bodyStringOptional("nguon_khach", { maxLen: 100, message: "Invalid nguon_khach" }),
        bodyStringOptional("website", { maxLen: 500, message: "Invalid website" }),
    ]),
    updateCustomer
);

module.exports = router;
