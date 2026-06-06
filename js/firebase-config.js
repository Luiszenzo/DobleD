// Firebase SDK modules via official GStatic CDN (ESM)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Tu configuración de Firebase para la web app "Doble D"
const firebaseConfig = {
  apiKey: "AIzaSyD2ZAFjML2bnK31zCrkgA26Zd-RrE3ZOPA",
  authDomain: "doble-d-57304.firebaseapp.com",
  projectId: "doble-d-57304",
  storageBucket: "doble-d-57304.firebasestorage.app",
  messagingSenderId: "98156551555",
  appId: "1:98156551555:web:c55a475c19ab33ca4ceab6",
  measurementId: "G-7M6RY08TCH"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// Exportar base de datos y analytics
export { db, analytics };
