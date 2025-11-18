// auth-wishes.js
// Авторизация (Firebase) + логика желаний (localStorage)

// ==== ИМПОРТЫ ====
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

import { firebaseConfig, ADMIN_UID } from "./firebase-config.js";

// ==== ИНИЦИАЛИЗАЦИЯ FIREBASE ====
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// ==== ЭЛЕМЕНТЫ ИЗ HTML ====

// авторизация
const emailInput       = document.getElementById("emailInput");
const passwordInput    = document.getElementById("passwordInput");
const emailRegisterBtn = document.getElementById("emailRegisterBtn");
const emailLoginBtn    = document.getElementById("emailLoginBtn");
const googleBtn        = document.getElementById("googleBtn");

const welcomeText  = document.getElementById("welcome-text");
const authArea     = document.getElementById("auth-area");
const authStatus   = document.getElementById("auth-status");
const authForm     = document.querySelector(".auth-form");  // <— добавили

const privateContent = document.getElementById("private-content");
const adminPanel     = document.getElementById("admin-panel");

// желания
const wishInput      = document.getElementById("wishInput");
const addWishBtn     = document.getElementById("addWishBtn");
const clearWishesBtn = document.getElementById("clearWishesBtn");
const wishList       = document.getElementById("wishList");
const wishCount      = document.getElementById("wishCount");

// текущий пользователь
let currentUser = null;

// ==== ПОМОЩНИКИ ДЛЯ UI ====

function setAuthStatus(message, type = "") {
    if (!authStatus) return;
    authStatus.textContent = message || "";
    authStatus.classList.remove("good", "bad");
    if (type === "good") authStatus.classList.add("good");
    if (type === "bad") authStatus.classList.add("bad");
}

// пользователь вошёл
function renderLoggedInUser(user) {
    currentUser = user;

    // Текст приветствия
    if (welcomeText) {
        welcomeText.textContent = `Привет, ${user.displayName || user.email || "моя любовь"} 💖`;
    }

    // Кнопка "Выйти" вместо кнопки "Войти"
    if (authArea) {
        authArea.innerHTML = `
            <button class="btn btn-outline" id="logout-btn">Выйти</button>
        `;
        const logoutBtn = document.getElementById("logout-btn");
        if (logoutBtn) {
            logoutBtn.onclick = () => signOut(auth);
        }
    }

    // 🔥 Скрываем форму авторизации целиком
    if (authForm) {
        authForm.style.display = "none";
    }

    // Открываем контент с желаниями
    if (privateContent) {
        privateContent.style.opacity = "1";
        privateContent.style.pointerEvents = "auto";
    }

    // Админ-панель только для твоего UID
    if (adminPanel) {
        if (user.uid === ADMIN_UID) {
            adminPanel.style.display = "block";
        } else {
            adminPanel.style.display = "none";
        }
    }

    setAuthStatus("Ты в системе, можешь писать желания 💌", "good");

    // Обновляем список желаний для этого пользователя
    loadWishes();
}

// пользователь вышел
function renderLoggedOut() {
    currentUser = null;

    if (welcomeText) {
        welcomeText.textContent = "Ты ещё не вошла в систему 💔";
    }

    // В auth-area ничего не рисуем (кнопки уже есть под формой),
    // оставим пустым, чтобы не путать
    if (authArea) {
        authArea.innerHTML = "";
    }

    // 🔥 Показываем форму обратно
    if (authForm) {
        authForm.style.display = "block";
    }

    // Закрываем контент с желаниями
    if (privateContent) {
        privateContent.style.opacity = "0.3";
        privateContent.style.pointerEvents = "none";
    }

    // Скрываем админ-панель
    if (adminPanel) {
        adminPanel.style.display = "none";
    }

    setAuthStatus("Войди, чтобы мы могли сохранить твои желания 🫶", "bad");

    // Чистим список (на всякий случай, чтобы не светились чужие данные)
    if (wishList) {
        wishList.innerHTML = "";
    }
    if (wishCount) {
        wishCount.textContent = "";
    }
}

// ==== СЛУШАТЕЛЬ СОСТОЯНИЯ АВТОРИЗАЦИИ ====
onAuthStateChanged(auth, (user) => {
    if (user) {
        renderLoggedInUser(user);
    } else {
        renderLoggedOut();
    }
});

