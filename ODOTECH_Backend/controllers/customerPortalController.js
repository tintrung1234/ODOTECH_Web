const customersRepository = require("../repositories/customersRepository");
const accountsService = require("../services/accountsService");

function toTrimmedString(value) {
    if (value === null || value === undefined) return "";
    return String(value).trim();
}

function isValidEmail(value) {
    const email = String(value ?? "").trim();
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function resolveCustomerByUser(user) {
    const uid = Number(user?.uid);
    if (Number.isFinite(uid)) {
        const account = await accountsService.getAccountById(uid);
        const email = String(account?.email ?? "").trim();
        if (email) {
            const customer = await customersRepository.getCustomerByEmail(email);
            if (customer) return { customer, accountId: uid, accountEmail: email };
        }
    }

    const email = String(user?.email ?? "").trim();
    if (email) {
        const customer = await customersRepository.getCustomerByEmail(email);
        if (customer) return { customer, accountId: Number.isFinite(uid) ? uid : null, accountEmail: email };
    }

    return { customer: null, accountId: Number.isFinite(uid) ? uid : null, accountEmail: email };
}

async function getProfile(req, res, next) {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { customer } = await resolveCustomerByUser(user);
        if (!customer) {
            return res.status(404).json({ message: "Customer profile not found for this account" });
        }

        res.json(customer);
    } catch (err) {
        next(err);
    }
}

async function getServices(req, res, next) {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { customer } = await resolveCustomerByUser(user);
        if (!customer) {
            return res.status(404).json({ message: "Customer profile not found" });
        }

        const projects = await customersRepository.getCustomerProjects(customer.ma_kh);
        res.json(projects);
    } catch (err) {
        next(err);
    }
}

async function updateProfile(req, res, next) {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const resolved = await resolveCustomerByUser(user);
        const customer = resolved.customer;
        const accountId = resolved.accountId;
        if (!customer) {
            return res.status(404).json({ message: "Customer profile not found for this account" });
        }

        const name = toTrimmedString(req.body?.name) || customer.name;
        const phone = toTrimmedString(req.body?.phone);
        const company = toTrimmedString(req.body?.company);
        const website = toTrimmedString(req.body?.website);
        const zalo_fb = toTrimmedString(req.body?.zalo_fb);
        const emailInput = toTrimmedString(req.body?.email);
        const nextEmail = emailInput || String(customer.email ?? "").trim();

        if (!name) {
            return res.status(400).json({ message: "name is required" });
        }

        if (!nextEmail || !isValidEmail(nextEmail)) {
            return res.status(400).json({ message: "email must be a valid email address" });
        }

        // Keep accounts.email in sync if we can identify the account.
        if (Number.isFinite(accountId)) {
            try {
                await accountsService.updateAccountEmail(accountId, nextEmail);
            } catch (err) {
                if (err && err.code === "23505") {
                    return res.status(409).json({ message: "email already exists" });
                }
                throw err;
            }
        }

        const updated = await customersRepository.updateCustomer(customer.id, {
            name,
            phone: phone || null,
            email: nextEmail || null,
            zalo_fb: zalo_fb || null,
            company: company || null,
            nguon_khach: customer.nguon_khach || null,
            nhu_cau: customer.nhu_cau || null,
            san_pham_dv: customer.san_pham_dv || null,
            website: website || null,
            sale_id: customer.sale_id ?? null,
        });

        res.json(updated);
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getProfile,
    getServices,
    updateProfile,
};
