// auth-wishes.js
// Авторизация (Firebase) + логика желаний (Firestore)

// ==== ИМПОРТЫ ИЗ FIREBASE (CDN) ====
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

// ==== КОНФИГ FIREBASE ====
const firebaseConfig = {
  apiKey: "AIzaSyCbgO8b96hAGU3kvwkjsv1x1Is-879Mbgc",
  authDomain: "asyaman-40f1f.firebaseapp.com",
  projectId: "asyaman-40f1f",
  storageBucket: "asyaman-40f1f.firebasestorage.com@",
  messagingSenderId: "780594675672",
  appId: "1:780594675672:web:27766d673b4255a281bcad",
  measurementId: "G-LBMZLEY4Y5"
};

// ТОЛЬКО ты — админ
const ADMIN_UID = "QgvеUKbsJLU0A3oehvXgTEbTg1S2";

// ==== ИНИЦИАЛИЗАЦИЯ FIREBASE ====
const app      = initializeApp(firebaseConfig);
const auth     = getAuth(app);
const db       = getFirestore(app);
const provider = new GoogleAuthProvider();

// Текущий пользователь
let currentUser = null;
window.__currentUser = null;

// =====================================================
// ███  ХЕЛПЕРЫ ДЛЯ СОХРАНЕНИЯ В FIRESTORE
// =====================================================

// Сохранить запись в любую коллекцию
async function saveEntryToFirestore(collectionName, text) {
  const user = auth.currentUser;
  if (!user) return;

  try {
    await addDoc(collection(db, collectionName), {
      uid: user.uid,
      email: user.email || null,
      text,
      deleted: false,
      createdAt: serverTimestamp()
    });
  } catch (e) {
    console.error("Ошибка записи в Firestore:", e);
  }
}

// Загрузить записи текущего пользователя
async function loadMyEntries(collectionName) {
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const q = query(
      collection(db, collectionName),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    const list = [];
    snap.forEach(docSnap => {
      const data = docSnap.data();
      if (data.text) list.push(data.text);
    });
    return list;
  } catch (e) {
    console.error("Ошибка чтения из Firestore:", e);
    return [];
  }
}

// Делаем доступным для других файлов
window.saveEntryToFirestore = saveEntryToFirestore;
window.loadMyEntries = loadMyEntries;

// =====================================================
// ███  МАРКИРОВКА ЗАПИСИ КАК "DELETED"
// =====================================================

async function markEntryDeleted(collectionName, text) {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const q = query(
      collection(db, collectionName),
      where("uid", "==", user.uid),
      where("text", "==", text)
    );

    const snap = await getDocs(q);

    snap.forEach(async (docSnap) => {
      await setDoc(
        doc(db, collectionName, docSnap.id),
        { deleted: true },
        { merge: true }
      );
    });

  } catch (e) {
    console.error("Ошибка пометки удаления:", e);
  }
}

window.markEntryDeleted = markEntryDeleted;

// =====================================================
// ███  СПЕЦИАЛЬНЫЕ ХЕЛПЕРЫ ДЛЯ МЫСЛЕЙ
// =====================================================

window.saveThoughtToFirestore = (text) =>
  saveEntryToFirestore("asyaman_thoughts", text);

window.markThoughtDeleted = (text) =>
  markEntryDeleted("asyaman_thoughts", text);

// =====================================================
// ███  ЭЛЕМЕНТЫ АВТОРИЗАЦИИ
// =====================================================

const emailInput       = document.getElementById("emailInput");
const passwordInput    = document.getElementById("passwordInput");
const emailRegisterBtn = document.getElementById("emailRegisterBtn");
const emailLoginBtn    = document.getElementById("emailLoginBtn");
const googleBtn        = document.getElementById("googleBtn");

const authTitle    = document.getElementById("auth-title");
const welcomeText  = document.getElementById("welcome-text");
const authArea     = document.getElementById("auth-area");
const authStatus   = document.getElementById("auth-status");
const authForm     = document.querySelector(".auth-form");

const privateContent = document.getElementById("private-content");
const adminPanel     = document.getElementById("admin-panel");

// =====================================================
// ███  ЖЕЛАНИЯ
// =====================================================
const wishInput      = document.getElementById("wishInput");
const addWishBtn     = document.getElementById("addWishBtn");
const clearWishesBtn = document.getElementById("clearWishesBtn");
const wishList       = document.getElementById("wishList");
const wishCount      = document.getElementById("wishCount");

