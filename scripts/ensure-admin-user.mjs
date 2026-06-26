import { readFileSync } from "node:fs";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const ADMIN_EMAIL = "aroobaadmin123@gmail.com";
const ADMIN_PASSWORD = "admin123";

function loadDotEnv(path) {
  const env = {};
  const text = readFileSync(path, "utf8");

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const equalIndex = line.indexOf("=");
    if (equalIndex === -1) continue;

    const key = line.slice(0, equalIndex).trim();
    let value = line.slice(equalIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }

  return env;
}

const env = { ...loadDotEnv(".env.local"), ...process.env };
const privateKey = String(env.FIREBASE_PRIVATE_KEY || "")
  .replace(/\\n/g, "\n")
  .replace(/,\s*$/, "");

if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !privateKey) {
  throw new Error("Missing Firebase admin env values in .env.local");
}

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

const auth = getAuth();
const db = getFirestore();

let user;
try {
  user = await auth.getUserByEmail(ADMIN_EMAIL);
  user = await auth.updateUser(user.uid, {
    password: ADMIN_PASSWORD,
    emailVerified: true,
    disabled: false,
    displayName: "Admin",
  });
  console.log(`Updated admin Firebase Auth user: ${ADMIN_EMAIL}`);
} catch (error) {
  if (error?.code !== "auth/user-not-found") throw error;
  user = await auth.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    emailVerified: true,
    disabled: false,
    displayName: "Admin",
  });
  console.log(`Created admin Firebase Auth user: ${ADMIN_EMAIL}`);
}

await db.collection("users").doc(user.uid).set(
  {
    uid: user.uid,
    name: "Admin",
    email: ADMIN_EMAIL,
    role: "exchanger",
    roles: ["exchanger"],
    emailVerified: true,
    credits: 0,
    admin: true,
    updatedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
  },
  { merge: true },
);

console.log("Admin Firestore user document is ready.");
console.log("You can sign in with:");
console.log(`Email: ${ADMIN_EMAIL}`);
console.log(`Password: ${ADMIN_PASSWORD}`);
