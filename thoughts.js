// thoughts.js
// Логика страницы "Мысли": LocalStorage + Firestore

// ===== КЛЮЧ LOCALSTORAGE =====
const STORAGE_KEY = "asyaman_thoughts";

// ===== LOCAL STORAGE =====
function loadThoughts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Ошибка чтения мыслей:", e);
    return [];
  }
}

function saveThoughts(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("Ошибка сохранения мыслей:", e);
  }
}

// ===== FIRESTORE: отправка мысли =====
function sendThoughtToFirestore(text) {
  if (window.saveEntryToFirestore) {
    window.saveEntryToFirestore("asyaman_thoughts", text);
  } else {
    console.warn("Firestore недоступен или пользователь не авторизован");
  }
}

// ===== РЕНДЕР =====
function renderThoughts() {
  const listEl = document.getElementById("thoughts-list");

  if (!listEl) return;

  const thoughts = loadThoughts();
  listEl.innerHTML = "";

  if (thoughts.length === 0) {
    const empty = document.createElement("p");
    empty.style.fontSize = "13px";
    empty.style.color = "var(--text-soft)";
    empty.textContent = "Здесь ещё пусто… но я жду твоих мыслей 💜";
    listEl.appendChild(empty);
    return;
  }

  thoughts.forEach((item, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "thought-item";

    const left = document.createElement("div");

    const text = document.createElement("div");
    text.className = "thought-text";
    text.textContent = item.text;

    const meta = document.createElement("div");
    meta.className = "thought-meta";
    meta.textContent = item.date;

    left.appendChild(text);
    left.appendChild(meta);

    const removeBtn = document.createElement("button");
    removeBtn.className = "thought-remove-btn";
    removeBtn.innerHTML = "✕";
    removeBtn.title = "Удалить мысль";

    removeBtn.addEventListener("click", () => {
      const arr = loadThoughts();
      arr.splice(index, 1);
      saveThoughts(arr);
      renderThoughts();
    });

    wrapper.appendChild(left);
    wrapper.appendChild(removeBtn);
    listEl.appendChild(wrapper);
  });
}

// ===== ДОБАВИТЬ МЫСЛЬ =====
function addThought(custom = null) {
  const input = document.getElementById("thought-input");

  const value = custom || (input ? input.value.trim() : "");
  if (!value) return;

  const now = new Date();
  const dateStr = now.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // LocalStorage
  const list = loadThoughts();
  list.unshift({
    text: value,
    date: `Запись от ${dateStr}`,
  });
  saveThoughts(list);

  // Firestore
  sendThoughtToFirestore(value);

  if (input) input.value = "";
  renderThoughts();
}

// ===== ОЧИСТКА ВСЕГО =====
function clearThoughts() {
  if (!confirm("Очистить все записи? Их нельзя будет вернуть.")) return;
  saveThoughts([]);
  renderThoughts();
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener("DOMContentLoaded", () => {
  const addBtn = document.getElementById("add-thought");
  const clearBtn = document.getElementById("clear-thoughts");
  const input = document.getElementById("thought-input");

  // Добавить мысль
  addBtn?.addEventListener("click", () => addThought());

  // Очистить
  clearBtn?.addEventListener("click", clearThoughts);

  // Ctrl + Enter
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      addThought();
    }
  });

  renderThoughts();
});