// =====================================================
// ███  ПАНЕЛЬ НАСТРОЕК
// =====================================================

const settingsAccountInfo   = document.getElementById("settingsAccountInfo");
const settingsAdminSection  = document.querySelector(".settings-section--admin");
const settingsAdminBtn      = document.getElementById("settingsAdminBtn");

function updateSettingsUI() {
  const isAdmin = currentUser && currentUser.uid === ADMIN_UID;

  if (settingsAccountInfo) {
    settingsAccountInfo.textContent = currentUser
      ? currentUser.email || "Авторизованный пользователь"
      : "Гость (зайди в дневник)";
  }

  if (settingsAdminSection) {
    settingsAdminSection.style.display = isAdmin ? "block" : "none";
  }

  if (settingsAdminBtn && adminPanel) {
    settingsAdminBtn.onclick = () => {
      adminPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    };
  }
}

// =====================================================
// ███  ЗАГРУЗКА ЖЕЛАНИЙ
// =====================================================
async function loadWishes() {
  const uid = currentUser?.uid;
  if (!uid || !wishList || !wishCount) return;

  try {
    const q = query(
      collection(db, "wishes"),
      where("uid", "==", uid),
      orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);
    let html = "";
    snap.forEach(docSnap => {
      const w = docSnap.data();
      html += `<li><span>${w.text}</span></li>`;
    });

    wishList.innerHTML = html || "<li>Пока пусто 💭</li>";
    wishCount.textContent = snap.size;
  } catch (e) {
    console.error("Ошибка загрузки желаний:", e);
    wishList.innerHTML = "<li>Не удалось загрузить 💔</li>";
    wishCount.textContent = "0";
  }
}

// =====================================================
// ███  СОХРАНЕНИЕ ЖЕЛАНИЯ
// =====================================================
async function addWish() {
  if (!wishInput) return;
  const text = wishInput.value.trim();
  if (!text) return;

  const uid = currentUser?.uid;
  if (!uid) {
    setAuthStatus("Войдите, чтобы сохранять желания 💌", "bad");
    return;
  }

  try {
    await addDoc(collection(db, "wishes"), {
      text,
      uid,
      createdAt: serverTimestamp()
    });

    wishInput.value = "";
    setAuthStatus("Желание сохранено ✨", "good");
    await loadWishes();
  } catch (err) {
    console.error("Ошибка сохранения:", err);
    setAuthStatus("Ошибка 💔", "bad");
  }
}

// =====================================================
// ███  РЕНДЕР ПОЛЬЗОВАТЕЛЯ
// =====================================================
async function renderLoggedInUser(user) {
  currentUser = user;
  window.__currentUser = user;

  const isAdmin = user.uid === ADMIN_UID;

  if (isAdmin) document.body.classList.add("is-admin");
  else document.body.classList.remove("is-admin");

  // Профиль
  try {
    await setDoc(
      doc(db, "users", user.uid),
      {
        uid: user.uid,
        email: user.email || null,
        name: user.displayName || null,
        lastLogin: serverTimestamp()
      },
      { merge: true }
    );
  } catch (e) {
    console.error("Ошибка обновления профиля:", e);
  }

  // Визуал
  if (authTitle) {
    authTitle.innerHTML = 'Наш <span>секретный дневник</span> 💫';
  }

  if (welcomeText) {
    welcomeText.textContent = `Привет, ${user.displayName || "моя любовь"} 💖`;
  }

  if (authArea) {
    authArea.innerHTML = `<button class="btn btn-outline" id="logout-btn">Выйти</button>`;
    document.getElementById("logout-btn").onclick = () => signOut(auth);
  }

  if (authForm) authForm.style.display = "none";
  if (privateContent) {
    privateContent.style.opacity = "1";
    privateContent.style.pointerEvents = "auto";
  }

  if (adminPanel) {
    adminPanel.style.display = isAdmin ? "block" : "none";
  }

  updateSettingsUI();
  await loadWishes();

  if (isAdmin && typeof loadAdminData === "function") {
    loadAdminData();
  }
}

