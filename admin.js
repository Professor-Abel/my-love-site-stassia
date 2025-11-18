// admin.js
// Простая админ-панель: только для ADMIN_UID

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

import {
    getFirestore,
    collection,
    getDocs,
    query,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ==== ТВОЙ CONFIG (тот же, что в auth-wishes.js) ====
const firebaseConfig = {
    apiKey: "AIzaSyCbgO8b96hAGU3kvwkjsv1x1Is-879Mbgc",
    authDomain: "asyaman-40f1f.firebaseapp.com",
    projectId: "asyaman-40f1f",
    storageBucket: "asyaman-40f1f.firebasestorage.com@",
    messagingSenderId: "780594675672",
    appId: "1:780594675672:web:27766d673b4255a281bcad",
    measurementId: "G-LBMZLEY4Y5"
};

// ТОЛЬКО ты — админ (точно такой же UID, как в auth-wishes.js)
const ADMIN_UID = "QgvеUKbsJLU0A3oehvXgTEbTg1S2";

// ==== ИНИЦИАЛИЗАЦИЯ FIREBASE (аккуратно, чтобы не дублировать) ====
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ==== ЭЛЕМЕНТЫ UI ====
const statusBox   = document.getElementById("admin-status");
const contentBox  = document.getElementById("admin-content");
const usersBody   = document.getElementById("users-body");
const wishesBody  = document.getElementById("wishes-body");
const logoutBtn   = document.getElementById("admin-logout");

function setStatus(message, type = "") {
    if (!statusBox) return;
    statusBox.textContent = message;
    statusBox.classList.remove("good", "bad");
    if (type === "good") statusBox.classList.add("good");
    if (type === "bad")  statusBox.classList.add("bad");
}

function showContent(show) {
    if (!contentBox) return;
    if (show) contentBox.classList.remove("hidden");
    else      contentBox.classList.add("hidden");
}

// ==== ЗАГРУЗКА ПОЛЬЗОВАТЕЛЕЙ ====
async function loadUsers() {
    if (!usersBody) return;
    usersBody.innerHTML = "<tr><td colspan='5'>Загружаю пользователей…</td></tr>";

    try {
        const q = query(
            collection(db, "users"),
            orderBy("lastLogin", "desc"),
            limit(50)
        );
        const snap = await getDocs(q);

        if (snap.empty) {
            usersBody.innerHTML = "<tr><td colspan='5'>Пока нет данных 🤍</td></tr>";
            return;
        }

        let i = 1;
        const rows = [];
        snap.forEach(docSnap => {
            const data = docSnap.data();
            const email = data.email || "—";
            const name  = data.name || data.displayName || "—";
            let last = "—";

            if (data.lastLogin && data.lastLogin.toDate) {
                const d = data.lastLogin.toDate();
                last = d.toLocaleString("ru-RU", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                });
            }

            const uid = data.uid || docSnap.id;

            rows.push(`
                <tr>
                    <td>${i++}</td>
                    <td>${email}</td>
                    <td>${name}</td>
                    <td>${last}</td>
                    <td><span class="badge-uid">${uid}</span></td>
                </tr>
            `);
        });

        usersBody.innerHTML = rows.join("");
    } catch (e) {
        console.error("Ошибка загрузки users:", e);
        usersBody.innerHTML = "<tr><td colspan='5'>Ошибка загрузки пользователей 💔</td></tr>";
    }
}

// ==== ЗАГРУЗКА ЖЕЛАНИЙ ====
async function loadWishes() {
    if (!wishesBody) return;
    wishesBody.innerHTML = "<tr><td colspan='4'>Загружаю желания…</td></tr>";

    try {
        const q = query(
            collection(db, "wishes"),
            orderBy("createdAt", "desc"),
            limit(100)
        );
        const snap = await getDocs(q);

        if (snap.empty) {
            wishesBody.innerHTML = "<tr><td colspan='4'>Желаний пока нет 💭</td></tr>";
            return;
        }

        let i = 1;
        const rows = [];
        snap.forEach(docSnap => {
            const data = docSnap.data();
            const text = (data.text || "").toString();
            const uid  = data.uid || "—";

            let created = "—";
            if (data.createdAt && data.createdAt.toDate) {
                const d = data.createdAt.toDate();
                created = d.toLocaleString("ru-RU", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                });
            }

            rows.push(`
                <tr>
                    <td>${i++}</td>
                    <td><span class="text-ellipsis" title="${text.replace(/"/g, "&quot;")}">${text}</span></td>
                    <td><span class="badge-uid">${uid}</span></td>
                    <td>${created}</td>
                </tr>
            `);
        });

        wishesBody.innerHTML = rows.join("");
    } catch (e) {
        console.error("Ошибка загрузки wishes:", e);
        wishesBody.innerHTML = "<tr><td colspan='4'>Ошибка загрузки желаний 💔</td></tr>";
    }
}

// ==== ЛОГАУТ ====
if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        signOut(auth).catch(err => console.error(err));
    });
}

// ==== ПРОВЕРКА ДОСТУПА ====
onAuthStateChanged(auth, (user) => {
    if (!user) {
        setStatus("Сначала войди в дневник на главной странице 💌", "bad");
        showContent(false);
        return;
    }

    if (user.uid !== ADMIN_UID) {
        setStatus("У тебя нет доступа к этой странице. Она только для хозяина сайта 🙈", "bad");
        showContent(false);
        return;
    }

    setStatus(`Привет, админ 🤍`, "good");
    showContent(true);

    // Грузим данные
    loadUsers();
    loadWishes();
});
