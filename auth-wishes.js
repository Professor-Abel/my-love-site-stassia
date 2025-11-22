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

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCbgO8b96hAGU3kvwkjsv1x1Is-879Mbgc",
  authDomain: "asyaman-4d584.firebaseapp.com",
  projectId: "asyaman-4d584",
  storageBucket: "asyaman-4d584.appspot.com",
  messagingSenderId: "449565900879",
  appId: "1:449565900879:web:87a77a26eaa46398f5fd24",
  measurementId: "G-ZM9R0JWC1V",
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// ==== КОНСТАНТЫ КЛЮЧЕЙ ДЛЯ localStorage ====
const WISHES_KEY = "asyaman_wishes";
const LAST_EMAIL_KEY = "asyaman_last_email";

// ==== DOM-ЭЛЕМЕНТЫ ДЛЯ АВТОРИЗАЦИИ ====
const authForm = document.getElementById("authForm");
const authStatusElement = document.getElementById("auth-status");
const authMainButton = document.getElementById("authMainButton");
const googleLoginBtn = document.getElementById("googleLoginBtn");

const authGuestBlock = document.getElementById("auth-guest-block");
const authUserBlock = document.getElementById("auth-user-block");
const authUserEmailSpan = document.getElementById("authUserEmail");
const logoutBtn = document.getElementById("logoutBtn");

const tabButtons = document.querySelectorAll(".tab-button");

// Блоки аккаунта (профиль) — чтобы показать, кто вошёл
const accountGuestBlock = document.getElementById("account-guest");
const accountViewBlock = document.getElementById("account-view");
const accountEmailSpan = document.getElementById("account-email");

// Блок настроек (текст "вход выполнен как...")
const settingsAccountInfo = document.getElementById("settings-account-info");

// ==== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ СТАТУСА ====
function setAuthStatus(message, type = "") {
  if (!authStatusElement) return;
  authStatusElement.textContent = message || "";

  authStatusElement.classList.remove("status-error", "status-success");
  if (type === "error") {
    authStatusElement.classList.add("status-error");
  } else if (type === "success") {
    authStatusElement.classList.add("status-success");
  }
}

// Сохраняем почту последнего вошедшего пользователя,
// чтобы привязать к ней профиль (account.js)
function saveLastUserInfo(email) {
  try {
    if (email) {
      localStorage.setItem(LAST_EMAIL_KEY, email);
    } else {
      localStorage.removeItem(LAST_EMAIL_KEY);
    }
  } catch (e) {
    console.warn("Не удалось сохранить last_email:", e);
  }
}

// ==== ОБНОВЛЕНИЕ UI В ЗАВИСИМОСТИ ОТ СОСТОЯНИЯ АВТОРИЗАЦИИ ====
function updateAuthUI(user) {
  if (user) {
    const email = user.email || "";
    if (authGuestBlock) authGuestBlock.style.display = "none";
    if (authUserBlock) authUserBlock.style.display = "";
    if (authUserEmailSpan) authUserEmailSpan.textContent = email;

    // После входа прячем форму логина/регистрации
    if (authForm) {
      authForm.style.display = "none";
    }

    // Аккаунт
    if (accountGuestBlock) accountGuestBlock.style.display = "none";
    if (accountViewBlock) accountViewBlock.style.display = "";

    if (accountEmailSpan) {
      accountEmailSpan.textContent = email;
    }

    if (settingsAccountInfo) {
      settingsAccountInfo.textContent = "Вход выполнен как: " + email;
    }

    // Сохраняем почту в localStorage (для настроек профиля)
    saveLastUserInfo(email);

    setAuthStatus("Вход выполнен", "success");
  } else {
    // Нет пользователя
    if (authGuestBlock) authGuestBlock.style.display = "";
    if (authUserBlock) authUserBlock.style.display = "none";
    if (authUserEmailSpan) authUserEmailSpan.textContent = "";

    // Показываем форму авторизации снова
    if (authForm) {
      authForm.style.display = "";
    }

    // Аккаунт
    if (accountGuestBlock) accountGuestBlock.style.display = "";
    if (accountViewBlock) accountViewBlock.style.display = "none";
    if (accountEmailSpan) accountEmailSpan.textContent = "";

    if (settingsAccountInfo) {
      settingsAccountInfo.textContent =
        "Гость (зайди в дневник, чтобы сохранить настройки)";
    }

    saveLastUserInfo("");
    setAuthStatus("");
  }
}

