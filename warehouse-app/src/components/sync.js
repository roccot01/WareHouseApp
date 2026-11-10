// Real-time family sync for Warehouse, backed by Firebase Firestore.
//
// Data layout:  households/{code}/{locations|food|tools|clothing}/{itemId}
// Every item is its own document, so two people editing different items never
// overwrite each other. Firestore's offline cache keeps the app usable without
// signal and syncs when the connection returns.
//
// Config comes from Vite env vars (see env.example). Without them the app
// simply stays in local-only mode.

import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import {
  initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager,
  doc, getDoc, setDoc, deleteDoc, collection, onSnapshot, writeBatch,
} from "firebase/firestore";

const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

export const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
export const COLLECTIONS = ["locations", "food", "tools", "clothing"];

let dbPromise = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
      await signInAnonymously(getAuth(app));
      try {
        return initializeFirestore(app, {
          localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
          ignoreUndefinedProperties: true,
        });
      } catch {
        // Already initialised (e.g. Vite hot reload re-ran this module): reuse that instance.
        return getFirestore(app);
      }
    })();
    // If sign-in fails (e.g. offline on first launch) allow a clean retry later.
    dbPromise.catch(() => { dbPromise = null; });
  }
  return dbPromise;
}

// 10 characters from a 32-letter alphabet (no I/O/0/1) ≈ 50 bits: hard to guess.
export function generateCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export async function householdExists(code) {
  const db = await getDb();
  const snap = await getDoc(doc(db, "households", code));
  return snap.exists();
}

// Creates the household and uploads the data currently on this device.
export async function createHousehold(code, seed) {
  const db = await getDb();
  await setDoc(doc(db, "households", code), { createdAt: Date.now() });

  const writes = [];
  for (const col of COLLECTIONS) {
    for (const item of seed[col] || []) writes.push([col, item]);
  }
  for (let i = 0; i < writes.length; i += 400) {
    const batch = writeBatch(db);
    writes.slice(i, i + 400).forEach(([col, item]) => {
      batch.set(doc(db, "households", code, col, item.id), item);
    });
    await batch.commit();
  }
}

// Live listeners: onData(collectionName, items) fires immediately for local
// changes and again whenever anyone else in the family changes something.
// Resolves to a function that stops all listeners.
export async function subscribe(code, onData, onError) {
  const db = await getDb();
  const stops = COLLECTIONS.map((col) =>
    onSnapshot(
      collection(db, "households", code, col),
      (snap) => onData(col, snap.docs.map((d) => d.data())),
      onError,
    ),
  );
  return () => stops.forEach((stop) => stop());
}

export async function setItem(code, col, item) {
  const db = await getDb();
  await setDoc(doc(db, "households", code, col, item.id), item);
}

export async function removeItem(code, col, id) {
  const db = await getDb();
  await deleteDoc(doc(db, "households", code, col, id));
}