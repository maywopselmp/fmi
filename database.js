// database.js
const mongoose = require("mongoose");

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define the User schema
const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  apiKey: { type: String, default: null }, // Current active API key
  newApiKey: { type: String, default: null }, // New API key (inactive until logout)
  sessionId: { type: String, default: null }, // Session ID
});

const User = mongoose.model("User", userSchema);

// Function to retrieve user data by userId
async function getDatabase(userId) {
  return await User.findOne({ userId }).exec();
}

// Function to store the initial API key
async function storeInitialApiKey(userId, apiKey) {
  const sessionId = generateSessionId();
  await User.updateOne(
    { userId },
    { apiKey, sessionId },
    { upsert: true }
  ).exec();
}

// Function to store a new API key
async function storeNewApiKey(userId, apiKey, options = { isActive: false }) {
  await User.updateOne(
    { userId },
    { newApiKey: apiKey, isApiKeyActive: options.isActive }
  ).exec();
}

// Function to invalidate the old API key
async function invalidateOldApiKey(userId) {
  await User.updateOne({ userId }, { apiKey: null }).exec();
}

// Function to activate the new API key
async function activateNewApiKey(userId) {
  await User.updateOne(
    { userId },
    { apiKey: "$newApiKey", isApiKeyActive: true, newApiKey: null }
  ).exec();
}

// Function to end the session
async function endSession(userId) {
  await User.updateOne({ userId }, { sessionId: null }).exec();
}

// Helper function to generate a unique session ID
function generateSessionId() {
  return Math.random().toString(36).substring(2, 15); // Random alphanumeric string
}

// Export the database functions
module.exports = {
  getDatabase,
  storeInitialApiKey,
  storeNewApiKey,
  invalidateOldApiKey,
  activateNewApiKey,
  endSession,
};
