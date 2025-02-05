const { decrypt } = require("../utils/cryptoUtils"); // Import decryption utility
const { getDatabase, storeNewApiKey, invalidateOldApiKey, activateNewApiKey, endSession } = require("../database");

exports.handler = async (event) => {
  try {
    const userId = event.headers["x-user-id"];
    const sessionId = event.headers["x-session-id"];
    const encryptedApiKey = event.headers["x-api-key"];

    if (!encryptedApiKey || !sessionId) {
      return {
        statusCode: 403,
        body: JSON.stringify({ success: false, message: "Forbidden: Missing API key or session ID" }),
      };
    }

    // Decrypt the API key
    let apiKey;
    try {
      apiKey = decrypt(encryptedApiKey);
    } catch (error) {
      return {
        statusCode: 403,
        body: JSON.stringify({ success: false, message: "Forbidden: Invalid API key format" }),
      };
    }

    // Retrieve the user's data from the database
    const user = await getDatabase(userId);

    if (!user || user.apiKey !== apiKey || user.sessionId !== sessionId) {
      return {
        statusCode: 403,
        body: JSON.stringify({ success: false, message: "Forbidden: Invalid API key or session ID" }),
      };
    }

    // Generate a new API key for the next session
    const newApiKey = crypto.randomBytes(32).toString("hex");

    // Invalidate the old API key
    await invalidateOldApiKey(userId);

    // Store the new API key in the database and mark it as active
    await storeNewApiKey(userId, newApiKey, { isActive: true });

    // End the current session
    await endSession(userId);

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
