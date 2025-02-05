const speakeasy = require("speakeasy");
const crypto = require("crypto");
const { encrypt } = require("./cryptoUtils"); // Import encryption utility
const { getDatabase, storeNewApiKey, invalidateOldApiKey } = require("./database");

exports.handler = async (event) => {
  try {
    // Parse the request body
    const body = JSON.parse(event.body);
    const token = body.token;

    // Extract the initial API key and session ID from headers
    const initialApiKey = event.headers["x-initial-api-key"];
    const sessionId = event.headers["x-session-id"];

    if (!initialApiKey || !sessionId) {
      return {
        statusCode: 403,
        body: JSON.stringify({ success: false, message: "Forbidden: Missing initial API key or session ID" }),
      };
    }

    // Retrieve the user's data from the database
    const userId = event.headers["x-user-id"];
    const user = await getDatabase(userId);

    if (!user || user.apiKey !== initialApiKey || user.sessionId !== sessionId) {
      return {
        statusCode: 403,
        body: JSON.stringify({ success: false, message: "Forbidden: Invalid initial API key or session ID" }),
      };
    }

    // Verify the OTP
    const isValid = speakeasy.totp.verify({
      secret: process.env.SHARED_SECRET,
      encoding: "ascii",
      token: token,
    });

    if (!isValid) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, message: "Invalid OTP" }),
      };
    }

    // Generate a new API key
    const newApiKey = crypto.randomBytes(32).toString("hex");

    // Invalidate the old API key
    await invalidateOldApiKey(userId);

    // Store the new API key in the database but mark it as inactive
    await storeNewApiKey(userId, newApiKey, { isActive: false });

    // Encrypt the new API key
    const encryptedApiKey = encrypt(newApiKey);

    // Return the encrypted API key securely
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "OTP verified successfully! New API key issued but inactive until logout.",
        apiKey: encryptedApiKey, // Encrypted API key
      }),
    };
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: "Internal server error" }),
    };
  }
};
