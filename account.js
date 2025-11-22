// account.js
// Личный профиль пользователя (имя, "о себе", аватар)

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

// тот же конфиг, что и в auth-wishes.js
const firebaseConfig = {
  apiKey: "AIzaSyCbgO8b96hAGU3kvwkjsv1x1Is-879Mbgc",
  authDomain: "asyaman-40f1f.firebaseapp.com",
  projectId: "asyaman-40f1f",
  storageBucket: "asyaman-40f1f.appspot.com",
  messagingSenderId: "780594675672",
  appId: "1:780594675672:web:27766d673b4255a281bcad"
};

// аккуратно инициализируем: если апп уже создан в auth-wishes.js — просто берём его
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// элементы
const accountView  = document.getElementById("account-view");
const accountGuest = document.getElementById("account-guest");
const accountEdit  = document.getElementById("account-edit");

const emailEl        = document.getElementById("account-email");
const displayNameEl  = document.getElementById("account-displayName");
const aboutEl        = document.getElementById("account-about");
const avatarEl       = document.getElementById("account-avatar");

const editBtn   = document.getElementById("account-edit-btn");
const saveBtn   = document.getElementById("account-save-btn");
const cancelBtn = document.getElementById("account-cancel-btn");

const displayNameInput = document.getElementById("account-displayName-input");
const aboutInput       = document.getElementById("account-about-input");
const avatarInput      = document.getElementById("account-avatar-input");

const statusEl = document.getElementById("account-status");

let currentUser   = null;
let currentProfile = null;

function setStatus(text, type = "") {
  if (!statusEl) return;
  statusEl.textContent = text || "";
  statusEl.classList.remove("good", "bad");
  if (type) statusEl.classList.add(type);
}

// загрузка / создание документа профиля
async function loadProfile(user) {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    currentProfile = snap.data();
  } else {
    currentProfile = {
      email: user.email || "",
      displayName: user.displayName || "",
      about: "",
      photoURL: "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(userRef, currentProfile, { merge: true });
  }

  renderProfile(user, currentProfile);
}

function renderProfile(user, profile) {
  if (!accountView || !accountGuest || !accountEdit) return;

  emailEl.textContent       = user.email || "без почты";
  displayNameEl.textContent = profile.displayName || "Без имени";
  aboutEl.textContent       = profile.about || "Пока пусто…";

  if (profile.photoURL) {
    avatarEl.src = profile.photoURL;
  } else {
    avatarEl.src = "secret-photo.jpg"; // дефолтный аватар
  }

  accountView.style.display  = "block";
  accountGuest.style.display = "none";
  accountEdit.style.display  = "none";
}

function openEdit() {
  if (!currentUser || !currentProfile) return;

  displayNameInput.value = currentProfile.displayName || "";
  aboutInput.value       = currentProfile.about || "";

  accountView.style.display  = "none";
  accountGuest.style.display = "none";
  accountEdit.style.display  = "block";
  setStatus("");
}

function cancelEdit() {
  accountEdit.style.display = "none";
  if (currentUser) {
    accountView.style.display  = "block";
    accountGuest.style.display = "none";
  } else {
    accountView.style.display  = "none";
    accountGuest.style.display = "block";
  }
  setStatus("");
}

async function saveProfile() {
  if (!currentUser) return;

  const userRef = doc(db, "users", currentUser.uid);
  let photoURL = currentProfile?.photoURL || "";

  const file = avatarInput.files[0];

  // если выбрали новую картинку — загружаем в Storage
  if (file) {
    try {
      const avatarRef = ref(storage, `avatars/${currentUser.uid}.jpg`);
      await uploadBytes(avatarRef, file);
      photoURL = await getDownloadURL(avatarRef);
    } catch (err) {
      console.error("avatar upload error", err);
      setStatus("Не получилось загрузить аватар 😔", "bad");
      return;
    }
  }

  const updateData = {
    displayName: displayNameInput.value.trim(),
    about:       aboutInput.value.trim(),
    photoURL,
    updatedAt: serverTimestamp()
  };

  try {
    await setDoc(userRef, updateData, { merge: true });
    currentProfile = { ...(currentProfile || {}), ...updateData };
    renderProfile(currentUser, currentProfile);
    setStatus("Профиль сохранён 💫", "good");
  } catch (err) {
    console.error(err);
    setStatus("Ошибка при сохранении профиля", "bad");
  }
}

// слушаем логин/логаут
onAuthStateChanged(auth, async (user) => {
  currentUser = user;

  if (!accountView || !accountGuest || !accountEdit) return;

  if (user) {
    accountGuest.style.display = "none";
    accountEdit.style.display  = "none";
    accountView.style.display  = "block";

    try {
      await loadProfile(user);
    } catch (err) {
      console.error(err);
      setStatus("Не получилось загрузить профиль", "bad");
    }
  } else {
    currentProfile = null;
    accountView.style.display  = "none";
    accountEdit.style.display  = "none";
    accountGuest.style.display = "block";
  }
});

// обработчики кнопок
if (editBtn)   editBtn.addEventListener("click", openEdit);
if (cancelBtn) cancelBtn.addEventListener("click", cancelEdit);
if (saveBtn)   saveBtn.addEventListener("click", (e) => {
  e.preventDefault();
  saveProfile();
});
