const crypto = require("crypto");

// Encryption configuration
const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

// Get encryption key from environment variable
// In production, this should be a secure random key stored in environment
// Get encryption key from environment variable
// In production, this should be a secure random key stored in environment
function getEncryptionKey() {
    // Try ENCRYPTION_KEY first, fallback to JWT_SECRET
    const key = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET;

    if (!key) {
        throw new Error("ENCRYPTION_KEY or JWT_SECRET environment variable is not set");
    }

    // Use SHA-256 to derive a 32-byte key from the input string
    // This ensures we always have a valid key length for AES-256 regardless of input format
    return crypto.createHash('sha256').update(String(key)).digest();
}

/**
 * Encrypts a text string using AES-256-GCM
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted text in format: iv:authTag:encryptedData (all hex encoded)
 */
function encrypt(text) {
    if (text === null || text === undefined) {
        return "";
    }

    // Ensure text is a string
    const textStr = String(text);

    if (textStr.trim() === "") {
        return "";
    }

    try {
        const key = getEncryptionKey();
        const iv = crypto.randomBytes(IV_LENGTH);

        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        let encrypted = cipher.update(textStr, "utf8", "hex");
        encrypted += cipher.final("hex");

        const authTag = cipher.getAuthTag();

        // Return format: iv:authTag:encryptedData
        return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
    } catch (error) {
        console.error("Encryption error:", error);
        throw new Error(`Failed to encrypt data: ${error.message}`);
    }
}

/**
 * Decrypts an encrypted string
 * @param {string} encryptedText - Encrypted text in format: iv:authTag:encryptedData
 * @returns {string} - Decrypted plain text
 */
function decrypt(encryptedText) {
    if (!encryptedText || encryptedText.trim() === "") {
        return "";
    }

    try {
        const key = getEncryptionKey();

        // Parse the encrypted text
        const parts = encryptedText.split(":");
        if (parts.length !== 3) {
            throw new Error("Invalid encrypted data format");
        }

        const iv = Buffer.from(parts[0], "hex");
        const authTag = Buffer.from(parts[1], "hex");
        const encrypted = parts[2];

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, "hex", "utf8");
        decrypted += decipher.final("utf8");

        return decrypted;
    } catch (error) {
        console.error("Decryption error:", error);
        throw new Error("Failed to decrypt data");
    }
}

/**
 * Generates a random encryption key (for initial setup)
 * @returns {string} - Hex encoded 256-bit key
 */
function generateEncryptionKey() {
    return crypto.randomBytes(KEY_LENGTH).toString("hex");
}

module.exports = {
    encrypt,
    decrypt,
    generateEncryptionKey,
};
