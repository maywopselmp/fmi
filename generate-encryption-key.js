const fs = require("fs");
const crypto = require("crypto");
const path = require("path");

// Path to the .env file
const envFilePath = path.resolve(__dirname, ".env");

// Check if the .env file exists; create it if it doesn't
if (!fs.existsSync(envFilePath)) {
  fs.writeFileSync(envFilePath, ""); // Create an empty .env file
}

// Read the contents of the .env file
let envFileContent = fs.readFileSync(envFilePath, "utf8");

// Check if ENCRYPTION_KEY already exists
if (!envFileContent.includes("ENCRYPTION_KEY=")) {
  // Generate a new 32-byte encryption key
  const encryptionKey = crypto.randomBytes(32).toString("hex");

  // Append the key to the .env file
  fs.appendFileSync(envFilePath, `\nENCRYPTION_KEY=${encryptionKey}\n`);
  console.log("Generated new ENCRYPTION_KEY and saved to .env file.");
} else {
  console.log("ENCRYPTION_KEY already exists in .env file.");
}
