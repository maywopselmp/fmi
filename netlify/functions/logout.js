const path = require('path');
const cryptoUtils = require(path.join(process.cwd(), 'utils', 'cryptoUtils'));
const { encrypt } = cryptoUtils;
const crypto = require('crypto');

exports.handler = async (event) => {
  try {
    // Extract headers
    const sessionId = event.headers["x-session-id"];
    const userId = event.headers["x-user-id"];

    // Validate required headers
    if (!sessionId || !userId) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          success: false,
          message: "Forbidden: Missing session ID or user ID",
        }),
      };
    }

    // Retrieve static environment variables
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
    const NETLIFY_SITE_ID = process.env.NETLIFY_SITE_ID;
    const NETLIFY_TOKEN = process.env.NETLIFY_TOKEN;

    // Validate environment variables
    if (!ENCRYPTION_KEY || !NETLIFY_SITE_ID || !NETLIFY_TOKEN) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: "Internal server error: Missing environment variables",
        }),
      };
    }

    // Authenticate the user using Netlify Identity
    const xNetlifyIdHeader = event.headers["x-netlify-id"];
    if (!xNetlifyIdHeader) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          success: false,
          message: "Unauthorized: Missing x-netlify-id header",
        }),
      };
    }

    let user;
    try {
      user = JSON.parse(xNetlifyIdHeader);
    } catch (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: "Bad request: Invalid x-netlify-id header",
        }),
      };
    }

    if (!user || !user.id) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          success: false,
          message: "Unauthorized: User not authenticated",
        }),
      };
    }

    // Invalidate the current API key
    const invalidateApiKeyResponse = await fetch(
      `https://api.netlify.com/api/v1/sites/${NETLIFY_SITE_ID}/users/${userId}/metadata`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${NETLIFY_TOKEN}`,
        },
        body: JSON.stringify({ newApiKey: null }),
      }
    );

    if (!invalidateApiKeyResponse.ok) {
      const errorBody = await invalidateApiKeyResponse.json();
      console.error("Error invalidating API key:", errorBody);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: "Failed to invalidate API key",
        }),
      };
    }

    // Generate a new API key for the next session
    const newApiKey = crypto.randomBytes(32).toString("hex");
    const encryptedApiKey = encrypt(newApiKey, ENCRYPTION_KEY);

    // Store the new API key in the user's metadata
    const storeApiKeyResponse = await fetch(
      `https://api.netlify.com/api/v1/sites/${NETLIFY_SITE_ID}/users/${userId}/metadata`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${NETLIFY_TOKEN}`,
        },
        body: JSON.stringify({ newApiKey: encryptedApiKey }),
      }
    );

    if (!storeApiKeyResponse.ok) {
      const errorBody = await storeApiKeyResponse.json();
      console.error("Error storing new API key:", errorBody);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: "Failed to store new API key",
        }),
      };
    }

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
      body: JSON.stringify({
        success: false,
        message: "Internal server error",
      }),
    };
  }
};
