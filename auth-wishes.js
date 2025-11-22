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
  authDomain: "asyaman-auth-wishes.firebaseapp.com",
  projectId: "asyaman-auth-wishes",
  storageBucket: "asyaman-auth-wishes.firebasestorage.app",
  messagingSenderId: "1006189945241",
  appId: "1:1006189945241:web:ae5f96e9b16bbf38cbf06c",
  measurementId: "G-48WT4REHLC"
};

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

const authGuestBlock = document.getElementById("auth-guest-block");
const authUserBlock = document.getElementById("auth-user-block");
const authUserEmailSpan = document.getElementById("authUserEmail");
const logoutBtn = document.getElementById("logoutBtn");

const tabButtons = document.querySelectorAll(".tab-button");

// Блоки аккаунта (профиль) — чтобы показать, кто вошёл
const accountGuestBlock = document.getElementById("account-guest");
const accountViewBlock = document.getElementById("account-view");
const accountEmailSpan = document.getElementById("account-email");

// Статус аккаунта в настройках
const settingsAccountInfo = document.getElementById("settingsAccountInfo");

// Переменная для режима (login / register)
let authMode = "login"; // по умолчанию

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
  if (type) {
    authStatusElement.classList.add(type);
  }
}

// Сохранение информации о последнем аккаунте (для отображения в настройках)
function saveLastUserInfo(email) {
  if (!email) return;
  try {
    localStorage.setItem("asyaman_last_email", email);
  } catch (e) {
    console.warn("Не удалось сохранить last_email:", e);
  }
}

// ==== ОБНОВЛЕНИЕ UI В ЗАВИСИМОСТИ ОТ СОСТОЯНИЯ ВХОДА ====
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

    setAuthStatus("");
  }

  } else {
    // Нет пользователя
    if (authGuestBlock) authGuestBlock.style.display = "";
    if (authUserBlock) authUserBlock.style.display = "none";
    if (authUserEmailSpan) authUserEmailSpan.textContent = "";

    // Аккаунт
    if (accountGuestBlock) accountGuestBlock.style.display = "";
    if (accountViewBlock) accountViewBlock.style.display = "none";
    if (accountEmailSpan) accountEmailSpan.textContent = "";

    if (settingsAccountInfo) {
      settingsAccountInfo.textContent = "Гость (зайди в дневник, чтобы сохранить настройки)";
    }

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
      let userCredential;
      if (authMode === "register") {
        // Регистрация
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        setAuthStatus("Регистрация успешна, вход выполнен", "success");
      } else {
        // Вход
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        setAuthStatus("Вход выполнен", "success");
      }

      const user = userCredential.user;
      if (user && user.email) {
        saveLastUserInfo(user.email);
      }
    } catch (error) {
      console.error("Ошибка авторизации:", error);
      let msg = "Произошла ошибка. Попробуй ещё раз.";
      if (error.code === "auth/invalid-email") {
        msg = "Некорректный email.";
      } else if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        msg = "Неверный email или пароль.";
      } else if (error.code === "auth/email-already-in-use") {
        msg = "Такой email уже зарегистрирован. Попробуйте войти.";
      } else if (error.code === "auth/weak-password") {
        msg = "Пароль слишком слабый. Попробуй что-то посложнее.";
      }
      setAuthStatus(msg, "error");
    }
  });
}

// Вход через Google
if (googleLoginBtn) {
  googleLoginBtn.addEventListener("click", async () => {
    setAuthStatus("Открываю окно Google…", "");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const email = user?.email || "";
      if (email) {
        saveLastUserInfo(email);
      }
      setAuthStatus("Вход через Google выполнен", "success");
    } catch (error) {
      console.error("Ошибка входа через Google:", error);
      setAuthStatus("Не удалось войти через Google. Попробуй ещё раз.", "error");
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
      console.error("Ошибка при выходе:", error);
      setAuthStatus("Не получилось выйти. Попробуй ещё раз.", "error");
    }
  });
}

// Слушатель изменения состояния авторизации
onAuthStateChanged(auth, (user) => {
  updateAuthUI(user);
});

// ==== ЛОГИКА ЖЕЛАНИЙ (localStorage) ====

// Ключ для хранения в localStorage
const WISHES_KEY = "asyaman_wishes";

// Элементы для желаний
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

// Отрисовка списка желаний
function renderWishes() {
  if (!wishListElement) return;
  const wishes = loadWishes();
  wishListElement.innerHTML = "";

  // Обновляем счётчик желаний в заголовке
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
    removeBtn.title = "Удалить желание";
    removeBtn.addEventListener("click", () => {
      removeWish(index);
    });

    li.appendChild(left);
    li.appendChild(removeBtn);
    wishListElement.appendChild(li);
  });
}

// Добавление нового желания
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
    minute: "2-digit"
  });

  wishes.unshift({
    text: trimmed,
    date: dateStr
  });

  saveWishes(wishes);
  renderWishes();
}

// Удаление одного желания по индексу
function removeWish(index) {
  const wishes = loadWishes();
  if (index < 0 || index >= wishes.length) return;
  wishes.splice(index, 1);
  saveWishes(wishes);
  renderWishes();
}

// Очистка всех желаний
function clearWishes() {
  if (!confirm("Точно удалить все желания?")) return;
  saveWishes([]);
  renderWishes();
}

// Обработчики для формы желаний
if (addWishBtn && wishInput) {
  addWishBtn.addEventListener("click", () => {
    addWish(wishInput.value);
    wishInput.value = "";
    wishInput.focus();
  });

  wishInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.ctrlKey) {
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
