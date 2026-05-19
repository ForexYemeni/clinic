// ═══════════════════════════════════════════════════════════
// 🔥 Firebase Admin SDK - Dynamic Configuration Support
// Supports default hardcoded config + dynamic platform config
// ═══════════════════════════════════════════════════════════

import * as admin from 'firebase-admin';

// Default Firebase credentials (existing project)
const DEFAULT_CONFIG = {
  projectId: "clinic-235f1",
  clientEmail: "firebase-adminsdk-fbsvc@clinic-235f1.iam.gserviceaccount.com",
  privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC8w7LYUo6RD/ou\nqpbJDP5MIfcBY/rHwdqli6JuE1l0gtQ0Krt2jqekYrSLOYonSrO2pSJYgxzcKTGm\ndkrG3iC/UbSgmJqXA+DBMQcUSJjsb/9lf5o/j+m5cOLbDhd+Ds+2N+KkXk8c9uJE\nwQZ9H8xOFPgqyJ6x0ZqzmZPHsPPGvb3bAgCoilHIln10homqj2vvIHrXiE8MCnfW\nqmWwTlBmnQyVv+mRjmQX3ihc6l5O07Vy3wnl828SSRH5R95hxHzc+KcHR9+UxxiI\npr1X8w+LNjHKia3kY/mmE8h5r3NjQLzBwz2q7HHengpaVQsGCJBRgmGDJBmdAOsc\n8K2mbs17AgMBAAECggEAAOiiRkdTd2BP0ISyuCIPYVdyhHeyP97vigd7jzMZpaVx\nlxSzlVUHepOdEeSDhT/nUJRH74wmCetK2WXNY1qzZqhiibliWSLEJLnzMkZNMiox\n3Q+5st+i/OkNtodBVrKEjniDZ04q7FVF7pXNTbHm/mM8dJxFo06Cg6XUH8x6x/Sk\nw8ZIjmwWQRBND5Q7rKG/ZId2ydsP5Me7eWVTOsgsd+7QjNZq2hHtbgbtU1emgAMe\n4iVpEeIEXFdMYZ6Jd4PU82vk9IepmPRugafrYHGogAHh8QqIjXJlJPBVAe9IBrnK\ntL8IyXoUKLvt54FtWliHNyIEyFO1QTT31wM6ntZ/bQKBgQDrHpPbu97m/aJDTgiI\nYOf2TLEGs50x0AqFn8iq66cwcfQqIyQzj0onBcGO9TbyAHqDYUrhUO6J/iiWFBF/\nlifu6jVauC3Xsz2t5Ihc60tZMEwq6XOpeacvY6q4OAnri34zZp8dV+IWJDK8GYjT\nX+sWSunIS8aURY5wo88oj1c69wKBgQDNhz5ogqoOk1PfXqWO/QoGpwOvHSSFoOsM\nezP8Z9MkvNktYTBze8BibrqJxQhX44zODHjND3i6mEH6IvIkVOc7YnUY2IpOyMPe\nmglA4+d0F0GzXahmnRZggVBb6CgzC26cZK7ZuPs8pAibY9M6rEwVR7mHfY9bN58R\naUCmtaB8nQKBgQCxUs9q0ocrKTD+l9ShnoxzWqXMixxMHD5DRx3donrmc5sVSIme\nBTyEr7eqbNAyth+wBGmoAxTUqAXOInaMBiA59ROmRu/0FS+4fXpGsgKS0nUvi//6\nWlC30fBInaMFrZ/Rfl0UkVpnHofRC2UBHf88QeWNdXDgFJF37GNpkKnWQwKBgHHo\nfNwrXtjJKnjn2dYPw9jAA7iv7CfrcZnvRnajjFAWIj+WV+YJNizXtabZfrBHOyiP\nnPv5kS3JaPebGpysOaOeA8wLZ0wW1QewU2SVaxfaM92XENgeQ+KkiMcHOhBgS6N9\n4bJlZUjMmMCWaOFh0KESqW7AVg12HEDoFp7Olu25AoGBAMruDuAhMT4ViLPMikxF\nAD5f1lP9KUbAol0tWAFwaIC3B9zUoICgwX+O1CEdgtnz8Lh19UHmUO8H+eKE1xzh\nl5cqC6HzGrL0L4VA0MEGOKSo6BvwJD7zyl8PoD0i84rZM/Lp+yt5+K5WYy8c3ptE\nuh/zosCbHDdpwEK675ZGv1JZ\n-----END PRIVATE KEY-----\n",
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
