const crypto = require("crypto");

// Encryption key (stored securely in environment variables)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes (256 bits)
const IV_LENGTH = 16; // Initialization vector length for AES

/**
 * Encrypts a given text using AES-256-CBC.
 * @param {string} text - The plaintext to encrypt.
 * @returns {string} - The encrypted text (IV + ciphertext).
 * @throws {Error} - Throws an error if encryption fails.
 */
function encrypt(text) {
  if (!ENCRYPTION_KEY) {
    throw new Error("Encryption key is missing. Ensure ENCRYPTION_KEY is set in environment variables.");
  }

  const iv = crypto.randomBytes(IV_LENGTH); // Generate a random initialization vector
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY, "hex"), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`; // Combine IV and ciphertext
}

/**
 * Decrypts a given encrypted text using AES-256-CBC.
 * @param {string} text - The encrypted text (IV + ciphertext).
 * @returns {string} - The decrypted plaintext.
 * @throws {Error} - Throws an error if decryption fails.
 */
function decrypt(text) {
  if (!ENCRYPTION_KEY) {
    throw new Error("Encryption key is missing. Ensure ENCRYPTION_KEY is set in environment variables.");
  }

  const textParts = text.split(":"); // Split IV and ciphertext
  if (textParts.length !== 2) {
    throw new Error("Invalid encrypted text format. Expected 'IV:ciphertext'.");
  }

  const iv = Buffer.from(textParts[0], "hex"); // Extract IV
  const encryptedText = Buffer.from(textParts[1], "hex"); // Extract ciphertext
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY, "hex"), iv);

  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted; // Return decrypted plaintext
}

module.exports = { encrypt, decrypt };
