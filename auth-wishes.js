// auth-wishes.js
// Авторизация (Firebase) + логика желаний (localStorage)

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

import { firebaseConfig } from "./firebase-config.js";

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// ==== ЭЛЕМЕНТЫ АВТОРИЗАЦИИ ====
const authForm = document.getElementById("authForm");
const authEmailInput = document.getElementById("authEmail");
const authPasswordInput = document.getElementById("authPassword");
const authStatusElement = document.getElementById("auth-status");
const authMainButton = document.getElementById("authMainButton");
const googleLoginBtn = document.getElementById("googleLoginBtn");
const authCardSection = document.getElementById("auth-card");

const authGuestBlock = document.getElementById("auth-guest-block");
const authUserBlock = document.getElementById("auth-user-block");
const authUserEmailSpan = document.getElementById("authUserEmail");
const logoutBtn = document.getElementById("logoutBtn");

const tabButtons = document.querySelectorAll(".tab-button");

// Блоки аккаунта (центральный раздел "Аккаунт")
const accountGuestBlock = document.getElementById("account-guest");
const accountViewBlock = document.getElementById("account-view");
const accountEmailSpan = document.getElementById("account-email");

// Блоки аккаунта справа
const accountGuestSideBlock = document.getElementById("account-guest-side");
const accountViewSideBlock = document.getElementById("account-view-side");
const accountEmailSideSpan = document.getElementById("account-email-side");

// Статус аккаунта в настройках
const settingsAccountInfo = document.getElementById("settingsAccountInfo");

// Переменная для режима (login / register)
let authMode = "login";

// Смена вкладок (Вход/Регистрация)
tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    authMode = btn.dataset.mode || "login";

    if (authMode === "login") {
      authMainButton.textContent = "Войти";
    } else {
      authMainButton.textContent = "Зарегистрироваться";
    }
  });
});

// Установка текста статуса
function setAuthStatus(message, type = "") {
  if (!authStatusElement) return;
  authStatusElement.textContent = message || "";
  authStatusElement.className = "auth-status";
  if (type === "error") {
    authStatusElement.classList.add("error");
  } else if (type === "success") {
    authStatusElement.classList.add("success");
  }
}

// Сохранение почты для других частей интерфейса
function saveLastUserInfo(email) {
  try {
    if (email) {
      localStorage.setItem("asyaman_last_email", email);
    } else {
      localStorage.removeItem("asyaman_last_email");
    }
  } catch (e) {
    console.warn("Не удалось сохранить email:", e);
  }
}

// Обновление UI при авторизации
function updateAuthUI(user) {
  if (user) {
    const email = user.email || "";

    // Скрываем карточку входа целиком — как в соцсетях
    if (authCardSection) authCardSection.style.display = "none";

    // Блоки входа
    if (authGuestBlock) authGuestBlock.style.display = "none";
    if (authUserBlock) authUserBlock.style.display = "";
    if (authUserEmailSpan) authUserEmailSpan.textContent = email;

    // Центральный раздел "Аккаунт"
    if (accountGuestBlock) accountGuestBlock.style.display = "none";
    if (accountViewBlock) accountViewBlock.style.display = "";
    if (accountEmailSpan) accountEmailSpan.textContent = email;

    // Правая колонка "Профиль"
    if (accountGuestSideBlock) accountGuestSideBlock.style.display = "none";
    if (accountViewSideBlock) accountViewSideBlock.style.display = "";
    if (accountEmailSideSpan) accountEmailSideSpan.textContent = email;

    // Настройки
    if (settingsAccountInfo) {
      settingsAccountInfo.textContent = "Вход выполнен как: " + email;
    }

    // Сохраняем почту
    saveLastUserInfo(email);

    setAuthStatus("Вход выполнен", "success");
  } else {
    // Нет пользователя — показываем карточку входа
    if (authCardSection) authCardSection.style.display = "";

    // Блоки входа
    if (authGuestBlock) authGuestBlock.style.display = "";
    if (authUserBlock) authUserBlock.style.display = "none";
    if (authUserEmailSpan) authUserEmailSpan.textContent = "";

    // Центральный раздел "Аккаунт"
    if (accountGuestBlock) accountGuestBlock.style.display = "";
    if (accountViewBlock) accountViewBlock.style.display = "none";
    if (accountEmailSpan) accountEmailSpan.textContent = "";

    // Правая колонка "Профиль"
    if (accountGuestSideBlock) accountGuestSideBlock.style.display = "";
    if (accountViewSideBlock) accountViewSideBlock.style.display = "none";
    if (accountEmailSideSpan) accountEmailSideSpan.textContent = "";

    // Настройки
    if (settingsAccountInfo) {
      settingsAccountInfo.textContent = "Гость (зайди в дневник, чтобы сохранить настройки)";
    }

    saveLastUserInfo("");
    setAuthStatus("");
  }
}

