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
  authDomain: "asyaman-40f1f.firebaseapp.com",
  projectId: "asyaman-40f1f",
  storageBucket: "asyaman-40f1f.firebasestorage.app",
  messagingSenderId: "780594675672",
  appId: "1:780594675672:web:ccd9c524a20721ba81bcad",
  measurementId: "G-MMMTD9XENH"
};

// ТОЛЬКО ты — админ
const ADMIN_UID = "QgvеUKbsJLU0A3oehvXgTEbTg1S2";

// ==== ИНИЦИАЛИЗАЦИЯ FIREBASE ====
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// ==== ЭЛЕМЕНТЫ АВТОРИЗАЦИИ ====
const emailInput       = document.getElementById("emailInput");
const passwordInput    = document.getElementById("passwordInput");
const emailRegisterBtn = document.getElementById("emailRegisterBtn");
const emailLoginBtn    = document.getElementById("emailLoginBtn");
const googleBtn        = document.getElementById("googleBtn");

const welcomeText  = document.getElementById("welcome-text");
const authArea     = document.getElementById("auth-area");
const authStatus   = document.getElementById("auth-status");
const authForm     = document.querySelector(".auth-form");

const privateContent = document.getElementById("private-content");
const adminPanel     = document.getElementById("admin-panel");

// ==== ЭЛЕМЕНТЫ ЖЕЛАНИЙ ====
const wishInput      = document.getElementById("wishInput");
const addWishBtn     = document.getElementById("addWishBtn");
const clearWishesBtn = document.getElementById("clearWishesBtn");
const wishList       = document.getElementById("wishList");
const wishCount      = document.getElementById("wishCount");

// Текущий пользователь
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

    welcomeText.textContent = `Привет, ${user.displayName || "моя любовь"} 💖`;

    // Кнопка "Выйти"
    authArea.innerHTML = `<button class="btn btn-outline" id="logout-btn">Выйти</button>`;
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.onclick = () => signOut(auth);
    }

    // Скрываем форму логина
    if (authForm) authForm.style.display = "none";

    // Открываем блок желаний
    if (privateContent) {
        privateContent.style.opacity = "1";
        privateContent.style.pointerEvents = "auto";
    }

    // Админ-панель только для твоего UID
    if (adminPanel) {
        adminPanel.style.display = user.uid === ADMIN_UID ? "block" : "none";
    }

    setAuthStatus("Ты в системе, можешь писать желания 💌", "good");

    // Загружаем желания для этого пользователя
    loadWishes();
}

// пользователь вышел
function renderLoggedOut() {
    currentUser = null;

    welcomeText.textContent = "Ты ещё не вошла в систему 💔";

    // Убираем кнопки
    authArea.innerHTML = "";

    // Показываем форму
    if (authForm) authForm.style.display = "block";

    // Закрываем блок желаний
    if (privateContent) {
        privateContent.style.opacity = "0.3";
        privateContent.style.pointerEvents = "none";
    }

    // Скрываем админ-панель
    if (adminPanel) adminPanel.style.display = "none";

    setAuthStatus("Войди, чтобы мы могли сохранить твои желания 🫶", "bad");

    wishList.innerHTML = "";
    wishCount.textContent = "";
}

// ==== СЛУШАТЕЛЬ СОСТОЯНИЯ АВТОРИЗАЦИИ ====
onAuthStateChanged(auth, (user) => {
    console.log("auth state changed. user =", user);
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
        wishList.innerHTML = "";
        wishCount.textContent = "";
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

// Удаление одного желания
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
