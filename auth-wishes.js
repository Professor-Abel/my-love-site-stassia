// auth-wishes.js
// Firebase-авторизация + желания + админка

console.log("auth-wishes.js ЗАГРУЗИЛСЯ");

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
  getDoc,
  orderBy,
  serverTimestamp,
  setDoc,
  doc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";


import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";


// ==== КОНФИГ FIREBASE ====
// ВАЖНО: storageBucket без @ в конце
const firebaseConfig = {
  apiKey: "AIzaSyCbgO8b96hAGU3kvwkjsv1x1Is-879Mbgc",
  authDomain: "asyaman-40f1f.firebaseapp.com",
  projectId: "asyaman-40f1f",
  storageBucket: "asyaman-40f1f.appspot.com",
  messagingSenderId: "780594675672",
  appId: "1:780594675672:web:27766d673b4255a281bcad",
  measurementId: "G-LBMZLEY4Y5"
};

// ТОЛЬКО ты — админ
const ADMIN_UID = "QgvеUKbsJLU0A3oehvXgTEbTg1S2"; // твой UID из Firebase

// ==== ИНИЦИАЛИЗАЦИЯ FIREBASE ====
const app      = initializeApp(firebaseConfig);
const auth     = getAuth(app);
const db       = getFirestore(app);
const provider = new GoogleAuthProvider();

let currentUser = null;
window.__currentUser = null;

// ==== ХЕЛПЕРЫ ДЛЯ ДРУГИХ СТРАНИЦ (мысли, скучаешь и т.п.) ====
async function saveEntryToFirestore(collectionName, text) {
  const user = auth.currentUser;
  if (!user) return;

  try {
    await addDoc(collection(db, collectionName), {
      uid: user.uid,
      email: user.email || null,
      text,
      createdAt: serverTimestamp()
    });
  } catch (e) {
    console.error("Ошибка записи в Firestore:", e);
  }
}

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

window.saveEntryToFirestore = saveEntryToFirestore;
window.loadMyEntries        = loadMyEntries;

// ==== DOM-ЭЛЕМЕНТЫ ====
const emailInput       = document.getElementById("emailInput");
const passwordInput    = document.getElementById("passwordInput");
const emailRegisterBtn = document.getElementById("emailRegisterBtn");
const emailLoginBtn    = document.getElementById("emailLoginBtn");
const googleBtn        = document.getElementById("googleBtn");

const authTitle   = document.getElementById("auth-title");
const welcomeText = document.getElementById("welcome-text");
const authArea    = document.getElementById("auth-area");
const authStatus  = document.getElementById("auth-status");
const authForm    = document.querySelector(".auth-form");

const privateContent = document.getElementById("private-content");
const adminPanel     = document.getElementById("admin-panel");

const wishInput      = document.getElementById("wishInput");
const addWishBtn     = document.getElementById("addWishBtn");
const clearWishesBtn = document.getElementById("clearWishesBtn");
const wishList       = document.getElementById("wishList");
const wishCount      = document.getElementById("wishCount");

// Настройки в шестерёнке
const settingsAccountInfo  = document.getElementById("settingsAccountInfo");
const settingsAdminSection = document.querySelector(".settings-section--admin");
const settingsAdminBtn     = document.getElementById("settingsAdminBtn");
const profileAvatar    = document.getElementById("profileAvatar");
const changeAvatarBtn  = document.getElementById("changeAvatarBtn");
const avatarFileInput  = document.getElementById("avatarFileInput");
const profileNameEl    = document.getElementById("profileName");

// ==== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ UI ====
function setAuthStatus(message, type = "") {
  if (!authStatus) return;
  authStatus.textContent = message || "";
  authStatus.classList.remove("good", "bad");
  if (type === "good") authStatus.classList.add("good");
  if (type === "bad")  authStatus.classList.add("bad");
}

