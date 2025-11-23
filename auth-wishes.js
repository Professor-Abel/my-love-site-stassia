// auth-wishes.js
// Авторизация (Firebase) + логика желаний (Firestore) + мини-админка

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
  deleteDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ==== ТВОЙ FIREBASE-КОНФИГ ====
// ВСТАВЬ СЮДА СВОЙ КОНФИГ, КОТОРЫЙ У ТЕБЯ УЖЕ БЫЛ.
// Я ОСТАВЛЯЮ ПРИМЕР, НО ТЫ ДОЛЖЕН ОСТАВИТЬ СВОЙ НАБОР КЛЮЧЕЙ.
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_DOMAIN.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// ==== ИНИЦИАЛИЗАЦИЯ ====
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// UID владельца (или несколько). Сюда вставь СВОЙ UID из Firebase Auth.
const OWNER_UIDS = [
  "YOUR_OWNER_UID_HERE",
  // "SECOND_OWNER_UID_IF_NEEDED",
];

// ==== ПОМОЩНИКИ ПО DOM ====
const $ = (id) => document.getElementById(id);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const authArea = $("auth-area");
const authTitle = $("auth-title");
const authStatus = $("auth-status");
const welcomeText = $("welcome-text");

const privateContent = $("private-content");
const adminPanel = $("admin-panel");

const emailInput = $("emailInput");
const passwordInput = $("passwordInput");
const emailLoginBtn = $("emailLoginBtn");
const emailRegisterBtn = $("emailRegisterBtn");
const googleBtn = $("googleBtn");

const logoutBtn = $("logout-btn");
const profileName = $("profileName");
const settingsAccountInfo = $("settingsAccountInfo");
const settingsAdminBtn = $("settingsAdminBtn");

const wishInput = $("wishInput");
const wishListEl = $("wishList");
const addWishBtn = $("addWishBtn");
const clearWishesBtn = $("clearWishesBtn");
// В index.html два элемента с id="wishCount" (вверху и в блоке желаний),
// поэтому мы обновляем оба сразу:
const wishCountEls = $$("#wishCount");

// Админ-таблицы внутри главной
const adminUsersBody = $("admin-users-body");
const adminWishesBody = $("admin-wishes-body");

let currentUser = null;
let userWishes = [];

// ==== УТИЛИТЫ ====

function setAuthStatus(message, isError = false) {
  if (!authStatus) return;
  authStatus.textContent = message;
  authStatus.style.color = isError ? "#fb7185" : "rgba(232,228,255,0.85)";
}

function setWelcomeText(message) {
  if (!welcomeText) return;
  welcomeText.textContent = message;
}

function setWishCount(n) {
  wishCountEls.forEach((el) => {
    if (el) el.textContent = String(n);
  });
}

function isOwner(user) {
  if (!user) return false;
  return OWNER_UIDS.includes(user.uid);
}

