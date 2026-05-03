import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from './firebase';

export async function testFirestoreConnection() {
  try {
    // Attempt to read a dummy document to verify connection
    // We don't need it to exist, just to see if we get a permission or connection error
    await getDocFromServer(doc(db, 'system_meta', 'connection_test'));
    console.log("Firestore connection verified.");
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. You might be offline or project is not provisioned correctly.");
    } else {
        console.warn("Connection test completed (may have 403 if rules are strict, which is expected for dummy path).");
    }
  }
}