function updateSettingsUI() {
  const isAdmin = currentUser && currentUser.uid === ADMIN_UID;

  if (settingsAccountInfo) {
    if (currentUser) {
      settingsAccountInfo.textContent =
        currentUser.email || "Авторизованный пользователь";
    } else {
      settingsAccountInfo.textContent =
        "Гость (зайди в дневник, чтобы сохранить настройки)";
    }
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
// ==== АВАТАР: ЗАГРУЗКА И ОТОБРАЖЕНИЕ ====

// Показать имя в мини-профиле
function updateProfileName(user) {
  if (!profileNameEl) return;

  if (!user) {
    profileNameEl.textContent = "Твоё место здесь 💜";
    return;
  }

  const name =
    user.displayName ||
    (user.email ? user.email.split("@")[0] : "Ты");

  profileNameEl.innerHTML = `<strong>${name}</strong><br/>в нашем маленьком мире`;
}

// Подтянуть аватар из Firestore
async function refreshAvatar(user) {
  if (!profileAvatar) return;

  if (!user) {
    profileAvatar.src = "miss-photo.jpg";
    return;
  }

  try {
    const userDocRef = doc(db, "users", user.uid);
    const snap = await getDoc(userDocRef);

    const data = snap.data?.() || snap.data();
    if (data && data.avatarUrl) {
      profileAvatar.src = data.avatarUrl;
    } else {
      profileAvatar.src = "miss-photo.jpg";
    }
  } catch (e) {
    console.error("Ошибка загрузки аватара:", e);
    profileAvatar.src = "miss-photo.jpg";
  }
}

// Загрузка нового аватара
async function handleAvatarFileChange(event) {
  const file = event.target.files?.[0];
  const user = auth.currentUser;

  if (!file || !user) return;

  try {
    setAuthStatus("Загружаю аватар...", "good");

    const fileRef = storageRef(storage, `avatars/${user.uid}.jpg`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);

    await setDoc(
      doc(db, "users", user.uid),
      { avatarUrl: url },
      { merge: true }
    );

    if (profileAvatar) {
      profileAvatar.src = url;
    }

    setAuthStatus("Аватар обновлён 💜", "good");
  } catch (e) {
    console.error("Ошибка загрузки аватара:", e);
    setAuthStatus("Иногда интернет шалит — просто попробуй ещё раз, я никуда не денусь 💜", "bad");
  } finally {
    if (avatarFileInput) {
      avatarFileInput.value = "";
    }
  }
}

// Навесим обработчики на кнопку/инпут
if (changeAvatarBtn && avatarFileInput) {
  changeAvatarBtn.addEventListener("click", () => {
    avatarFileInput.click();
  });

  avatarFileInput.addEventListener("change", handleAvatarFileChange);
}

// ==== ЖЕЛАНИЯ ДЛЯ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ ====
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

    if (!snap.size) {
      wishList.innerHTML = "<li>Пока пусто 💭</li>";
      wishCount.textContent = "0";
      return;
    }

    let html = "";
    snap.forEach(docSnap => {
      const w = docSnap.data();
      const dateStr = w.createdAt?.toDate?.().toLocaleString("ru-RU") || "";
      html += `
        <li class="wish-item">
          <div>
            <div class="wish-text">${w.text}</div>
            <div class="wish-meta">${dateStr}</div>
          </div>
        </li>`;
    });

    wishList.innerHTML = html;
    wishCount.textContent = snap.size;
  } catch (e) {
    console.error("Ошибка загрузки желаний:", e);
    wishList.innerHTML = "<li>Пока записей нет — исполнитель желаний ждёт твоих слов ✨</li>";
    wishCount.textContent = "0";
  }
}

async function addWish() {
  if (!wishInput) return;
  const text = wishInput.value.trim();
  if (!text) return;

  const uid = currentUser?.uid;
  if (!uid) {
    setAuthStatus("Войдите, чтобы сохранять свои желания 💌", "bad");
    return;
  }

  try {
    await addDoc(collection(db, "wishes"), {
      text,
      uid,
      email: currentUser.email || null,
      createdAt: serverTimestamp()
    });

    wishInput.value = "";
    setAuthStatus("Желание сохранено ✨", "good");
    await loadWishes();
  } catch (err) {
    console.error("Ошибка сохранения:", err);
    setAuthStatus("Кажется, интернет подвис. Просто попробуй ещё раз чуть позже 💜", "bad");
  }
}

// ==== СОСТОЯНИЕ: ПОЛЬЗОВАТЕЛЬ ВОШЁЛ ====
async function renderLoggedInUser(user) {
  currentUser = user;
  window.__currentUser = user;
document.body.classList.add("is-logged-in");

  const isAdmin = user.uid === ADMIN_UID;
 

  if (isAdmin) {
    document.body.classList.add("is-admin");
  } else {
    document.body.classList.remove("is-admin");
  }

  // профиль в Firestore
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

  if (authTitle) {
    authTitle.innerHTML = 'Наш <span>секретный дневник</span> 💫';
  }

  if (welcomeText) {
    welcomeText.textContent = `Привет, ${user.displayName || "моя любовь"} 💖`;
  }

  // слева только кнопка "Выйти"
  if (authArea) {
    authArea.innerHTML = `<button class="btn btn-outline" id="logout-btn">Выйти</button>`;
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) logoutBtn.onclick = () => signOut(auth);
  }

  // 🔒 САМЫЙ ВАЖНЫЙ МОМЕНТ: форму прячем
  if (authForm) {
    authForm.style.display = "none";
  }

  // правая карточка с желаниями становится активной
  if (privateContent) {
    privateContent.style.opacity = "1";
    privateContent.style.pointerEvents = "auto";
  }

  setAuthStatus("Ты в системе, можешь писать желания 💌", "good");

  await loadWishes();
  updateSettingsUI();

  if (isAdmin && typeof loadAdminData === "function") {
    loadAdminData();
  }
}