// ==== ОБРАБОТЧИК ФОРМЫ АВТОРИЗАЦИИ ====
if (authForm) {
  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = (authEmailInput?.value || "").trim();
    const password = authPasswordInput?.value || "";

    if (!email || !password) {
      setAuthStatus("Пожалуйста, заполни email и пароль", "error");
      return;
    }

    setAuthStatus("Подождём немного…", "");

    try {
      if (authMode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
        setAuthStatus("Вход выполнен", "success");
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        setAuthStatus("Аккаунт создан и вход выполнен", "success");
      }
    } catch (error) {
      console.error("Ошибка авторизации:", error);
      let msg = "Что-то пошло не так. Попробуй ещё раз.";

      if (error.code === "auth/invalid-email") msg = "Неправильный формат email.";
      if (error.code === "auth/user-not-found") msg = "Пользователь не найден.";
      if (error.code === "auth/wrong-password") msg = "Неправильный пароль.";
      if (error.code === "auth/email-already-in-use") msg = "Этот email уже используется.";

      setAuthStatus(msg, "error");
    }
  });
}

// Вход через Google
if (googleLoginBtn) {
  googleLoginBtn.addEventListener("click", async () => {
    setAuthStatus("Подождём немного…", "");
    try {
      await signInWithPopup(auth, googleProvider);
      setAuthStatus("Вход через Google выполнен", "success");
    } catch (error) {
      console.error("Ошибка входа через Google:", error);
      setAuthStatus("Не удалось войти через Google", "error");
    }
  });
}

// Выход
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      setAuthStatus("Вы вышли из аккаунта", "success");
    } catch (error) {
      console.error("Ошибка выхода:", error);
      setAuthStatus("Не удалось выйти", "error");
    }
  });
};

// Слушатель изменения состояния авторизации
onAuthStateChanged(auth, (user) => {
  updateAuthUI(user);
});

// ==== ЛОГИКА ЖЕЛАНИЙ (localStorage) ====

// Ключ для хранения в localStorage
const WISHES_KEY = "asyaman_wishes";

// DOM элементы для желаний
const wishInput = document.getElementById("wishInput");
const addWishBtn = document.getElementById("addWishBtn");
const clearWishesBtn = document.getElementById("clearWishesBtn");
const wishListElement = document.getElementById("wishList");

