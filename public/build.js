const fs = require('fs');

// Load Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATA_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

// Read the template HTML file
const template = fs.readFileSync('template.html', 'utf8');

// Replace placeholders with actual Firebase configuration
const output = template.replace(
  'const firebaseConfig = {};',
  `const firebaseConfig = ${JSON.stringify(firebaseConfig)};`
);

// Write the final HTML file
fs.writeFileSync('public/index.html', output);
