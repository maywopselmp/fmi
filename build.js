const fs = require("fs");
const path = require("path");

// Path to the index.html file
const indexPath = path.join(__dirname, "index.html");

// Read the index.html file
let indexContent = fs.readFileSync(indexPath, "utf8");

// Replace placeholders with actual values
indexContent = indexContent.replace(
  "const firebaseConfig = {}; // Placeholder replaced by build.js",
  `const firebaseConfig = ${JSON.stringify({
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
  })};`
);

indexContent = indexContent.replace(
  "{{ NETLIFY_BACKEND_URL }}",
  process.env.NETLIFY_BACKEND_URL || "https://earnest-treacle-eded95.netlify.app"
);

// Write the updated content back to index.html
fs.writeFileSync(indexPath, indexContent, "utf8");

console.log("Firebase configuration injected into index.html successfully.");
