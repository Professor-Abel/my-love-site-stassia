// auth-wishes.js
// Авторизация + Firestore + глобальная отправка мыслей/скучаю/желаний

// ================= FIREBASE IMPORTS =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

import {
  getFirestore,
  addDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
  setDoc,
  doc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ================= FIREBASE CONFIG =================
const firebaseConfig = {
  apiKey: "AIzaSyCbgO8b96hAGU3kvwkjsv1x1Is-879Mbgc",
  authDomain: "asyaman-40f1f.firebaseapp.com",
  projectId: "asyaman-40f1f",
  storageBucket: "asyaman-40f1f.appspot.com",
  messagingSenderId: "780594675672",
  appId: "1:780594675672:web:27766d673b4255a281bcad",
  measurementId: "G-LBMZLEY4Y5"
};

// ================= ADMIN UID =================
const ADMIN_UID = "QgvеUKbsJLU0A3oehvXgTEbTg1S2";

// ================= INIT =================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

let currentUser = null;
window.__currentUser = null;

// =====================================================
// GLOBAL SEND FUNCTION (Мысли, Скучаю, Желания)
// =====================================================
window.saveEntryToFirestore = async function (collectionName, text) {
  const user = auth.currentUser;
  if (!user) return;

  try {
    await addDoc(collection(db, collectionName), {
      uid: user.uid,
      email: user.email || null,
      text,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.error("Ошибка отправки в Firestore:", err);
  }
};

// =====================================================
// LOAD ENTRIES FOR USER (THOUGHTS / MISSMOMENTS)
// =====================================================
window.loadMyEntries = async function (collectionName) {
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const q = query(
      collection(db, collectionName),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);
    const result = [];

    snap.forEach((docSnap) => {
      const d = docSnap.data();
      result.push({
        text: d.text,
        date: d.createdAt?.toDate?.().toLocaleString("ru-RU")
      });
    });

    return result;
  } catch (e) {
    console.error("Ошибка loadMyEntries:", e);
    return [];
  }
};

// =====================================================
// ======= UI ELEMENTS (LOGIN / WISHES / PANELS) =======
// =====================================================
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const emailRegisterBtn = document.getElementById("emailRegisterBtn");
const emailLoginBtn = document.getElementById("emailLoginBtn");
const googleBtn = document.getElementById("googleBtn");

const authTitle = document.getElementById("auth-title");
const welcomeText = document.getElementById("welcome-text");
const authArea = document.getElementById("auth-area");
const authStatus = document.getElementById("auth-status");
const authForm = document.querySelector(".auth-form");

const privateContent = document.getElementById("private-content");
const adminPanel = document.getElementById("admin-panel");

const wishInput = document.getElementById("wishInput");
const addWishBtn = document.getElementById("addWishBtn");
const clearWishesBtn = document.getElementById("clearWishesBtn");
const wishList = document.getElementById("wishList");
const wishCount = document.getElementById("wishCount");

const settingsAccountInfo = document.getElementById("settingsAccountInfo");

// =====================================================
// ===== UI HELPERS =====
// =====================================================
function setAuthStatus(message, type = "") {
  if (!authStatus) return;
  authStatus.textContent = message;
  authStatus.className = "";
  if (type) authStatus.classList.add(type);
}

// =====================================================
// ===== LOAD WISHES =====
// =====================================================
async function loadWishes() {
  if (!currentUser || !wishList) return;

  try {
    const q = query(
      collection(db, "wishes"),
      where("uid", "==", currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);
    let html = "";
    snap.forEach((docSnap) => {
      const w = docSnap.data();
      html += `<li><span>${w.text}</span></li>`;
    });

    wishList.innerHTML = html || "<li>Пока пусто 💭</li>";
    wishCount.textContent = snap.size;
  } catch (e) {
    console.error("Ошибка загрузки желаний:", e);
  }
}

// =====================================================
// ===== ADD WISH =====
// =====================================================
async function addWish() {
  if (!currentUser) {
    setAuthStatus("Войди, чтобы сохранять желания 💌", "bad");
    return;
  }

  const text = wishInput.value.trim();
  if (!text) return;

  try {
    await addDoc(collection(db, "wishes"), {
      text,
      uid: currentUser.uid,
      email: currentUser.email || null,
      createdAt: serverTimestamp()
    });

    wishInput.value = "";
    setAuthStatus("Желание сохранено ✨", "good");
    loadWishes();
  } catch (err) {
    console.error("Ошибка добавления:", err);
    setAuthStatus("Ошибка сохранения 💔", "bad");
  }
}

// =====================================================
// ===== AUTH STATE =====
// =====================================================
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    window.__currentUser = user;

    if (authForm) authForm.style.display = "none";
    if (privateContent) privateContent.style.opacity = "1";

    loadWishes();
    updateSettingsUI();
  } else {
    currentUser = null;
    window.__currentUser = null;

    if (authForm) authForm.style.display = "block";
    if (privateContent) privateContent.style.opacity = "0.3";
  }
});

// =====================================================
// ===== REGISTER / LOGIN / LOGOUT =====
// =====================================================
if (emailRegisterBtn) {
  emailRegisterBtn.onclick = async () => {
    try {
      await createUserWithEmailAndPassword(
        auth,
        emailInput.value.trim(),
        passwordInput.value.trim()
      );
    } catch (err) {
      setAuthStatus(err.message, "bad");
    }
  };
}

if (emailLoginBtn) {
  emailLoginBtn.onclick = async () => {
    try {
      await signInWithEmailAndPassword(
        auth,
        emailInput.value.trim(),
        passwordInput.value.trim()
      );
    } catch (err) {
      setAuthStatus(err.message, "bad");
    }
  };
}

if (googleBtn) {
  googleBtn.onclick = () => signInWithPopup(auth, provider);
}

// =====================================================
// ===== WISH BUTTONS =====
// =====================================================
if (addWishBtn) addWishBtn.onclick = addWish;

if (clearWishesBtn) {
  clearWishesBtn.onclick = () =>
    alert("Очистку желаний сделаем позже 🛠");
}

// =====================================================
// SETTINGS PANEL
// =====================================================
function updateSettingsUI() {
  if (!settingsAccountInfo) return;

  if (currentUser)
    settingsAccountInfo.textContent = currentUser.email;
  else
    settingsAccountInfo.textContent = "Гость";
}
