// auth-wishes.js
// Firebase auth + Firestore wishes + связь с новым index.html

// ==== ИМПОРТЫ ИЗ FIREBASE (CDN) ====
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ==== ТВОЙ FIREBASE CONFIG ====

const firebaseConfig = {
  apiKey: "AIzaSyCbgO8b96hAGU3kvwkjsv1x1Is-879Mbgc",
  authDomain: "asyaman-40f1f.firebaseapp.com",
  projectId: "asyaman-40f1f",
  storageBucket: "asyaman-40f1f.firebasestorage.app",
  messagingSenderId: "780594675672",
  appId: "1:780594675672:web:27766d673b4255a281bcad",
  measurementId: "G-LBMZLEY4Y5"
};

// ==== UID ВЛАДЕЛЬЦА (ДЛЯ АДМИНКИ / ССЫЛКИ) ====
const OWNER_UIDS = [QgveUKbsJLUOA3oehvXgTEbTg1S2

];

// ==== ИНИЦИАЛИЗАЦИЯ ====
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// ==== DOM-ЭЛЕМЕНТЫ ====

const authArea = document.getElementById("auth-area");
const privateContent = document.getElementById("private-content");

const authTitle = document.getElementById("auth-title");
const authStatus = document.getElementById("auth-status");
const welcomeText = document.getElementById("welcome-text");

const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");

const emailLoginBtn = document.getElementById("emailLoginBtn");
const emailRegisterBtn = document.getElementById("emailRegisterBtn");
const googleBtn = document.getElementById("googleBtn");

const profileName = document.getElementById("profileName");
const settingsAccountInfo = document.getElementById("settingsAccountInfo");
const settingsAdminBtnTop = document.getElementById("settingsAdminBtn");
const settingsAdminBtnDup = document.getElementById("settingsAdminBtn-duplicate"); // если сделаем вторую кнопку — можно ей дать другой id

// на странице есть две кнопки выхода: верхняя и дубль в настройках
const logoutBtnDuplicate = document.getElementById("logout-btn-duplicate");

// на странице два элемента с id wishCount — это не идеально, но мы обходимся через querySelectorAll
const wishCountEls = document.querySelectorAll("#wishCount");

// список желаний
const wishInput = document.getElementById("wishInput");
const addWishBtn = document.getElementById("addWishBtn");
const clearWishesBtn = document.getElementById("clearWishesBtn");
const wishList = document.getElementById("wishList");

// ==== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====

function setAuthStatus(text, isError = false) {
  if (!authStatus) return;
  authStatus.textContent = text;
  authStatus.classList.toggle("bad", isError);
}

function setWishCount(count) {
  wishCountEls.forEach((el) => {
    el.textContent = String(count);
  });
}

function isOwner(user) {
  if (!user) return false;
  return OWNER_UIDS.includes(user.uid);
}

// ==== РАБОТА С ЖЕЛАНИЯМИ (FIRESTORE) ====

