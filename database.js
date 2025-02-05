// database.js
const mongoose = require("mongoose");

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define the API Key schema
const apiKeySchema = new mongoose.Schema({
  apiKey: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true }, // Indicates if the API key is active
  createdAt: { type: Date, default: Date.now },
});

const ApiKey = mongoose.model("ApiKey", apiKeySchema);

// Function to generate and store a new API key
async function generateApiKey() {
  const apiKey = crypto.randomBytes(32).toString("hex");
  await ApiKey.create({ apiKey });
  return apiKey;
}

// Function to validate an API key
async function validateApiKey(apiKey) {
  const key = await ApiKey.findOne({ apiKey, isActive: true }).exec();
  return !!key; // Returns true if the API key exists and is active
}

// Function to invalidate an API key
async function invalidateApiKey(apiKey) {
  await ApiKey.updateOne({ apiKey }, { isActive: false }).exec();
}

// Export the functions
module.exports = {
  generateApiKey,
  validateApiKey,
  invalidateApiKey,
};
