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
  // storageBucket сейчас тебе не важен, но пусть будет корректный:
  storageBucket: "asyaman-40f1f.appspot.com",
  messagingSenderId: "780594675672",
  appId: "1:780594675672:web:27766d673b4255a281bcad",
  measurementId: "G-LBMZLEY4Y5"
};

// ==== ИНИЦИАЛИЗАЦИЯ FIREBASE ====
const app      = initializeApp(firebaseConfig);
const auth     = getAuth(app);
const db       = getFirestore(app);
const provider = new GoogleAuthProvider();

// Текущий пользователь (доступен и с других файлов)
let currentUser = null;
window.__currentUser = null;

// ===== ХЕЛПЕРЫ ДЛЯ ДРУГИХ СТРАНИЦ (Мысли / Когда скучаешь) =====
export async function saveEntryToFirestore(collectionName, text) {
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

export async function loadMyEntries(collectionName) {
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

// Сделаем хелперы доступными через window
window.saveEntryToFirestore = saveEntryToFirestore;
window.loadMyEntries = loadMyEntries;

// ===== ВЕСЬ UI-КОД ВНУТРИ DOMContentLoaded =====
document.addEventListener("DOMContentLoaded", () => {
  // ==== ЭЛЕМЕНТЫ АВТОРИЗАЦИИ ====
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

  // ==== ЭЛЕМЕНТЫ ЖЕЛАНИЙ (Только на главной) ====
  const wishInput      = document.getElementById("wishInput");
  const addWishBtn     = document.getElementById("addWishBtn");
  const clearWishesBtn = document.getElementById("clearWishesBtn");
  const wishList       = document.getElementById("wishList");
  const wishCount      = document.getElementById("wishCount");

  // ==== ЭЛЕМЕНТЫ ПАНЕЛИ НАСТРОЕК (внизу с шестерёнкой) ====
  const settingsAccountInfo  = document.getElementById("settingsAccountInfo");

  // ===== ПОМОЩНИК ДЛЯ СТАТУСА АВТОРИЗАЦИИ =====
  function setAuthStatus(message, type = "") {
    if (!authStatus) return;
    authStatus.textContent = message || "";
    authStatus.classList.remove("good", "bad");
    if (type === "good") authStatus.classList.add("good");
    if (type === "bad")  authStatus.classList.add("bad");
  }

  // ===== ОБНОВЛЕНИЕ ПОДПИСИ В НАСТРОЙКАХ =====
  function updateSettingsUI() {
    if (!settingsAccountInfo) return;
    const u = window.__currentUser;
    if (u && u.email) {
      settingsAccountInfo.textContent = u.email;
    } else if (u) {
      settingsAccountInfo.textContent = "Авторизованный пользователь";
    } else {
      settingsAccountInfo.textContent =
        "Гость (зайди в дневник, чтобы сохранить настройки)";
    }
  }

  // ===== ЗАГРУЗКА ЖЕЛАНИЙ ТЕКУЩЕГО ЮЗЕРА =====
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

      if (snap.empty) {
        wishList.innerHTML = "<li>Пока пусто 💭</li>";
        wishCount.textContent = "0";
        return;
      }

      let html = "";
      snap.forEach(docSnap => {
        const w = docSnap.data();
        const date =
          w.createdAt?.toDate?.().toLocaleString("ru-RU") || "когда-то";
        html += `
          <li class="wish-item">
            <div>
              <div class="wish-text">${w.text}</div>
              <div class="wish-meta">${date}</div>
            </div>
          </li>
        `;
      });

      wishList.innerHTML = html;
      wishCount.textContent = String(snap.size);
    } catch (e) {
      console.error("Ошибка загрузки желаний:", e);
      wishList.innerHTML = "<li>Не удалось загрузить желания 💔</li>";
      wishCount.textContent = "0";
    }
  }

  // ===== ДОБАВЛЕНИЕ ЖЕЛАНИЯ =====
  async function addWish() {
    if (!wishInput) return;
    const text = wishInput.value.trim();
    if (!text) return;

    const user = auth.currentUser;
    if (!user) {
      setAuthStatus("Войдите, чтобы сохранять свои желания 💌", "bad");
      return;
    }

    try {
      await addDoc(collection(db, "wishes"), {
        text,
        uid: user.uid,
        email: user.email || null,
        createdAt: serverTimestamp()
      });

      wishInput.value = "";
      setAuthStatus("Желание сохранено ✨", "good");
      await loadWishes();
    } catch (err) {
      console.error("Ошибка сохранения желания:", err);
      setAuthStatus("Ошибка сохранения 💔", "bad");
    }
  }

  // ===== АДМИН-ПАНЕЛЬ: ЗАГРУЗКА ПОЛЬЗОВАТЕЛЕЙ И ЖЕЛАНИЙ =====
  async function loadAdminData() {
    // если нет админ-панели на странице — выходим
    if (!adminPanel) return;
    // можно сделать, что админ — любой вошедший пользователь (только ты знаешь адрес)
    if (!currentUser) return;

    const usersBody  = document.getElementById("admin-users-body");
    const wishesBody = document.getElementById("admin-wishes-body");

    if (!usersBody && !wishesBody) return;

    // ---- ПОЛЬЗОВАТЕЛИ ----
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

    // ---- ВСЕ ЖЕЛАНИЯ ----
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
        console.error("Ошибка загрузки желаний для админа:", e);
      }
    }
  }

  // ===== ПЕРЕКЛЮЧЕНИЕ СОСТОЯНИЯ UI ПРИ ВХОДЕ/ВЫХОДЕ =====
  async function renderLoggedInUser(user) {
    currentUser = user;
    window.__currentUser = user;

    // Обновляем / создаём профиль пользователя в коллекции "users"
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
      welcomeText.textContent = `Привет, ${user.email || "моя любовь"} 💖`;
    }

    if (authArea) {
      authArea.innerHTML = `<button class="btn btn-outline" id="logout-btn">Выйти</button>`;
      const logoutBtn = document.getElementById("logout-btn");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
          signOut(auth);
        });
      }
    }

    if (authForm) {
      authForm.style.display = "block";
    }

    if (privateContent) {
      privateContent.style.opacity = "1";
      privateContent.style.pointerEvents = "auto";
    }

    if (adminPanel) {
      adminPanel.style.display = "block";
    }

    setAuthStatus("Ты в системе, можно писать желания 💌", "good");

    // Загружаем свои желания
    await loadWishes();

    // Обновляем подпись в настройках
    updateSettingsUI();

    // Загружаем данные для админа
    await loadAdminData();
  }

  function renderLoggedOut() {
    currentUser = null;
    window.__currentUser = null;

    if (authTitle) {
      authTitle.innerHTML = 'Вход в наш <span>секретный дневник</span> 💫';
    }

    if (welcomeText) {
      welcomeText.textContent = "Ты ещё не вошла в систему 💔";
    }

    if (authArea) {
      authArea.innerHTML = "";
    }

    if (authForm) {
      authForm.style.display = "block";
    }

    if (privateContent) {
      privateContent.style.opacity = "0.3";
      privateContent.style.pointerEvents = "none";
    }

    if (adminPanel) {
      adminPanel.style.display = "none";
    }

    setAuthStatus("Войди, чтобы мы могли сохранить твои желания 🫶", "bad");

    if (wishList)  wishList.innerHTML = "";
    if (wishCount) wishCount.textContent = "";

    updateSettingsUI();
  }

  // ===== СЛУШАТЕЛЬ ИЗМЕНЕНИЯ АВТОРИЗАЦИИ =====
  onAuthStateChanged(auth, (user) => {
    console.log("auth state changed:", user);
    if (user) {
      renderLoggedInUser(user);
    } else {
      renderLoggedOut();
    }
  });

  // ===== ОБРАБОТЧИКИ КНОПОК АВТОРИЗАЦИИ =====

  if (emailRegisterBtn) {
    emailRegisterBtn.addEventListener("click", async () => {
      const email = emailInput?.value.trim();
      const pass  = passwordInput?.value.trim();

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

  if (emailLoginBtn) {
    emailLoginBtn.addEventListener("click", async () => {
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
        setAuthStatus(err.message, "bad");
      }
    });
  }

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

  // Кнопка "Добавить желание"
  if (addWishBtn) {
    addWishBtn.addEventListener("click", addWish);
  }

  // Кнопка "Очистить все желания" — пока просто сообщение
  if (clearWishesBtn) {
    clearWishesBtn.addEventListener("click", () => {
      setAuthStatus("Полную очистку желаний сделаем чуть позже 🛠", "bad");
    });
  }

  // В самом конце — подтягиваем подпись в настройках
  updateSettingsUI();
});
