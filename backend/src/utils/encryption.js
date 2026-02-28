const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

/**
 * Helper to ensure the secret key is exactly 32 bytes for aes-256
 */
const getSecretKey = () => {
    const key = process.env.AES_SECRET_KEY || 'default_secret_key_needs_32_bytes_';
    return crypto.createHash('sha256').update(String(key)).digest('base64').substring(0, 32);
};

/**
 * Encrypt a text string using AES-256-CBC
 * @param {string} text - The text to encrypt
 * @returns {string} - The encrypted string (iv:encryptedData)
 */
const encrypt = (text) => {
    if (!text) return text;

    // Generate an initialization vector
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher instance
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(getSecretKey()), iv);

    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Return concatenated IV and encrypted text
    return `${iv.toString('hex')}:${encrypted}`;
};

/**
 * Decrypt an AES-256-CBC encrypted string
 * @param {string} encryptedText - The text to decrypt (iv:encryptedData)
 * @returns {string} - The original text
 */
const decrypt = (encryptedText) => {
    if (!encryptedText) return encryptedText;

    try {
        const textParts = encryptedText.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedData = textParts.join(':');

        // Create decipher instance
        const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(getSecretKey()), iv);

        // Decrypt the text
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        throw new Error('Decryption failed');
    }
};

// Export encryption and decryption utility functions
module.exports = {
    encrypt,
    decrypt,
};