async function loadUserWishes(user) {
  if (!user || !db || !wishList) return;

  wishList.innerHTML = '<li>Загрузка желаний…</li>';
  setWishCount(0);

  try {
    const colRef = collection(db, "wishes");
    const qUser = query(
      colRef,
      where("userUid", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(qUser);

    wishList.innerHTML = "";
    if (snap.empty) {
      wishList.innerHTML =
        '<li style="opacity:0.8;">Пока ещё нет желаний. Можно начать с чего-нибудь простого.</li>';
      setWishCount(0);
      return;
    }

    let count = 0;
    snap.forEach((doc) => {
      const data = doc.data();
      const li = document.createElement("li");
      li.textContent = data.text || "";
      wishList.appendChild(li);
      count += 1;
    });

    setWishCount(count);
  } catch (err) {
    console.error("Ошибка загрузки желаний:", err);
    wishList.innerHTML =
      '<li style="color:#fca5a5;">Не получилось загрузить желания. Попробуем позже.</li>';
  }
}

async function addWish(user) {
  if (!user || !db || !wishInput) return;
  const text = wishInput.value.trim();
  if (!text) return;

  try {
    const colRef = collection(db, "wishes");
    await addDoc(colRef, {
      text,
      userUid: user.uid,
      userEmail: user.email || null,
      createdAt: serverTimestamp(),
    });

    wishInput.value = "";
    await loadUserWishes(user);
    setAuthStatus("Желание добавлено ✅", false);
  } catch (err) {
    console.error("Ошибка добавления желания:", err);
    setAuthStatus("Не получилось добавить желание. Попробуем ещё раз.", true);
  }
}

async function clearUserWishes(user) {
  // Чтобы не ломать Firestore массовыми удалениями,
  // мы пока просто даём подсказку, что чистка делается через интерфейс или админку.
  alert(
    "Массовое удаление желаний пока не включено, чтобы не сломать базу.\n" +
      "Если очень нужно — можно позже сделать это через админку или отдельный скрипт."
  );
}

// ==== ОБРАБОТКА АВТОРИЗАЦИИ ====

async function handleEmailLogin(isRegister = false) {
  if (!emailInput || !passwordInput) return;

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    setAuthStatus("Введи почту и пароль.", true);
    return;
  }

  try {
    setAuthStatus(isRegister ? "Создаём аккаунт…" : "Заходим…", false);

    if (isRegister) {
      await createUserWithEmailAndPassword(auth, email, password);
      setAuthStatus("Аккаунт создан. Сейчас зайдём…", false);
    } else {
      await signInWithEmailAndPassword(auth, email, password);
      setAuthStatus("Вход выполнен.", false);
    }
  } catch (err) {
    console.error("Ошибка входа/регистрации:", err);
    let msg = "Что-то пошло не так.";
    if (err.code === "auth/wrong-password") msg = "Неверный пароль.";
    if (err.code === "auth/user-not-found") msg = "Такой пользователь не найден.";
    if (err.code === "auth/email-already-in-use") msg = "Этот email уже используется.";
    if (err.code === "auth/weak-password") msg = "Слишком простой пароль.";

    setAuthStatus(msg, true);
  }
}

async function handleGoogleLogin() {
  try {
    setAuthStatus("Открываем окно Google…", false);
    await signInWithPopup(auth, googleProvider);
  } catch (err) {
    console.error("Ошибка Google-входа:", err);
    setAuthStatus("Не получилось войти через Google.", true);
  }
}

async function handleLogout() {
  try {
    await signOut(auth);
  } catch (err) {
    console.error("Ошибка выхода:", err);
  }
}

// ==== ПРИВЯЗКА СОБЫТИЙ К КНОПКАМ ====

if (emailLoginBtn) {
  emailLoginBtn.addEventListener("click", () => handleEmailLogin(false));
}

if (emailRegisterBtn) {
  emailRegisterBtn.addEventListener("click", () => handleEmailLogin(true));
}

if (googleBtn) {
  googleBtn.addEventListener("click", () => handleGoogleLogin());
}

if (logoutBtnDuplicate) {
  logoutBtnDuplicate.addEventListener("click", () => handleLogout());
}

// Кнопка "Панель владельца"
function openAdminIfOwner(user) {
  if (!user) {
    alert("Сначала войди в свой аккаунт.");
    return;
  }
  if (!isOwner(user)) {
    alert("Админка доступна только для владельца.");
    return;
  }
  window.location.href = "admin.html";
}

// вёрстка сейчас использует один id settingsAdminBtn,
// но если сделаешь две разные кнопки — можно вешать обработчик на каждую
if (settingsAdminBtnTop) {
  settingsAdminBtnTop.addEventListener("click", () => {
    openAdminIfOwner(auth.currentUser);
  });
}
if (settingsAdminBtnDup) {
  settingsAdminBtnDup.addEventListener("click", () => {
    openAdminIfOwner(auth.currentUser);
  });
}

// ==== РЕАКЦИЯ НА СМЕНУ СОСТОЯНИЯ АВТОРИЗАЦИИ ====

onAuthStateChanged(auth, async (user) => {
  const loggedIn = !!user;

  if (!authArea || !privateContent) {
    // На всякий случай, если файл вдруг подключат ещё где-то
    console.warn("auth-wishes.js: не найден authArea или privateContent в DOM.");
  }

  if (loggedIn) {
    // показываем приватный контент
    if (authArea) authArea.classList.add("hidden");
    if (privateContent) privateContent.classList.remove("hidden");

    if (authTitle) {
      authTitle.innerHTML = 'Ты уже внутри нашего <span>секретного дневника</span> ✨';
    }
    if (welcomeText) {
      welcomeText.textContent =
        "Теперь все желания, мысли и моменты «когда скучаешь» привязаны к твоему аккаунту.";
    }

    const name = user.email || "Безымянный пользователь";
    if (profileName) {
      profileName.textContent = name;
    }
    if (settingsAccountInfo) {
      settingsAccountInfo.textContent = `Почта: ${user.email || "—"} · UID: ${user.uid}`;
    }

    if (isOwner(user)) {
      setAuthStatus("Ты вошёл как владелец. Админка доступна.", false);
    } else {
      setAuthStatus("Вход выполнен. Можно работать с желаниями и мыслями.", false);
    }

    await loadUserWishes(user);
  } else {
    // пользователь вышел
    if (authArea) authArea.classList.remove("hidden");
    if (privateContent) privateContent.classList.add("hidden");

    if (authTitle) {
      authTitle.innerHTML = 'Вход в наш <span>секретный дневник</span> 💫';
    }
    if (welcomeText) {
      welcomeText.textContent =
        "Чтобы увидеть наши желания, мысли и моменты «когда скучаешь», войди в свой аккаунт.";
    }
    if (profileName) profileName.textContent = "Твоё место здесь всегда ждёт тебя";
    if (settingsAccountInfo)
      settingsAccountInfo.textContent = "Аккаунт ещё не загружен.";

    setWishCount(0);
    if (wishList) {
      wishList.innerHTML = "";
    }
    setAuthStatus("Введи почту и пароль или войди через Google.", false);
  }
});
