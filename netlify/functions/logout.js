const crypto = require("crypto");
const { encrypt } = require("../utils/cryptoUtils");

exports.handler = async (event) => {
  try {
    // Extract headers
    const sessionId = event.headers["x-session-id"];
    const userId = event.headers["x-user-id"];

    if (!sessionId || !userId) {
      return {
        statusCode: 403,
        body: JSON.stringify({ success: false, message: "Forbidden: Missing session ID or user ID" }),
      };
    }

    // Retrieve static environment variables
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

    if (!ENCRYPTION_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, message: "Internal server error: Missing environment variables" }),
      };
    }

    // Authenticate the user using Netlify Identity
    const { user } = JSON.parse(event.headers["x-netlify-id"]);

    if (!user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, message: "Unauthorized: User not authenticated" }),
      };
    }

    // Invalidate the current API key
    const { identity } = require("@netlify/identity-widget");

    await identity.updateUserMetadata(userId, { newApiKey: null });

    // Generate a new API key for the next session
    const newApiKey = crypto.randomBytes(32).toString("hex");
    const encryptedApiKey = encrypt(newApiKey, ENCRYPTION_KEY);

    // Store the new API key in the user's metadata
    await identity.updateUserMetadata(userId, { newApiKey: encryptedApiKey });

    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Logged out successfully. New API key generated for the next session.",
      }),
    };
  } catch (error) {
    console.error("Error logging out:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: "Internal server error" }),
    };
  }
};