function formatTimestamp(ts) {
  if (!ts) return "";
  try {
    const date = ts.toDate();
    return date.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

// ==== РЕНДЕР ЖЕЛАНИЙ ====

function renderUserWishes() {
  if (!wishListEl) return;

  wishListEl.innerHTML = "";

  if (!userWishes.length) {
    const li = document.createElement("li");
    li.textContent = "Пока нет ни одного желания. Добавь первое ✨";
    wishListEl.appendChild(li);
    setWishCount(0);
    return;
  }

  userWishes.forEach((wish) => {
    const li = document.createElement("li");
    li.textContent = wish.text || "";

    if (wish.createdAt) {
      const small = document.createElement("div");
      small.style.fontSize = "0.72rem";
      small.style.color = "#9ca3af";
      small.style.marginTop = "4px";
      small.textContent = formatTimestamp(wish.createdAt);
      li.appendChild(small);
    }

    wishListEl.appendChild(li);
  });

  setWishCount(userWishes.length);
}

// ==== РАБОТА С FIRESTORE (ЖЕЛАНИЯ ПОЛЬЗОВАТЕЛЯ) ====

async function loadUserWishes(user) {
  if (!user) return;

  try {
    const colRef = collection(db, "wishes");
    const q = query(
      colRef,
      where("userUid", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);
    userWishes = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    renderUserWishes();
  } catch (err) {
    console.error("Ошибка загрузки желаний пользователя:", err);
    setAuthStatus("Не удалось загрузить твои желания. Попробуй ещё раз позже.", true);
  }
}

async function addUserWish(user, text) {
  if (!user || !text) return;

  try {
    const colRef = collection(db, "wishes");

    await addDoc(colRef, {
      text,
      userUid: user.uid,
      userEmail: user.email || null,
      displayName: user.displayName || null,
      createdAt: serverTimestamp(),
    });

    await loadUserWishes(user);
    setAuthStatus("Желание добавлено 💫");
  } catch (err) {
    console.error("Ошибка добавления желания:", err);
    setAuthStatus("Не удалось добавить желание. Попробуй снова.", true);
  }
}

async function clearUserWishes(user) {
  if (!user) return;

  const confirmation = window.confirm(
    "Точно удалить ВСЕ свои желания? Вернуть их будет уже нельзя."
  );
  if (!confirmation) return;

  try {
    const colRef = collection(db, "wishes");
    const q = query(colRef, where("userUid", "==", user.uid));
    const snap = await getDocs(q);

    const deletions = snap.docs.map((d) => deleteDoc(doc(db, "wishes", d.id)));
    await Promise.all(deletions);

    userWishes = [];
    renderUserWishes();

    setAuthStatus("Все твои желания на этом сайте очищены.", false);
  } catch (err) {
    console.error("Ошибка очистки желаний:", err);
    setAuthStatus("Не удалось удалить желания. Попробуй позже.", true);
  }
}

// ==== АДМИНКА (МИНИ-ДАШБОРД ВНУТРИ ГЛАВНОЙ) ====

async function loadAdminData(user) {
  if (!adminPanel || !adminUsersBody || !adminWishesBody) return;

  if (!isOwner(user)) {
    adminPanel.classList.add("hidden");
    return;
  }

  adminPanel.classList.remove("hidden");

  // Пишем "загрузка" в таблицы
  adminUsersBody.innerHTML =
    '<tr><td colspan="4">Загрузка пользователей…</td></tr>';
  adminWishesBody.innerHTML =
    '<tr><td colspan="3">Загрузка желаний…</td></tr>';

  try {
    const colRef = collection(db, "wishes");
    const qAll = query(colRef, orderBy("createdAt", "desc"));
    const snap = await getDocs(qAll);

    const allWishes = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    // Таблица "Желания"
    if (!allWishes.length) {
      adminWishesBody.innerHTML =
        '<tr><td colspan="3">Пока нет ни одного желания.</td></tr>';
    } else {
      adminWishesBody.innerHTML = "";
      allWishes.forEach((w) => {
        const tr = document.createElement("tr");

        const tdText = document.createElement("td");
        tdText.textContent = w.text || "";

        const tdAuthor = document.createElement("td");
        tdAuthor.textContent = w.userEmail || "—";

        const tdDate = document.createElement("td");
        tdDate.textContent = w.createdAt ? formatTimestamp(w.createdAt) : "";

        tr.appendChild(tdText);
        tr.appendChild(tdAuthor);
        tr.appendChild(tdDate);

        adminWishesBody.appendChild(tr);
      });
    }

    // Таблица "Пользователи" — собираем по желанию (unique email/uid)
    const usersMap = new Map();
    allWishes.forEach((w) => {
      const key = w.userUid || w.userEmail || "unknown";
      if (!usersMap.has(key)) {
        usersMap.set(key, {
          email: w.userEmail || "—",
          uid: w.userUid || "—",
          lastLogin: w.createdAt || null,
          wishCount: 0,
        });
      }
      const obj = usersMap.get(key);
      obj.wishCount += 1;
      if (w.createdAt && (!obj.lastLogin || w.createdAt.toMillis() > obj.lastLogin.toMillis())) {
        obj.lastLogin = w.createdAt;
      }
    });

    if (!usersMap.size) {
      adminUsersBody.innerHTML =
        '<tr><td colspan="4">Пока нет данных по пользователям.</td></tr>';
    } else {
      adminUsersBody.innerHTML = "";
      Array.from(usersMap.values()).forEach((u) => {
        const tr = document.createElement("tr");

        const tdEmail = document.createElement("td");
        tdEmail.textContent = u.email;

        const tdUid = document.createElement("td");
        tdUid.textContent = u.uid;

        const tdLast = document.createElement("td");
        tdLast.textContent = u.lastLogin ? formatTimestamp(u.lastLogin) : "";

        const tdCount = document.createElement("td");
        tdCount.textContent = String(u.wishCount);

        tr.appendChild(tdEmail);
        tr.appendChild(tdUid);
        tr.appendChild(tdLast);
        tr.appendChild(tdCount);

        adminUsersBody.appendChild(tr);
      });
    }
  } catch (err) {
    console.error("Ошибка загрузки данных админки:", err);
    adminUsersBody.innerHTML =
      '<tr><td colspan="4">Ошибка загрузки.</td></tr>';
    adminWishesBody.innerHTML =
      '<tr><td colspan="3">Ошибка загрузки.</td></tr>';
  }
}

// ==== СОСТОЯНИЕ UI ПРИ ЛОГИНЕ/ЛОГАУТЕ ====

function applyLoggedOutState() {
  currentUser = null;

  if (authArea) authArea.classList.remove("hidden");
  if (privateContent) privateContent.classList.add("hidden");
  if (adminPanel) adminPanel.classList.add("hidden");

  if (authTitle) authTitle.textContent = "Вход в наш секретный дневник 💫";
  setAuthStatus("Войди или создай аккаунт, чтобы видеть все наши желания.");
  setWelcomeText("Ты ещё не вошла в систему 💔");

  if (profileName) {
    profileName.textContent = "Твоё место здесь всегда ждёт тебя";
  }
  if (settingsAccountInfo) {
    settingsAccountInfo.textContent = "Аккаунт ещё не загружен.";
  }

  userWishes = [];
  renderUserWishes();
}

function applyLoggedInState(user) {
  currentUser = user;

  if (authArea) authArea.classList.add("hidden");
  if (privateContent) privateContent.classList.remove("hidden");

  if (authTitle) authTitle.textContent = "Ты внутри нашего мира ✨";

  const nameToShow = user.displayName || user.email || "Твой аккаунт";
  if (profileName) profileName.textContent = nameToShow;

  if (settingsAccountInfo) {
    settingsAccountInfo.textContent = `Вход выполнен как: ${
      user.email || "без почты"
    }`;
  }

  setAuthStatus("Ты успешно вошла в наш секретный дневник.", false);
  setWelcomeText("Ты внутри. Всё, что ты напишешь здесь, останется только между нами.");

  // Админка
  loadAdminData(user);

  // Желания
  loadUserWishes(user);
}

// ==== ОБРАБОТЧИКИ КНОПОК АВТОРИЗАЦИИ ====

async function handleEmailLogin() {
  if (!emailInput || !passwordInput) return;
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    setAuthStatus("Нужно ввести почту и пароль.", true);
    return;
  }

  try {
    setAuthStatus("Входим...", false);
    await signInWithEmailAndPassword(auth, email, password);
    emailInput.value = "";
    passwordInput.value = "";
  } catch (err) {
    console.error("Ошибка входа:", err);
    let msg = "Не удалось войти. Проверь данные или попробуй ещё раз.";
    if (err.code === "auth/user-not-found") msg = "Такого аккаунта ещё нет.";
    if (err.code === "auth/wrong-password") msg = "Неверный пароль.";
    setAuthStatus(msg, true);
  }
}

async function handleEmailRegister() {
  if (!emailInput || !passwordInput) return;
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    setAuthStatus("Нужно ввести почту и пароль.", true);
    return;
  }
  if (password.length < 6) {
    setAuthStatus("Пароль должен быть не меньше 6 символов.", true);
    return;
  }

  try {
    setAuthStatus("Создаём аккаунт...", false);
    await createUserWithEmailAndPassword(auth, email, password);
    emailInput.value = "";
    passwordInput.value = "";
  } catch (err) {
    console.error("Ошибка регистрации:", err);
    let msg = "Не удалось создать аккаунт. Попробуй ещё раз.";
    if (err.code === "auth/email-already-in-use") {
      msg = "Аккаунт с такой почтой уже существует. Попробуй войти.";
    }
    setAuthStatus(msg, true);
  }
}

async function handleGoogleLogin() {
  try {
    setAuthStatus("Открываем окно Google...", false);
    await signInWithPopup(auth, googleProvider);
  } catch (err) {
    console.error("Ошибка входа через Google:", err);
    setAuthStatus("Не удалось войти через Google.", true);
  }
}

async function handleLogout() {
  try {
    await signOut(auth);
  } catch (err) {
    console.error("Ошибка выхода:", err);
  }
}

// ==== ОБРАБОТЧИКИ ЖЕЛАНИЙ ====

async function handleAddWish() {
  if (!currentUser) {
    setAuthStatus("Чтобы добавить желание, нужно войти.", true);
    return;
  }
  if (!wishInput) return;

  const text = wishInput.value.trim();
  if (!text) {
    setAuthStatus("Нельзя добавить пустое желание.", true);
    return;
  }

  await addUserWish(currentUser, text);
  wishInput.value = "";
}

async function handleClearWishes() {
  if (!currentUser) {
    setAuthStatus("Чтобы очистить желания, нужно войти.", true);
    return;
  }
  await clearUserWishes(currentUser);
}

// ==== ОБРАБОТЧИКИ UI-КНОПОК ====

if (emailLoginBtn) {
  emailLoginBtn.addEventListener("click", (e) => {
    e.preventDefault();
    handleEmailLogin();
  });
}

if (emailRegisterBtn) {
  emailRegisterBtn.addEventListener("click", (e) => {
    e.preventDefault();
    handleEmailRegister();
  });
}

if (googleBtn) {
  googleBtn.addEventListener("click", (e) => {
    e.preventDefault();
    handleGoogleLogin();
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    handleLogout();
  });
}

if (settingsAdminBtn) {
  settingsAdminBtn.addEventListener("click", () => {
    // перенести в отдельную страницу админки
    window.location.href = "admin.html";
  });
}

if (addWishBtn) {
  addWishBtn.addEventListener("click", (e) => {
    e.preventDefault();
    handleAddWish();
  });
}

if (clearWishesBtn) {
  clearWishesBtn.addEventListener("click", (e) => {
    e.preventDefault();
    handleClearWishes();
  });
}

// ==== ОТСЛЕЖИВАНИЕ СОСТОЯНИЯ АВТОРИЗАЦИИ ====

onAuthStateChanged(auth, (user) => {
  if (!user) {
    applyLoggedOutState();
    return;
  }
  applyLoggedInState(user);
});