// ==== ОБРАБОТЧИК ФОРМЫ АВТОРИЗАЦИИ ====
if (authForm) {
  authForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const emailInput = document.getElementById("authEmail");
    const passwordInput = document.getElementById("authPassword");

    if (!emailInput || !passwordInput) return;

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      setAuthStatus("Заполни email и пароль 💌", "error");
      return;
    }

    // Определяем режим: вход или регистрация
    const currentModeButton = document.querySelector(
      ".tab-button.active[data-mode]"
    );
    const mode = currentModeButton?.dataset.mode || "login";

    try {
      if (mode === "register") {
        await createUserWithEmailAndPassword(auth, email, password);
        setAuthStatus("Аккаунт создан, вход выполнен 💜", "success");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        setAuthStatus("С возвращением 💫", "success");
      }
    } catch (error) {
      console.error("Ошибка авторизации:", error);
      setAuthStatus("Не получилось войти. Проверь данные 🥺", "error");
    }
  });
}

// ==== КНОПКИ ТАБОВ "ВОЙТИ / РЕГИСТРАЦИЯ" ====
tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const mode = btn.dataset.mode || "login";
    if (authMainButton) {
      authMainButton.textContent = mode === "register" ? "Зарегистрироваться" : "Войти";
    }
  });
});

// ==== ВЫХОД ИЗ АККАУНТА ====
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      setAuthStatus("Ты вышла из аккаунта 💌", "success");
    } catch (error) {
      console.error("Ошибка при выходе:", error);
      setAuthStatus("Не получилось выйти из аккаунта", "error");
    }
  });
}

// ==== ВХОД ЧЕРЕЗ GOOGLE ====
if (googleLoginBtn) {
  googleLoginBtn.addEventListener("click", async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setAuthStatus("Вход через Google выполнен ✨", "success");
    } catch (error) {
      console.error("Ошибка входа через Google:", error);
      setAuthStatus("Не получилось войти через Google", "error");
    }
  });
}

// ==== ОТСЛЕЖИВАНИЕ СОСТОЯНИЯ АВТОРИЗАЦИИ ====
onAuthStateChanged(auth, (user) => {
  updateAuthUI(user);
});

// ==============================
//        ЛОГИКА ЖЕЛАНИЙ
// ==============================

// DOM элементы для желаний
const wishInput = document.getElementById("wishInput");
const addWishBtn = document.getElementById("addWishBtn");
const clearWishesBtn = document.getElementById("clearWishesBtn");
const wishListElement = document.getElementById("wishList");
const wishesCountElement = document.getElementById("wishesCount");

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

// Сохранение желаний в localStorage
function saveWishes(wishes) {
  try {
    localStorage.setItem(WISHES_KEY, JSON.stringify(wishes));
  } catch (e) {
    console.warn("Не удалось сохранить желания:", e);
  }
}

// Добавление желания
function addWish(text) {
  const trimmed = (text || "").trim();
  if (!trimmed) return;

  const wishes = loadWishes();
  const now = new Date();
  const dateStr = now.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  wishes.unshift({
    text: trimmed,
    date: dateStr,
  });

  saveWishes(wishes);
  renderWishes();
}

// Удаление одного желания
function removeWish(index) {
  const wishes = loadWishes();
  if (index < 0 || index >= wishes.length) return;
  wishes.splice(index, 1);
  saveWishes(wishes);
  renderWishes();
}

// Очистка всех желаний
function clearWishes() {
  if (!confirm("Точно хочешь очистить все желания? 🥺")) return;
  saveWishes([]);
  renderWishes();
}

// Отрисовка списка желаний
function renderWishes() {
  if (!wishListElement) return;
  const wishes = loadWishes();
  wishListElement.innerHTML = "";

  // Обновляем счётчик желаний
  if (wishesCountElement) {
    wishesCountElement.textContent = wishes.length ? wishes.length + " шт." : "";
  }

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
    metaDiv.textContent = wish.date || "";

    left.appendChild(textDiv);
    left.appendChild(metaDiv);

    const removeBtn = document.createElement("button");
    removeBtn.className = "wish-remove-btn";
    removeBtn.textContent = "×";
    removeBtn.title = "Удалить";

    removeBtn.addEventListener("click", () => {
      removeWish(index);
    });

    li.appendChild(left);
    li.appendChild(removeBtn);
    wishListElement.appendChild(li);
  });
}

// ==== ИНИЦИАЛИЗАЦИЯ БЛОКА ЖЕЛАНИЙ ====
function initWishes() {
  if (addWishBtn) {
    addWishBtn.addEventListener("click", () => {
      if (!wishInput) return;
      addWish(wishInput.value);
      wishInput.value = "";
      wishInput.focus();
    });
  }

  if (wishInput) {
    wishInput.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
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

  renderWishes();
}

document.addEventListener("DOMContentLoaded", () => {
  initWishes();
});
