// thoughts.js
// Логика страницы "Мысли": localStorage + Firestore (asyaman_thoughts)

const STORAGE_KEY = "thoughtsList";

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

// ===== FIRESTORE =====
// Отправка записи в Firestore

function sendThoughtToFirestore(text) {
  if (window.saveEntryToFirestore) {
    window.saveEntryToFirestore("asyaman_thoughts", text);
  } else {
    console.warn("Firebase не загружен или пользователь не авторизован");
  }
}

// Пометить запись как удалённую в Firestore
function markThoughtDeletedInFirestore(text) {
  if (window.markEntryDeleted) {
    window.markEntryDeleted("asyaman_thoughts", text);
  }
}



// ===== РЕНДЕР СПИСКА =====

function renderThoughts() {
  const listEl = document.getElementById("thoughts-list");
  if (!listEl) return;

  const items = loadThoughts();
  listEl.innerHTML = "";

  if (!items.length) {
    const empty = document.createElement("p");
    empty.style.fontSize = "13px";
    empty.style.color = "var(--text-soft)";
    empty.textContent = "Здесь ещё пусто… но я жду твоих мыслей 💜";
    listEl.appendChild(empty);
    return;
  }

  items.forEach((item, index) => {
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

    removeBtn.addEventListener("click", () => {
      const arr = loadThoughts();
      const deleted = arr.splice(index, 1);

      saveThoughts(arr);
      renderThoughts();

      // Помечаем удаление в Firestore
      if (deleted[0] && deleted[0].text) {
        markThoughtDeletedInFirestore(deleted[0].text);
      }
    });

    wrapper.appendChild(left);
    wrapper.appendChild(removeBtn);
    listEl.appendChild(wrapper);
  });
}

// ===== ДОБАВИТЬ НОВУЮ МЫСЛЬ =====

function addThought(custom = null) {
  const textarea = document.getElementById("thought-input");
  const value = custom || (textarea ? textarea.value.trim() : "");

  if (!value) return;

  // создаём дату
  const now = new Date();
  const dateStr = now.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // localStorage
  const list = loadThoughts();
  list.unshift({
    text: value,
    date: `Запись от ${dateStr}`,
    deleted: false
  });

  saveThoughts(list);
  renderThoughts();

  if (textarea) textarea.value = "";

  // Firestore
  sendThoughtToFirestore(value);
}

// ===== ОЧИСТКА =====

function clearThoughts() {
  if (!confirm("Очистить все записи? Ты не сможешь вернуть их назад.")) return;

  const items = loadThoughts();

  // помечаем каждую запись как deleted в Firestore
  items.forEach((i) => {
    if (i && i.text) markThoughtDeletedInFirestore(i.text);
  });

  // очищаем localStorage
  saveThoughts([]);
  renderThoughts();
}

// ===== ИНИЦИАЛИЗАЦИЯ =====

document.addEventListener("DOMContentLoaded", () => {
  const addBtn = document.getElementById("add-thought");
  const clearBtn = document.getElementById("clear-thoughts");
  const input = document.getElementById("thought-input");

  addBtn?.addEventListener("click", () => addThought());
  clearBtn?.addEventListener("click", () => clearThoughts());

  // Ctrl + Enter
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      addThought();
    }
  });

  renderThoughts();
});
