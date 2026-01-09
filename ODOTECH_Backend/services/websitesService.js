const websitesRepository = require("../repositories/websitesRepository");
const { encrypt, decrypt } = require("../utils/encryption");

/**
 * List websites with role-based filtering
 */
async function listWebsites({ limit, offset, search, status, sale_manager_id, user_role, user_id }) {
    // Role-based filtering
    let filters = { limit, offset, search, status };

    // Sales roles can only see their own websites
    if (user_role === "sale") {
        filters.sale_manager_id = user_id;
    } else if (sale_manager_id) {
        filters.sale_manager_id = sale_manager_id;
    }

    const websites = await websitesRepository.listWebsites(filters);

    // Remove encrypted passwords from list view
    return websites.map(w => ({
        ...w,
        admin_password: w.admin_password ? "***" : "",
        hosting_password: w.hosting_password ? "***" : "",
        vps_password: w.vps_password ? "***" : "",
        ssh_password: w.ssh_password ? "***" : "",
        ssh_key: w.ssh_key ? "***" : "",
    }));
}

/**
 * Get website by ID (without decrypted passwords)
 */
async function getWebsiteById(id) {
    const website = await websitesRepository.getWebsiteById(id);
    if (!website) return null;

    // Don't decrypt passwords in normal get
    return {
        ...website,
        admin_password: website.admin_password ? "***" : "",
        hosting_password: website.hosting_password ? "***" : "",
        vps_password: website.vps_password ? "***" : "",
        ssh_password: website.ssh_password ? "***" : "",
        ssh_key: website.ssh_key ? "***" : "",
    };
}

/**
 * Reveal password (decrypt and return)
 */
async function revealPassword(id, credential_type) {
    const website = await websitesRepository.getWebsiteById(id);
    if (!website) {
        throw new Error("Website not found");
    }

    let password = "";

    switch (credential_type) {
        case "admin":
            password = website.admin_password ? decrypt(website.admin_password) : "";
            break;
        case "hosting":
            password = website.hosting_password ? decrypt(website.hosting_password) : "";
            break;
        case "vps":
            password = website.vps_password ? decrypt(website.vps_password) : "";
            break;
        case "ssh":
            password = website.ssh_password ? decrypt(website.ssh_password) : "";
            break;
        case "ssh_key":
            password = website.ssh_key ? decrypt(website.ssh_key) : "";
            break;
        default:
            throw new Error("Invalid credential type");
    }

    return { password };
}

/**
 * Create website with encrypted credentials
 */
async function createWebsite(data) {
    // Encrypt passwords before storing
    const encryptedData = {
        ...data,
        admin_password: data.admin_password ? encrypt(data.admin_password) : null,
        hosting_password: data.hosting_password ? encrypt(data.hosting_password) : null,
        vps_password: data.vps_password ? encrypt(data.vps_password) : null,
        ssh_password: data.ssh_password ? encrypt(data.ssh_password) : null,
        ssh_key: data.ssh_key ? encrypt(data.ssh_key) : null,
    };

    const website = await websitesRepository.createWebsite(encryptedData);

    // Return without decrypted passwords
    return {
        ...website,
        admin_password: website.admin_password ? "***" : "",
        hosting_password: website.hosting_password ? "***" : "",
        vps_password: website.vps_password ? "***" : "",
        ssh_password: website.ssh_password ? "***" : "",
        ssh_key: website.ssh_key ? "***" : "",
    };
}

/**
 * Update website with encrypted credentials
 */
async function updateWebsite(id, data) {
    // Get existing website to preserve passwords if not provided
    const existing = await websitesRepository.getWebsiteById(id);
    if (!existing) {
        throw new Error("Website not found");
    }

    // Encrypt new passwords or keep existing
    const encryptedData = {
        ...data,
        admin_password: data.admin_password && data.admin_password !== "***"
            ? encrypt(data.admin_password)
            : existing.admin_password,
        hosting_password: data.hosting_password && data.hosting_password !== "***"
            ? encrypt(data.hosting_password)
            : existing.hosting_password,
        vps_password: data.vps_password && data.vps_password !== "***"
            ? encrypt(data.vps_password)
            : existing.vps_password,
        ssh_password: data.ssh_password && data.ssh_password !== "***"
            ? encrypt(data.ssh_password)
            : existing.ssh_password,
        ssh_key: data.ssh_key && data.ssh_key !== "***"
            ? encrypt(data.ssh_key)
            : existing.ssh_key,
    };

    const website = await websitesRepository.updateWebsite(id, encryptedData);

    // Return without decrypted passwords
    return {
        ...website,
        admin_password: website.admin_password ? "***" : "",
        hosting_password: website.hosting_password ? "***" : "",
        vps_password: website.vps_password ? "***" : "",
        ssh_password: website.ssh_password ? "***" : "",
        ssh_key: website.ssh_key ? "***" : "",
    };
}

/**
 * Delete website
 */
async function deleteWebsite(id) {
    return await websitesRepository.deleteWebsite(id);
}

/**
 * Get website statistics
 */
async function getWebsiteStats() {
    return await websitesRepository.getWebsiteStats();
}

/**
 * Get storage alerts
 */
async function getStorageAlerts() {
    const alerts = await websitesRepository.getStorageAlerts();

    // Remove passwords from alerts
    return alerts.map(w => ({
        ...w,
        admin_password: "***",
        hosting_password: "***",
        vps_password: "***",
        ssh_password: "***",
        ssh_key: "***",
    }));
}

module.exports = {
    listWebsites,
    getWebsiteById,
    revealPassword,
    createWebsite,
    updateWebsite,
    deleteWebsite,
    getWebsiteStats,
    getStorageAlerts,
};