// ==== СОСТОЯНИЕ: ПОЛЬЗОВАТЕЛЬ ВЫШЕЛ ====
function renderLoggedOut() {
  currentUser = null;
  window.__currentUser = null;
  document.body.classList.remove("is-logged-in");

  const isAdmin = false;
  document.body.classList.remove("is-admin");

  if (authTitle) {
    authTitle.innerHTML = 'Вход в наш <span>секретный дневник</span> 💫';
  }

  if (welcomeText) {
    welcomeText.textContent = "Ты ещё не вошла в систему 💔";
  }

  if (authArea) authArea.innerHTML = "";

  if (authForm) authForm.style.display = "block";

  if (privateContent) {
    privateContent.style.opacity = "0.3";
    privateContent.style.pointerEvents = "none";
  }

  if (adminPanel) adminPanel.style.display = "none";

  setAuthStatus("Войди, чтобы мы могли сохранить твои желания 🫶", "bad");

  if (wishList)  wishList.innerHTML = "";
  if (wishCount) wishCount.textContent = "";

  updateSettingsUI();
}

// ==== СЛУШАТЕЛЬ АВТОРИЗАЦИИ ====
onAuthStateChanged(auth, (user) => {
  console.log("auth state changed. user =", user);
  if (user) {// Разблокируем кнопку смены аватара
changeAvatarBtn.disabled = false;
changeAvatarBtn.classList.remove("btn-avatar--locked");
changeAvatarBtn.title = "Сменить аватар";

    renderLoggedInUser(user);
  } else {// Блокируем кнопку смены аватара
changeAvatarBtn.disabled = true;
changeAvatarBtn.classList.add("btn-avatar--locked");
changeAvatarBtn.title = "Доступно только после входа";

    renderLoggedOut();
  }
});

// ==== ОБРАБОТЧИКИ КНОПОК ВХОДА/РЕГИСТРАЦИИ ====
emailRegisterBtn?.addEventListener("click", async () => {
  const email = emailInput?.value.trim();
  const pass  = passwordInput?.value.trim();
  const changeAvatarBtn = document.getElementById("changeAvatarBtn");
const avatarFileInput = document.getElementById("avatarFileInput");


  if (!email || !pass) {
    setAuthStatus("Введи email и пароль 💌", "bad");
    return;
  }

  try {
    await createUserWithEmailAndPassword(auth, email, pass);
    setAuthStatus("Аккаунт создан, ты вошла ❤️", "good");
  } catch (err) {
    console.error(err);
    setAuthStatus("Ошибка регистрации: " + err.code, "bad");
  }
});

emailLoginBtn?.addEventListener("click", async () => {
  const email = emailInput?.value.trim();
  const pass  = passwordInput?.value.trim();

  if (!email || !pass) {
    setAuthStatus("Введи email и пароль 💌", "bad");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, pass);
    setAuthStatus("Рада тебя видеть снова 💖", "good");
  } catch (err) {
    console.error(err);
    setAuthStatus("Ошибка входа: " + err.code, "bad");
  }
});

googleBtn?.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, provider);
    setAuthStatus("Ты вошла через Google 🌈", "good");
  } catch (err) {
    console.error(err);
    setAuthStatus("Ошибка входа через Google: " + err.code, "bad");
  }
});

// ==== КНОПКИ ЖЕЛАНИЙ ====
addWishBtn?.addEventListener("click", addWish);

clearWishesBtn?.addEventListener("click", () => {
  setAuthStatus("Очистку желаний сделаем чуть позже 🛠", "bad");
});

// ==== АДМИН-ДАННЫЕ (если ты админ) ====
async function loadAdminData() {
  if (!currentUser || currentUser.uid !== ADMIN_UID) return;

  const usersBody  = document.getElementById("admin-users-body");
  const wishesBody = document.getElementById("admin-wishes-body");

  if (!usersBody && !wishesBody) return;

  // Пользователи
  if (usersBody) {
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      usersBody.innerHTML = "";

      usersSnap.forEach(docSnap => {
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

  // Все желания
  if (wishesBody) {
    try {
      const q = query(
        collection(db, "wishes"),
        orderBy("createdAt", "desc")
      );
      const wishesSnap = await getDocs(q);
      wishesBody.innerHTML = "";

      wishesSnap.forEach(docSnap => {
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
}

// первый вызов — пока гость
updateSettingsUI();