// ==== ОБРАБОТЧИКИ АВТОРИЗАЦИИ ====

// Регистрация по email/паролю
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
            setAuthStatus("Аккаунт создан, ты вошла ❤️", "good");
        } catch (err) {
            console.error(err);
            setAuthStatus(err.message, "bad");
        }
    });
}

// Вход по email/паролю
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
            setAuthStatus("Рада тебя видеть снова 💖", "good");
        } catch (err) {
            console.error(err);
            setAuthStatus(err.message, "bad");
        }
    });
}

// Вход через Google
if (googleBtn) {
    googleBtn.addEventListener("click", async () => {
        try {
            await signInWithPopup(auth, provider);
            setAuthStatus("Ты вошла через Google 🌈", "good");
        } catch (err) {
            console.error(err);
            setAuthStatus(err.message, "bad");
        }
    });
}

// ==== ЛОГИКА ЖЕЛАНИЙ (localStorage) ====

function storageKey() {
    return currentUser ? `wishes_${currentUser.uid}` : null;
}

function loadWishes() {
    const key = storageKey();
    if (!key) {
        if (wishList) wishList.innerHTML = "";
        if (wishCount) wishCount.textContent = "";
        return;
    }

    try {
        const raw = localStorage.getItem(key);
        const wishes = raw ? JSON.parse(raw) : [];
        renderWishesList(wishes);
    } catch (e) {
        console.error("Ошибка чтения желаний:", e);
    }
}

function saveWishes(wishes) {
    const key = storageKey();
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(wishes));
}

function renderWishesList(wishes) {
    if (!wishList || !wishCount) return;

    wishList.innerHTML = "";

    if (!wishes || wishes.length === 0) {
        wishCount.textContent = "Пока нет ни одного желания ✨";
        return;
    }

    wishCount.textContent = `Всего желаний: ${wishes.length}`;

    wishes.forEach((item) => {
        const li = document.createElement("li");
        li.className = "wish-item";

        li.innerHTML = `
            <div>
                <div class="wish-text">${item.text}</div>
                <div class="wish-meta">${item.time}</div>
            </div>
            <button class="wish-remove-btn" data-id="${item.id}" title="Удалить">✖</button>
        `;

        wishList.appendChild(li);
    });
}

// Добавить желание
if (addWishBtn) {
    addWishBtn.addEventListener("click", () => {
        if (!currentUser) {
            setAuthStatus("Сначала войди, чтобы я могла сохранить желание 💌", "bad");
            return;
        }

        const text = wishInput.value.trim();
        if (!text) {
            setAuthStatus("Напиши хотя бы пару слов о своём желании ✨", "bad");
            return;
        }

        const key = storageKey();
        if (!key) return;

        const raw = localStorage.getItem(key);
        const wishes = raw ? JSON.parse(raw) : [];

        const item = {
            id: Date.now().toString(),
            text,
            time: new Date().toLocaleString("ru-RU", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }),
        };

        wishes.unshift(item);
        saveWishes(wishes);
        renderWishesList(wishes);

        wishInput.value = "";
        setAuthStatus("Я запомнила твоё желание 💖", "good");
    });
}

// Удаление одного желания (делегирование)
if (wishList) {
    wishList.addEventListener("click", (e) => {
        const btn = e.target.closest(".wish-remove-btn");
        if (!btn) return;

        const id = btn.dataset.id;
        const key = storageKey();
        if (!key) return;

        const raw = localStorage.getItem(key);
        const wishes = raw ? JSON.parse(raw) : [];
        const filtered = wishes.filter((w) => w.id !== id);

        saveWishes(filtered);
        renderWishesList(filtered);
    });
}

// Очистить все желания
if (clearWishesBtn) {
    clearWishesBtn.addEventListener("click", () => {
        if (!currentUser) {
            setAuthStatus("Сначала войди 💌", "bad");
            return;
        }

        if (!confirm("Точно очистить все желания?")) return;

        const key = storageKey();
        if (!key) return;

        localStorage.removeItem(key);
        renderWishesList([]);
        setAuthStatus("Все желания очищены. Можно начинать новый список ✨", "good");
    });
}
