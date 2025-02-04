const speakeasy = require("speakeasy");

exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  const token = body.token;

  // Retrieve the shared secret from environment variables
  const sharedSecret = process.env.SHARED_SECRET;

  // Verify the OTP
  const isValid = speakeasy.totp.verify({
    secret: sharedSecret,
    encoding: "ascii",
    token: token,
  });

  if (isValid) {
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "OTP verified successfully!" }),
    };
  } else {
    return {
      statusCode: 401,
      body: JSON.stringify({ success: false, message: "Invalid OTP" }),
    };
  }
};
