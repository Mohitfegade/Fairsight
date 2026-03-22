import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, query, where, orderBy } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err) {
    console.error("Sign in error:", err);
    return null;
  }
}

export async function signOutUser() {
  await signOut(auth);
}

export async function saveAudit(userId, fileName, biasResults, geminiResults) {
  try {
    await addDoc(collection(db, "audits"), {
      userId,
      fileName,
      fairnessScore: biasResults.fairnessScore,
      status: biasResults.fairnessScore >= 80 ? "compliant" : 
              biasResults.fairnessScore >= 60 ? "moderate" : "high-risk",
      groupResults: biasResults.groupResults,
      metrics: biasResults.metrics || {},
      geminiSummary: geminiResults?.summary || "",
      regulatoryRisk: geminiResults?.regulatoryRisk || "",
      timestamp: new Date().toISOString(),
      createdAt: Date.now()
    });
  } catch (err) {
    console.error("Save audit error:", err);
  }
}

export async function getAudits(userId) {
  try {
    const q = query(
      collection(db, "audits"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("Get audits error:", err);
    return [];
  }
}
