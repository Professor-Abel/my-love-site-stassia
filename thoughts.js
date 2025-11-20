// thoughts.js
// Логика для страницы "Мысли" (localStorage)

// Ключ в localStorage
const STORAGE_KEY = "asyaman_thoughts";

// Получаем элементы
const textarea = document.getElementById("thought-input");
const addBtn = document.getElementById("add-thought");
const clearBtn = document.getElementById("clear-thoughts");
const listContainer = document.getElementById("thoughts-list");

// Читаем из localStorage
function loadThoughts() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error("Ошибка чтения мыслей из localStorage", e);
    return [];
  }
}

// Сохраняем в localStorage
function saveThoughts(thoughts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(thoughts));
}

// Рендер списка
function renderThoughts() {
  const thoughts = loadThoughts();
  listContainer.innerHTML = "";

  if (thoughts.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "Пока здесь пусто. Напиши первую мысль — я её запомню.";
    listContainer.appendChild(empty);
    return;
  }

  const ul = document.createElement("ul");
  ul.classList.add("thoughts-list");

  thoughts
    .sort((a, b) => b.createdAt - a.createdAt) // новые сверху
    .forEach((item) => {
      const li = document.createElement("li");
      li.classList.add("thought-item");

      const text = document.createElement("p");
      text.textContent = item.text;

      const meta = document.createElement("span");
      const date = new Date(item.createdAt);
      const formatted = date.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      meta.textContent = `Записано: ${formatted}`;
      meta.classList.add("thought-meta");

      li.appendChild(text);
      li.appendChild(meta);
      ul.appendChild(li);
    });

  listContainer.appendChild(ul);
}

// Добавление новой мысли
function addThought() {
  const value = textarea.value.trim();
  if (!value) return;

  const thoughts = loadThoughts();
  thoughts.push({
    text: value,
    createdAt: Date.now(),
  });
  saveThoughts(thoughts);
  textarea.value = "";
  renderThoughts();
}

// Очистка всех мыслей
function clearThoughts() {
  if (!confirm("Точно очистить все записи?")) return;
  localStorage.removeItem(STORAGE_KEY);
  renderThoughts();
}

// Слушатели
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

// Первый рендер
document.addEventListener("DOMContentLoaded", renderThoughts);