// Загрузка желаний из localStorage
function loadWishes() {
  try {
    const raw = localStorage.getItem(WISHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (e) {
    console.warn("Не удалось загрузить желания:", e);
    return [];
  }
}

// Сохранение желаний
function saveWishes(wishes) {
  try {
    localStorage.setItem(WISHES_KEY, JSON.stringify(wishes || []));
  } catch (e) {
    console.warn("Не удалось сохранить желания:", e);
  }
}

// Отрисовка списка желаний
function renderWishes() {
  if (!wishListElement) return;
  const wishes = loadWishes();
  wishListElement.innerHTML = "";

  if (wishes.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Пока здесь пусто. Напиши первое желание ✨";
    li.style.fontSize = "12px";
    li.style.color = "rgba(148, 163, 184, 0.9)";
    wishListElement.appendChild(li);
    return;
  }

  wishes.forEach((wish, index) => {
    const li = document.createElement("li");
    li.className = "wish-item";

    const left = document.createElement("div");
    left.style.flex = "1";

    const textDiv = document.createElement("div");
    textDiv.className = "wish-text";
    textDiv.textContent = wish.text || "";

    const metaDiv = document.createElement("div");
    metaDiv.className = "wish-meta";
    metaDiv.textContent = wish.createdAt
      ? "Добавлено: " + new Date(wish.createdAt).toLocaleString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    left.appendChild(textDiv);
    left.appendChild(metaDiv);

    li.appendChild(left);

    // Кнопка удаления
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "×";
    removeBtn.style.border = "none";
    removeBtn.style.background = "transparent";
    removeBtn.style.color = "rgba(148, 163, 184, 0.9)";
    removeBtn.style.cursor = "pointer";
    removeBtn.style.fontSize = "16px";
    removeBtn.style.padding = "0 4px";

    removeBtn.addEventListener("click", () => {
      const next = loadWishes().filter((_, i) => i !== index);
      saveWishes(next);
      renderWishes();
    });

    li.appendChild(removeBtn);

    wishListElement.appendChild(li);
  });
}

// Добавление желания
function addWish(text) {
  const trimmed = (text || "").trim();
  if (!trimmed) return;

  const wishes = loadWishes();
  wishes.unshift({
    text: trimmed,
    createdAt: Date.now(),
  });
  saveWishes(wishes);
  renderWishes();
}

// Очистка всех желаний
function clearWishes() {
  saveWishes([]);
  renderWishes();
}

// Обработчики для желаний
if (addWishBtn) {
  addWishBtn.addEventListener("click", () => {
    if (!wishInput) return;
    addWish(wishInput.value);
    wishInput.value = "";
  });
}

if (wishInput) {
  wishInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addWish(wishInput.value);
      wishInput.value = "";
    }
  });
}

if (clearWishesBtn) {
  clearWishesBtn.addEventListener("click", () => {
    clearWishes();
  });
}

// При загрузке страницы сразу отрисуем список
renderWishes();
// ==== APPLE-STYLE NAVIGATION (MEGAMENU) ====

const navLinks = document.querySelectorAll(".site-nav-link[data-panel]");
const navDim = document.getElementById("navDim");
const navMega = document.getElementById("navMega");
const navMegaSections = navMega
  ? navMega.querySelectorAll(".nav-mega-section")
  : [];
let navHideTimeout = null;

function openNavPanel(panel) {
  if (!navMega || !navDim) return;
  document.body.classList.add("nav-mega-open");

  // подсветка активного пункта
  navLinks.forEach((btn) => {
    btn.classList.toggle("is-nav-active", btn.dataset.panel === panel);
  });

  // показать нужный блок
  navMegaSections.forEach((sec) => {
    sec.classList.toggle(
      "nav-mega-section--active",
      sec.dataset.panel === panel
    );
  });
}

function closeNavPanel() {
  document.body.classList.remove("nav-mega-open");
  navLinks.forEach((btn) => btn.classList.remove("is-nav-active"));
}

if (navLinks.length && navMega && navDim) {
  navLinks.forEach((btn) => {
    btn.addEventListener("mouseenter", () => {
      if (window.innerWidth < 960) return; // на мобилке не открываем мегаменю
      clearTimeout(navHideTimeout);
      const panel = btn.dataset.panel;
      openNavPanel(panel);
    });
  });

  // Если мышка уходит с шапки/мегапанели — слегка задерживаем закрытие (как у Apple)
  const header = document.querySelector(".site-header");

  function scheduleClose() {
    clearTimeout(navHideTimeout);
    navHideTimeout = setTimeout(() => {
      closeNavPanel();
    }, 120);
  }

  [header, navMega].forEach((el) => {
    if (!el) return;
    el.addEventListener("mouseleave", scheduleClose);
    el.addEventListener("mouseenter", () => clearTimeout(navHideTimeout));
  });

  // Клик по затемнению — закрыть
  navDim.addEventListener("click", () => {
    closeNavPanel();
  });
}
