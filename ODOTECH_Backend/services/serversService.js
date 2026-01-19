const serversRepository = require("../repositories/serversRepository");
const { encrypt, decrypt } = require("../utils/encryption");

/**
 * List servers with role-based filtering
 */
async function listServers({ limit, offset, search, status, server_type, provider, user_role, user_id }) {
    // Role-based filtering
    let filters = { limit, offset, search, status, server_type, provider };

    // Dev roles can only see servers they manage
    if (user_role === "dev" || user_role === "dev_manager") {
        // For now, devs can see all servers (can be restricted later)
    }

    const servers = await serversRepository.listServers(filters);

    // Remove encrypted passwords from list view
    return servers.map(s => ({
        ...s,
        ssh_password: s.ssh_password ? "***" : "",
        ssh_key: s.ssh_key ? "***" : "",
        root_password: s.root_password ? "***" : "",
        panel_password: s.panel_password ? "***" : "",
    }));
}

/**
 * Get server by ID (without decrypted passwords)
 */
async function getServerById(id) {
    const server = await serversRepository.getServerById(id);
    if (!server) return null;

    // Don't decrypt passwords in normal get
    return {
        ...server,
        ssh_password: server.ssh_password ? "***" : "",
        ssh_key: server.ssh_key ? "***" : "",
        root_password: server.root_password ? "***" : "",
        panel_password: server.panel_password ? "***" : "",
    };
}

/**
 * Reveal password (decrypt and return)
 */
async function revealPassword(id, credential_type) {
    const server = await serversRepository.getServerById(id);
    if (!server) {
        throw new Error("Server not found");
    }

    let password = "";

    switch (credential_type) {
        case "ssh":
            password = server.ssh_password ? decrypt(server.ssh_password) : "";
            break;
        case "ssh_key":
            password = server.ssh_key ? decrypt(server.ssh_key) : "";
            break;
        case "root":
            password = server.root_password ? decrypt(server.root_password) : "";
            break;
        case "panel":
            password = server.panel_password ? decrypt(server.panel_password) : "";
            break;
        default:
            throw new Error("Invalid credential type");
    }

    return { password };
}

/**
 * Create server with encrypted credentials
 */
async function createServer(data) {
    // Encrypt passwords before storing
    const encryptedData = {
        ...data,
        ssh_password: data.ssh_password ? encrypt(data.ssh_password) : null,
        ssh_key: data.ssh_key ? encrypt(data.ssh_key) : null,
        root_password: data.root_password ? encrypt(data.root_password) : null,
        panel_password: data.panel_password ? encrypt(data.panel_password) : null,
    };

    const server = await serversRepository.createServer(encryptedData);

    // Return without decrypted passwords
    return {
        ...server,
        ssh_password: server.ssh_password ? "***" : "",
        ssh_key: server.ssh_key ? "***" : "",
        root_password: server.root_password ? "***" : "",
        panel_password: server.panel_password ? "***" : "",
    };
}

/**
 * Update server with encrypted credentials
 */
async function updateServer(id, data) {
    // Get existing server to preserve passwords if not provided
    const existing = await serversRepository.getServerById(id);
    if (!existing) {
        throw new Error("Server not found");
    }

    // Encrypt new passwords or keep existing
    const encryptedData = {
        ...data,
        ssh_password: data.ssh_password && data.ssh_password !== "***"
            ? encrypt(data.ssh_password)
            : existing.ssh_password,
        ssh_key: data.ssh_key && data.ssh_key !== "***"
            ? encrypt(data.ssh_key)
            : existing.ssh_key,
        root_password: data.root_password && data.root_password !== "***"
            ? encrypt(data.root_password)
            : existing.root_password,
        panel_password: data.panel_password && data.panel_password !== "***"
            ? encrypt(data.panel_password)
            : existing.panel_password,
    };

    const server = await serversRepository.updateServer(id, encryptedData);

    // Return without decrypted passwords
    return {
        ...server,
        ssh_password: server.ssh_password ? "***" : "",
        ssh_key: server.ssh_key ? "***" : "",
        root_password: server.root_password ? "***" : "",
        panel_password: server.panel_password ? "***" : "",
    };
}

/**
 * Delete server
 */
async function deleteServer(id) {
    return await serversRepository.deleteServer(id);
}

/**
 * Get server statistics
 */
async function getServerStats() {
    const stats = await serversRepository.getServerStats();
    const byType = await serversRepository.getServersByType();
    const byProvider = await serversRepository.getServersByProvider();

    return {
        ...stats,
        by_type: byType,
        by_provider: byProvider,
    };
}

module.exports = {
    listServers,
    getServerById,
    revealPassword,
    createServer,
    updateServer,
    deleteServer,
    getServerStats,
};
