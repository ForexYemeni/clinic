/**
 * Firestore Data Export Script
 * Exports all collections from Firestore to JSON files
 * Usage: node scripts/export-firestore.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin with default config
const serviceAccount = {
  projectId: "clinic-number-1",
  clientEmail: "firebase-adminsdk-fbsvc@clinic-number-1.iam.gserviceaccount.com",
  privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCXChq7E+zPXqhp\nV0xyaBXkgV15uIfjXEfT8QJKxzjt5JU30XFjbVbh0rGnguqXMP7HzlrU+UD2Lcfi\nZumGN2nXQ2Z8iejCgwgwbvTMaQi4bg5EHoDBpTMhqzs+zzvzEoYekXjeQfgiaTgr\nY4WIKOG8oLTz/hfMR01Ik3C+dsJuUi2OKdORzAZ8MD4nzUWw3pLi2xcTm9XvfGrP\nIomkRnnWGQXfZ4mqomtuG6bbQnPSP+qSvq6lQL8fpYIOFfBm3SSajBWzJZ1IZi9K\nYa6x0QjU7oR8AJdeaPqnOASAT+bWcAJeRxfs3iGXLQjfoFGKVofyEDcEufqun8Ca\n9yNzAXkPAgMBAAECggEAK60s2K9k2fyV98xaW3UU65yrMsE1bn5nePbnQkeFA2oH\n6nnC780VBD2AyR93BhyReKcIJjEj42yOsj4vRnQsw6aGcvoQWHs6uYLEgH3ZGzgc\nIP+vHRBQDmrtOXcE74AKT7mieacbAZxqtUVUvnCQApN4cFwodpah1xxnzHQcOnlQ\nXVMC8fqEAEGtqgIN02szflGJ9KL6aL4rKGVSEuOLeIC/6d5X7VtykN+Wd2VYxEp9\ntD3HVPjL91wQW1JYFTVGcktiBpqp9lc61vBDWtkoA5PSAKLempkB/dmUcdnp8uzP\nSJuZYwvRm6zeTxNqtfau8Q2iKVRnrmt9Bvuc1doqqQKBgQDHek02X/2goI0sTka/\nG776J2LBDyqg4VVnWOy2dBq9+uWYvijY+aiM9bQQbLB+pT5s+AiC4mAKzgv2kUvL\nxxrSSy5KIO0Xv3FyqmvLsJLXqo3Ww/kpq7B1kv7LqCwPzzH37LZ0UIIo8Hx1I5kb\niGpwt7IBfs5+eMqGhTC0yvnk1wKBgQDB1jEhiMCIMuP7+juJkXShtwg91dp7hj7l\ntYsoDOY/7MkZD2kfQnsfeVraAblPwnvT0SuFqw+lZZkkucNEyUq2HTn0Jl54z2sz\ndDMMOTh63qO9IdxHuiRatK+hchnqBd/hGl1Xh+RAyqRdrPF48ucPasYENI8tT7uH\nQDdEtsfOiQKBgBXQgyciIjtxs16YBNabcywqKHuSbAgB/HP73o8pbU8/Y+JrUU5B\nJzSbHiD5sed3rLb//PZLSVOFKvvA8fgMAxviSuKibSs+rWprxrQU0EozhaVp8xKi\niv6gn6qn7oGgGAfT5DQeJc3SVtn8lZ7UMUe4XwgY1P4xuXwyjpwG4oMrAoGAYPAE\nfBfO6Y5B0/ctpTvYDzPg7EOx0wqtE+X5pNrmn1uEqoK5eMefmXrwQ4yPJ2NE2AaI\ndH27AmVP9Dzuec0NDwyIuiAiKNraas4W5WsMYu5LBsATUM+3dKFeIChW62FquEGe\nIrM0JG7zSmG+FVWs1ln4k4vResCgMSCdQ0EBpbkCgYABb7PKD/zQI0y02WMu4wwy\n5t1L11LrXWjZVaeSm5lP6EBKX/yfxbb7v2KWp6DvasvlMlGHITFlisKa/BPbapu0\nrqwjJxEZ9Y88kkVqnTCuKocBk8nDXFLz7qnQ98eNl6QhZuutVXNp3qwqvNsPtyvK\nTXVdAAyuqVhid0hKfsNVLg==\n-----END PRIVATE KEY-----\n",
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.projectId,
});

const db = admin.firestore();

// All known collections
const COLLECTIONS = [
  'users',
  'clinics',
  'patients',
  'visits',
  'invoices',
  'services',
  'emergencies',
  'salary_advances',
  'salary_payments',
  'financial_transactions',
  'activity_logs',
  'notifications',
  'platform',
];

const OUTPUT_DIR = path.join(__dirname, '..', 'backup', 'firestore-data');

async function exportCollection(collectionName) {
  console.log(`Exporting collection: ${collectionName}...`);
  try {
    const snapshot = await db.collection(collectionName).get();
    const docs = [];

    snapshot.forEach((doc) => {
      docs.push({
        id: doc.id,
        data: doc.data(),
      });
    });

    console.log(`  Found ${docs.length} documents in ${collectionName}`);
    return docs;
  } catch (error) {
    console.warn(`  Warning: Could not export ${collectionName}: ${error.message}`);
    return [];
  }
}

async function exportSubCollections(parentPath) {
  const subCollections = await db.doc(parentPath).listCollections();
  const allData = {};

  for (const subCol of subCollections) {
    const subPath = `${parentPath}/${subCol.id}`;
    console.log(`  Exporting sub-collection: ${subPath}`);
    const snapshot = await subCol.get();
    const docs = [];
    snapshot.forEach((doc) => {
      docs.push({ id: doc.id, data: doc.data() });
    });
    if (docs.length > 0) {
      allData[subCol.id] = docs;
    }
  }

  return allData;
}

async function main() {
  console.log('========================================');
  console.log('  Firestore Complete Data Export');
  console.log('========================================\n');

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const exportSummary = {
    exportDate: new Date().toISOString(),
    projectId: serviceAccount.projectId,
    collections: {},
  };

  for (const colName of COLLECTIONS) {
    const docs = await exportCollection(colName);

    if (docs.length > 0) {
      // Also check for sub-collections on each document
      for (const doc of docs) {
        const subData = await exportSubCollections(`${colName}/${doc.id}`);
        if (Object.keys(subData).length > 0) {
          doc.subCollections = subData;
        }
      }
    }

    // Save collection to file
    const filePath = path.join(OUTPUT_DIR, `${colName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf-8');

    exportSummary.collections[colName] = {
      documentCount: docs.length,
      hasSubCollections: docs.some(d => d.subCollections && Object.keys(d.subCollections).length > 0),
    };
  }

  // Also discover any collections we might have missed
  console.log('\nDiscovering additional collections...');
  try {
    const allCollections = await db.listCollections();
    for (const col of allCollections) {
      if (!COLLECTIONS.includes(col.id)) {
        console.log(`Found additional collection: ${col.id}`);
        const docs = await exportCollection(col.id);
        if (docs.length > 0) {
          const filePath = path.join(OUTPUT_DIR, `${col.id}.json`);
          fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf-8');
          exportSummary.collections[col.id] = { documentCount: docs.length, discovered: true };
        }
      }
    }
  } catch (error) {
    console.warn('Could not list all collections:', error.message);
  }

  // Save export summary
  const summaryPath = path.join(OUTPUT_DIR, '_export-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(exportSummary, null, 2), 'utf-8');

  console.log('\n========================================');
  console.log('  Export Complete!');
  console.log(`  Output: ${OUTPUT_DIR}`);
  console.log(`  Collections: ${Object.keys(exportSummary.collections).length}`);
  console.log('========================================');

  process.exit(0);
}

main().catch((error) => {
  console.error('Export failed:', error);
  process.exit(1);
});
