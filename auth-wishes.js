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

// ===== ХЕЛПЕРЫ (запас для других страниц, если пригодятся) =====
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

// ==== ЭЛЕМЕНТЫ АВТОРИЗАЦИИ ====
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

// ==== ЭЛЕМЕНТЫ ЖЕЛАНИЙ ====
const wishInput      = document.getElementById("wishInput");
const addWishBtn     = document.getElementById("addWishBtn");
const clearWishesBtn = document.getElementById("clearWishesBtn");
const wishList       = document.getElementById("wishList");
const wishCount      = document.getElementById("wishCount");

// ==== ПОМОЩНИК ДЛЯ UI ====
function setAuthStatus(message, type = "") {
    if (!authStatus) return;
    authStatus.textContent = message || "";
    authStatus.classList.remove("good", "bad");
    if (type === "good") authStatus.classList.add("good");
    if (type === "bad")  authStatus.classList.add("bad");
}

// === ЗАГРУЗКА ЖЕЛАНИЙ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ ===
async function loadWishes() {
    const uid = currentUser?.uid;
    if (!uid) return;

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
        wishList.innerHTML = "<li>Не удалось загрузить желания 💔</li>";
        wishCount.textContent = "0";
    }
}

// === ДОБАВЛЕНИЕ ЖЕЛАНИЯ С СОХРАНЕНИЕМ В FIRESTORE ===
async function addWish() {
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
            createdAt: serverTimestamp()
        });

        wishInput.value = "";
        setAuthStatus("Желание сохранено ✨", "good");
        await loadWishes();
    } catch (err) {
        console.error("Ошибка сохранения:", err);
        setAuthStatus("Ошибка сохранения 💔", "bad");
    }
}

// ==== СОСТОЯНИЕ «ПОЛЬЗОВАТЕЛЬ ВОШЁЛ» ====
async function renderLoggedInUser(user) {
    currentUser = user;

    // сохраняем/обновляем профиль пользователя в Firestore
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

    // Кнопка "Выйти"
    if (authArea) {
        authArea.innerHTML = `<button class="btn btn-outline" id="logout-btn">Выйти</button>`;
        const logoutBtn = document.getElementById("logout-btn");
        if (logoutBtn) {
            logoutBtn.onclick = () => signOut(auth);
        }
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

    await loadWishes();
}

// ==== СОСТОЯНИЕ «ПОЛЬЗОВАТЕЛЬ ВЫШЕЛ» ====
function renderLoggedOut() {
    currentUser = null;

    if (authTitle) {
        authTitle.innerHTML = 'Вход в наш <span>секретный дневник</span> 💫';
    }

    if (welcomeText) {
        welcomeText.textContent = "Ты ещё не вошла в систему 💔";
    }

    // Убираем кнопки
    if (authArea) authArea.innerHTML = "";

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

    if (wishList)  wishList.innerHTML = "";
    if (wishCount) wishCount.textContent = "";
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
            setAuthStatus("Введи email и пароль 💌", "bad";
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

// ==== ОБРАБОТЧИК КНОПКИ "ДОБАВИТЬ ЖЕЛАНИЕ" ====
if (addWishBtn) {
    addWishBtn.addEventListener("click", addWish);
}

// Очистка желаний — пока заглушка (можем потом сделать через Firestore)
if (clearWishesBtn) {
    clearWishesBtn.addEventListener("click", () => {
        setAuthStatus("Очистку желаний мы сделаем чуть позже 🛠", "bad");
    });
}
