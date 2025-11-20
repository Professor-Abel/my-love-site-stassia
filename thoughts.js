// thoughts.js
// Логика для страницы "Мысли": localStorage + Firestore

// Ключ в localStorage
const STORAGE_KEY = "asyaman_thoughts";

// Элементы
const textarea = document.getElementById("thought-input");
const addBtn = document.getElementById("add-thought");
const clearBtn = document.getElementById("clear-thoughts");
const listContainer = document.getElementById("thoughts-list");

// ==== LOCALSTORAGE ====

// Загрузка мыслей
function loadThoughts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Ошибка чтения мыслей из localStorage:", e);
    return [];
  }
}

// Сохранение мыслей
function saveThoughts(thoughts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(thoughts));
}

// Рендер списка
function renderThoughts() {
  const thoughts = loadThoughts();
  listContainer.innerHTML = "";

  if (thoughts.length === 0) {
    listContainer.innerHTML =
      `<p>Пока здесь пусто. Напиши первую мысль — я её запомню.</p>`;
    return;
  }

  const ul = document.createElement("ul");
  ul.classList.add("thoughts-list");

  thoughts
    .sort((a, b) => b.createdAt - a.createdAt)
    .forEach(item => {
      const li = document.createElement("li");
      li.classList.add("thought-item");

      const text = document.createElement("p");
      text.textContent = item.text;

      const meta = document.createElement("span");
      const date = new Date(item.createdAt);
      meta.textContent =
        "Записано: " +
        date.toLocaleString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      meta.classList.add("thought-meta");

      li.appendChild(text);
      li.appendChild(meta);
      ul.appendChild(li);
    });

  listContainer.appendChild(ul);
}

// ==== FIRESTORE (через хелпер из auth-wishes.js) ====
// Функция отправки мысли на сервер
function saveThoughtToFirestore(text) {
  if (window.saveEntryToFirestore) {
    window.saveEntryToFirestore("thoughts", text);
  } else {
    console.warn("saveEntryToFirestore не доступен");
  }
}

// ==== ДОБАВЛЕНИЕ НОВОЙ МЫСЛИ ====
function addThought() {
  const value = textarea.value.trim();
  if (!value) return;

  // 1) Сохраняем локально
  const thoughts = loadThoughts();
  thoughts.push({
    text: value,
    createdAt: Date.now(),
  });
  saveThoughts(thoughts);

  // 2) Сохраняем в Firestore (если пользователь авторизован)
  saveThoughtToFirestore(value);

  // UI
  textarea.value = "";
  renderThoughts();
}

// ==== ОЧИСТКА МЫСЛЕЙ ====
function clearThoughts() {
  if (!confirm("Точно очистить все записи?")) return;
  localStorage.removeItem(STORAGE_KEY);
  renderThoughts();
}

// ==== СЛУШАТЕЛИ ====
if (addBtn && textarea) {
  addBtn.addEventListener("click", addThought);

  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      addThought();
    }
  });
}

if (clearBtn) {
  clearBtn.addEventListener("click", clearThoughts);
}

// ==== ПЕРВЫЙ РЕНДЕР ====
document.addEventListener("DOMContentLoaded", renderThoughts);
