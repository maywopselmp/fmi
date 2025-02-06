const crypto = require("crypto");

// Encryption key (stored securely in environment variables)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes (256 bits)
const IV_LENGTH = 16; // Initialization vector length for AES

/**
 * Encrypts a given text using AES-256-CBC.
 * @param {string} text - The plaintext to encrypt.
 * @returns {string} - The encrypted text (IV + ciphertext).
 */
function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH); // Generate a random initialization vector
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex"); // Combine IV and ciphertext
}

/**
 * Decrypts a given encrypted text using AES-256-CBC.
 * @param {string} text - The encrypted text (IV + ciphertext).
 * @returns {string} - The decrypted plaintext.
 */
function decrypt(text) {
  const textParts = text.split(":"); // Split IV and ciphertext
  const iv = Buffer.from(textParts.shift(), "hex"); // Extract IV
  const encryptedText = Buffer.from(textParts.join(":"), "hex"); // Extract ciphertext
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString(); // Return decrypted plaintext
}

module.exports = { encrypt, decrypt };
