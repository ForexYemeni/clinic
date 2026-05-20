/**
 * Firestore Data Import Script
 * Imports all collections from JSON backup files to Firestore
 * Usage: node scripts/import-firestore.js <path-to-firestore-data-folder>
 * 
 * Environment: Set FIREBASE_SERVICE_ACCOUNT as JSON env var, or it uses default config
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT env var');
    process.exit(1);
  }
} else {
  // Use hardcoded default for initial setup
  console.log('Using default Firebase config. Set FIREBASE_SERVICE_ACCOUNT env for custom projects.');
  serviceAccount = {
    projectId: "clinic-number-1",
    clientEmail: "firebase-adminsdk-fbsvc@clinic-number-1.iam.gserviceaccount.com",
    privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCXChq7E+zPXqhp\nV0xyaBXkgV15uIfjXEfT8QJKxzjt5JU30XFjbVbh0rGnguqXMP7HzlrU+UD2Lcfi\nZumGN2nXQ2Z8iejCgwgwbvTMaQi4bg5EHoDBpTMhqzs+zzvzEoYekXjeQfgiaTgr\nY4WIKOG8oLTz/hfMR01Ik3C+dsJuUi2OKdORzAZ8MD4nzUWw3pLi2xcTm9XvfGrP\nIomkRnnWGQXfZ4mqomtuG6bbQnPSP+qSvq6lQL8fpYIOFfBm3SSajBWzJZ1IZi9K\nYa6x0QjU7oR8AJdeaPqnOASAT+bWcAJeRxfs3iGXLQjfoFGKVofyEDcEufqun8Ca\n9yNzAXkPAgMBAAECggEAK60s2K9k2fyV98xaW3UU65yrMsE1bn5nePbnQkeFA2oH\n6nnC780VBD2AyR93BhyReKcIJjEj42yOsj4vRnQsw6aGcvoQWHs6uYLEgH3ZGzgc\nIP+vHRBQDmrtOXcE74AKT7mieacbAZxqtUVUvnCQApN4cFwodpah1xxnzHQcOnlQ\nXVMC8fqEAEGtqgIN02szflGJ9KL6aL4rKGVSEuOLeIC/6d5X7VtykN+Wd2VYxEp9\ntD3HVPjL91wQW1JYFTVGcktiBpqp9lc61vBDWtkoA5PSAKLempkB/dmUcdnp8uzP\nSJuZYwvRm6zeTxNqtfau8Q2iKVRnrmt9Bvuc1doqqQKBgQDHek02X/2goI0sTka/\nG776J2LBDyqg4VVnWOy2dBq9+uWYvijY+aiM9bQQbLB+pT5s+AiC4mAKzgv2kUvL\nxxrSSy5KIO0Xv3FyqmvLsJLXqo3Ww/kpq7B1kv7LqCwPzzH37LZ0UIIo8Hx1I5kb\niGpwt7IBfs5+eMqGhTC0yvnk1wKBgQDB1jEhiMCIMuP7+juJkXShtwg91dp7hj7l\ntYsoDOY/7MkZD2kfQnsfeVraAblPwnvT0SuFqw+lZZkkucNEyUq2HTn0Jl54z2sz\ndDMMOTh63qO9IdxHuiRatK+hchnqBd/hGl1Xh+RAyqRdrPF48ucPasYENI8tT7uH\nQDdEtsfOiQKBgBXQgyciIjtxs16YBNabcywqKHuSbAgB/HP73o8pbU8/Y+JrUU5B\nJzSbHiD5sed3rLb//PZLSVOFKvvA8fgMAxviSuKibSs+rWprxrQU0EozhaVp8xKi\niv6gn6qn7oGgGAfT5DQeJc3SVtn8lZ7UMUe4XwgY1P4xuXwyjpwG4oMrAoGAYPAE\nfBfO6Y5B0/ctpTvYDzPg7EOx0wqtE+X5pNrmn1uEqoK5eMefmXrwQ4yPJ2NE2AaI\ndH27AmVP9Dzuec0NDwyIuiAiKNraas4W5WsMYu5LBsATUM+3dKFeIChW62FquEGe\nIrM0JG7zSmG+FVWs1ln4k4vResCgMSCdQ0EBpbkCgYABb7PKD/zQI0y02WMu4wwy\n5t1L11LrXWjZVaeSm5lP6EBKX/yfxbb7v2KWp6DvasvlMlGHITFlisKa/BPbapu0\nrqwjJxEZ9Y88kkVqnTCuKocBk8nDXFLz7qnQ98eNl6QhZuutVXNp3qwqvNsPtyvK\nTXVdAAyuqVhid0hKfsNVLg==\n-----END PRIVATE KEY-----\n",
  };
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.projectId,
});

const db = admin.firestore();

async function importSubCollections(parentPath, subCollections) {
  for (const [subColName, docs] of Object.entries(subCollections)) {
    console.log(`    Importing sub-collection: ${subColName} (${docs.length} docs)`);
    for (const doc of docs) {
      const docRef = db.collection(`${parentPath}/${subColName}`).doc(doc.id);
      await docRef.set(doc.data, { merge: true });
    }
  }
}

async function importCollection(collectionName, filePath) {
  console.log(`Importing collection: ${collectionName}...`);
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const docs = JSON.parse(rawData);

  if (!docs || docs.length === 0) {
    console.log(`  No documents to import for ${collectionName}`);
    return 0;
  }

  let imported = 0;
  const batch = db.batch();
  let batchCount = 0;

  for (const doc of docs) {
    const docRef = db.collection(collectionName).doc(doc.id);
    batch.set(docRef, doc.data, { merge: true });
    batchCount++;
    imported++;

    // Firestore batch limit is 500
    if (batchCount >= 450) {
      await batch.commit();
      batchCount = 0;
    }

    // Import sub-collections if present
    if (doc.subCollections) {
      await importSubCollections(`${collectionName}/${doc.id}`, doc.subCollections);
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`  Imported ${imported} documents to ${collectionName}`);
  return imported;
}

async function main() {
  const dataDir = process.argv[2] || path.join(__dirname, '..', 'backup', 'firestore-data');

  console.log('========================================');
  console.log('  Firestore Data Import');
  console.log('========================================\n');
  console.log(`Data directory: ${dataDir}\n`);

  if (!fs.existsSync(dataDir)) {
    console.error(`Data directory not found: ${dataDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json') && !f.startsWith('_'));
  console.log(`Found ${files.length} collection files to import\n`);

  // Ask for confirmation
  console.log('⚠️  WARNING: This will write data to your Firestore database!');
  console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));

  let totalImported = 0;
  for (const file of files) {
    const collectionName = file.replace('.json', '');
    const filePath = path.join(dataDir, file);
    const count = await importCollection(collectionName, filePath);
    totalImported += count;
  }

  console.log('\n========================================');
  console.log('  Import Complete!');
  console.log(`  Total documents imported: ${totalImported}`);
  console.log('========================================');

  process.exit(0);
}

main().catch((error) => {
  console.error('Import failed:', error);
  process.exit(1);
});
