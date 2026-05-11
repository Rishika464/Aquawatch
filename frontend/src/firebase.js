import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyByTNIHyVcGFtg6cuR27ezq2bCfQJDkqw8",
  authDomain: "cloud-project-74451-495908.firebaseapp.com",
  projectId: "cloud-project-74451-495908",
  storageBucket: "cloud-project-74451-495908.firebasestorage.app",
  messagingSenderId: "245298990451",
  appId: "1:245298990451:web:6a8db998a9432aa8a34906"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;
