// ═══════════════════════════════════════════════════════════
// 🔥 Firebase Admin SDK - Dynamic Configuration Support
// Supports default hardcoded config + dynamic platform config
// ═══════════════════════════════════════════════════════════

import * as admin from 'firebase-admin';

// Default Firebase credentials (existing project)
const DEFAULT_CONFIG = {
  projectId: "clinic-number-1",
  clientEmail: "firebase-adminsdk-fbsvc@clinic-number-1.iam.gserviceaccount.com",
  privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCXChq7E+zPXqhp\nV0xyaBXkgV15uIfjXEfT8QJKxzjt5JU30XFjbVbh0rGnguqXMP7HzlrU+UD2Lcfi\nZumGN2nXQ2Z8iejCgwgwbvTMaQi4bg5EHoDBpTMhqzs+zzvzEoYekXjeQfgiaTgr\nY4WIKOG8oLTz/hfMR01Ik3C+dsJuUi2OKdORzAZ8MD4nzUWw3pLi2xcTm9XvfGrP\nIomkRnnWGQXfZ4mqomtuG6bbQnPSP+qSvq6lQL8fpYIOFfBm3SSajBWzJZ1IZi9K\nYa6x0QjU7oR8AJdeaPqnOASAT+bWcAJeRxfs3iGXLQjfoFGKVofyEDcEufqun8Ca\n9yNzAXkPAgMBAAECggEAK60s2K9k2fyV98xaW3UU65yrMsE1bn5nePbnQkeFA2oH\n6nnC780VBD2AyR93BhyReKcIJjEj42yOsj4vRnQsw6aGcvoQWHs6uYLEgH3ZGzgc\nIP+vHRBQDmrtOXcE74AKT7mieacbAZxqtUVUvnCQApN4cFwodpah1xxnzHQcOnlQ\nXVMC8fqEAEGtqgIN02szflGJ9KL6aL4rKGVSEuOLeIC/6d5X7VtykN+Wd2VYxEp9\ntD3HVPjL91wQW1JYFTVGcktiBpqp9lc61vBDWtkoA5PSAKLempkB/dmUcdnp8uzP\nSJuZYwvRm6zeTxNqtfau8Q2iKVRnrmt9Bvuc1doqqQKBgQDHek02X/2goI0sTka/\nG776J2LBDyqg4VVnWOy2dBq9+uWYvijY+aiM9bQQbLB+pT5s+AiC4mAKzgv2kUvL\nxxrSSy5KIO0Xv3FyqmvLsJLXqo3Ww/kpq7B1kv7LqCwPzzH37LZ0UIIo8Hx1I5kb\niGpwt7IBfs5+eMqGhTC0yvnk1wKBgQDB1jEhiMCIMuP7+juJkXShtwg91dp7hj7l\ntYsoDOY/7MkZD2kfQnsfeVraAblPwnvT0SuFqw+lZZkkucNEyUq2HTn0Jl54z2sz\ndDMMOTh63qO9IdxHuiRatK+hchnqBd/hGl1Xh+RAyqRdrPF48ucPasYENI8tT7uH\nQDdEtsfOiQKBgBXQgyciIjtxs16YBNabcywqKHuSbAgB/HP73o8pbU8/Y+JrUU5B\nJzSbHiD5sed3rLb//PZLSVOFKvvA8fgMAxviSuKibSs+rWprxrQU0EozhaVp8xKi\niv6gn6qn7oGgGAfT5DQeJc3SVtn8lZ7UMUe4XwgY1P4xuXwyjpwG4oMrAoGAYPAE\nfBfO6Y5B0/ctpTvYDzPg7EOx0wqtE+X5pNrmn1uEqoK5eMefmXrwQ4yPJ2NE2AaI\ndH27AmVP9Dzuec0NDwyIuiAiKNraas4W5WsMYu5LBsATUM+3dKFeIChW62FquEGe\nIrM0JG7zSmG+FVWs1ln4k4vResCgMSCdQ0EBpbkCgYABb7PKD/zQI0y02WMu4wwy\n5t1L11LrXWjZVaeSm5lP6EBKX/yfxbb7v2KWp6DvasvlMlGHITFlisKa/BPbapu0\nrqwjJxEZ9Y88kkVqnTCuKocBk8nDXFLz7qnQ98eNl6QhZuutVXNp3qwqvNsPtyvK\nTXVdAAyuqVhid0hKfsNVLg==\n-----END PRIVATE KEY-----\n",
};

// Initialize the default Firebase Admin app
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: DEFAULT_CONFIG.projectId,
      clientEmail: DEFAULT_CONFIG.clientEmail,
      privateKey: DEFAULT_CONFIG.privateKey,
    }),
    projectId: DEFAULT_CONFIG.projectId,
  });
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();

// ═══ Dynamic Firebase App Management ═══
// Support for additional Firebase projects

let dynamicApp: admin.app.App | null = null;
let dynamicDb: FirebaseFirestore.Firestore | null = null;

interface FirebaseServiceAccount {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

export async function initializeDynamicFirebase(serviceAccount: FirebaseServiceAccount): Promise<FirebaseFirestore.Firestore> {
  try {
    // Delete existing dynamic app if any
    if (dynamicApp) {
      try { await dynamicApp.delete(); } catch {}
    }

    // Create new app with custom name
    dynamicApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: serviceAccount.projectId,
        clientEmail: serviceAccount.clientEmail,
        privateKey: serviceAccount.privateKey,
      }),
      projectId: serviceAccount.projectId,
    }, 'dynamic-clinic-app');

    dynamicDb = dynamicApp.firestore();
    return dynamicDb;
  } catch (error) {
    console.error('Dynamic Firebase init error:', error);
    throw error;
  }
}

export function getDynamicDb(): FirebaseFirestore.Firestore | null {
  return dynamicDb;
}

// Get the appropriate Firestore instance based on config
export function getDb(clinicId?: string): FirebaseFirestore.Firestore {
  // For now, always use default DB
  // In future, can route different clinics to different Firebase projects
  return adminDb;
}