// =====================================================
// ███  СОСТОЯНИЕ ВЫХОД
// =====================================================
function renderLoggedOut() {
  currentUser = null;
  window.__currentUser = null;
  document.body.classList.remove("is-admin");

  if (authTitle) {
    authTitle.innerHTML = 'Вход в наш <span>секретный дневник</span> 💫';
  }

  if (welcomeText) welcomeText.textContent = "Ты ещё не вошла 💔";
  if (authArea) authArea.innerHTML = "";
  if (authForm) authForm.style.display = "block";

  if (privateContent) {
    privateContent.style.opacity = "0.3";
    privateContent.style.pointerEvents = "none";
  }

  if (adminPanel) adminPanel.style.display = "none";

  updateSettingsUI();

  if (wishList) wishList.innerHTML = "";
  if (wishCount) wishCount.textContent = "";
}

// =====================================================
// ███  AUTH LISTENER
// =====================================================
onAuthStateChanged(auth, (user) => {
  if (user) renderLoggedInUser(user);
  else renderLoggedOut();
});

// =====================================================
// ███  КНОПКИ АВТОРИЗАЦИИ
// =====================================================
if (emailRegisterBtn) {
  emailRegisterBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const pass  = passwordInput.value.trim();
    if (!email || !pass) {
      setAuthStatus("Введи email и пароль 💌", "bad");
      return;
    }
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      setAuthStatus("Аккаунт создан 💖", "good");
    } catch (err) {
      setAuthStatus(err.message, "bad");
    }
  });
}

if (emailLoginBtn) {
  emailLoginBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const pass  = passwordInput.value.trim();
    if (!email || !pass) {
      setAuthStatus("Введи email и пароль 💌", "bad");
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      setAuthStatus("Добро пожаловать 💖", "good");
    } catch (err) {
      setAuthStatus(err.message, "bad");
    }
  });
}

if (googleBtn) {
  googleBtn.addEventListener("click", async () => {
    try {
      await signInWithPopup(auth, provider);
      setAuthStatus("Google вход успешен 🌈", "good");
    } catch (err) {
      setAuthStatus(err.message, "bad");
    }
  });
}

// =====================================================
// ███  КНОПКИ ЖЕЛАНИЙ
// =====================================================
if (addWishBtn)  addWishBtn.addEventListener("click", addWish);
if (clearWishesBtn) {
  clearWishesBtn.addEventListener("click", () => {
    setAuthStatus("Очистку сделаем позже 🛠", "bad");
  });
}

// =====================================================
// ███  АДМИН-ПАНЕЛЬ
// =====================================================
async function loadAdminData() {
  if (!currentUser || currentUser.uid !== ADMIN_UID) return;

  const usersBody    = document.getElementById("admin-users-body");
  const wishesBody   = document.getElementById("admin-wishes-body");
  const thoughtsBody = document.getElementById("admin-thoughts-body");

  // ---- USERS ----
  if (usersBody) {
    try {
      const snap = await getDocs(collection(db, "users"));
      usersBody.innerHTML = "";

      snap.forEach(docSnap => {
        const u = docSnap.data();
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${u.name || "—"}</td>
          <td>${u.email || "—"}</td>
          <td>${u.uid || "—"}</td>
          <td>${u.lastLogin?.toDate?.().toLocaleString("ru-RU") || "—"}</td>
        `;
        usersBody.appendChild(tr);
      });

    } catch (e) {
      console.error("Ошибка загрузки пользователей:", e);
    }
  }

  // ---- WISHES ----
  if (wishesBody) {
    try {
      const q = query(collection(db, "wishes"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      wishesBody.innerHTML = "";

      snap.forEach(docSnap => {
        const w = docSnap.data();
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${w.createdAt?.toDate?.().toLocaleString("ru-RU") || "—"}</td>
          <td>${w.text}</td>
          <td>${w.email || "—"}</td>
          <td>${w.uid}</td>
        `;
        wishesBody.appendChild(tr);
      });

    } catch (e) {
      console.error("Ошибка загрузки желаний:", e);
    }
  }

  // ---- THOUGHTS ----
  if (thoughtsBody) {
    try {
      const q = query(
        collection(db, "asyaman_thoughts"),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(q);
      thoughtsBody.innerHTML = "";

      snap.forEach(docSnap => {
        const t = docSnap.data();

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${t.createdAt?.toDate?.().toLocaleString("ru-RU") || "—"}</td>
          <td>${t.text}</td>
          <td>${t.email || "—"}</td>
          <td>${t.uid}</td>
          <td>${t.deleted ? "Удалено пользователем" : "Активно"}</td>
        `;
        thoughtsBody.appendChild(tr);
      });

    } catch (e) {
      console.error("Ошибка загрузки мыслей:", e);
    }
  }
}

// Первый запуск
updateSettingsUI();
