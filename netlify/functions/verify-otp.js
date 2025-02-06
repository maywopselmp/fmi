const speakeasy = require("speakeasy");
const path = require('path');
const cryptoUtils = require(path.join(process.cwd(), 'utils', 'cryptoUtils'));
const { decrypt } = cryptoUtils;
const crypto = require('crypto');

exports.handler = async (event) => {
  try {
    // Parse the request body
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: "Bad request: Invalid JSON in request body",
        }),
      };
    }

    const token = body.token;

    // Validate required fields
    if (!token) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: "Bad request: Missing token",
        }),
      };
    }

    // Extract headers
    const sessionId = event.headers["x-session-id"];
    if (!sessionId) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          success: false,
          message: "Forbidden: Missing session ID",
        }),
      };
    }

    // Retrieve static environment variables
    const SHARED_SECRET = process.env.SHARED_SECRET;
    const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
    const NETLIFY_SITE_ID = process.env.NETLIFY_SITE_ID;
    const NETLIFY_TOKEN = process.env.NETLIFY_TOKEN;

    // Validate environment variables
    if (!SHARED_SECRET || !ENCRYPTION_KEY || !NETLIFY_SITE_ID || !NETLIFY_TOKEN) {
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

    const userId = user.id;

    // Verify the OTP
    const isValid = speakeasy.totp.verify({
      secret: SHARED_SECRET,
      encoding: "ascii",
      token: token,
    });

    if (!isValid) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          success: false,
          message: "Invalid OTP",
        }),
      };
    }

    // Generate a new API key (dynamic)
    const newApiKey = crypto.randomBytes(32).toString("hex");

    // Encrypt the new API key
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

    // Return the encrypted API key securely as an HTTP-only cookie
    return {
      statusCode: 200,
      headers: {
        "Set-Cookie": `new_api_key=${encryptedApiKey}; HttpOnly; Secure; SameSite=Strict; Path=/`,
      },
      body: JSON.stringify({
        success: true,
        message: "OTP verified successfully! New API key issued.",
      }),
    };
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Internal server error",
      }),
    };
  }
};
