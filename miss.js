// miss.js
// Логика страницы "Когда скучаешь": localStorage + Firestore

// ===== LOCAL STORAGE =====
const STORAGE_KEY = "missMoments";

// Загрузить моменты
function loadMissMoments() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Ошибка чтения missMoments:", e);
    return [];
  }
}

// Сохранить моменты
function saveMissMoments(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("Ошибка сохранения missMoments:", e);
  }
}

// ===== FIRESTORE =====
// Отправка в Firestore (только если Firebase подключён и есть пользователь)
function sendMissToFirestore(text) {
  try {
    if (window.saveEntryToFirestore) {
      window.saveEntryToFirestore("missMoments", text);
    } else {
      console.warn("Firestore недоступен — запись сохранена только локально");
    }
  } catch (e) {
    console.error("Ошибка отправки в Firestore:", e);
  }
}

// ===== РЕНДЕР СПИСКА =====
function renderMissMoments() {
  const listEl = document.getElementById("missList");
  const countEl = document.getElementById("missCount");
  if (!listEl) return;

  const items = loadMissMoments();
  listEl.innerHTML = "";

  // Пусто?
  if (items.length === 0) {
    const empty = document.createElement("li");
    empty.style.fontSize = "13px";
    empty.style.color = "var(--text-soft)";
    empty.textContent =
      "Здесь пока пусто… но как только ты соскучишься, эта строчка станет нашей 💜";
    listEl.appendChild(empty);

    if (countEl) countEl.textContent = "";
    return;
  }

  // Обновить счётчик
  if (countEl) {
    const c = items.length;
    countEl.textContent =
      `${c} ${c === 1 ? "момент" : c < 5 ? "момента" : "моментов"}`;
  }

  // Отрисовать
  items.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "miss-item";

    // Левая часть
    const left = document.createElement("div");

    const text = document.createElement("div");
    text.className = "miss-text";
    text.textContent = item.text;

    const meta = document.createElement("div");
    meta.className = "miss-meta";
    meta.textContent = item.date;

    left.appendChild(text);
    left.appendChild(meta);

    // Кнопка удаления
    const removeBtn = document.createElement("button");
    removeBtn.className = "miss-remove-btn";
    removeBtn.innerHTML = "✕";
    removeBtn.title = "Удалить";

    removeBtn.addEventListener("click", () => {
      const arr = loadMissMoments();
      arr.splice(index, 1);
      saveMissMoments(arr);
      renderMissMoments();
    });

    li.appendChild(left);
    li.appendChild(removeBtn);

    listEl.appendChild(li);
  });
}

// ===== ДОБАВИТЬ НОВЫЙ МОМЕНТ =====
function addMissMoment(custom = null) {
  const input = document.getElementById("missInput");
  const text = custom || (input ? input.value.trim() : "");
  if (!text) return;

  const now = new Date();
  const dateStr = now.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const list = loadMissMoments();
  list.unshift({
    text,
    date: `Момент скучания от ${dateStr}`,
  });

  saveMissMoments(list);
  sendMissToFirestore(text);

  if (input) input.value = "";

  renderMissMoments();
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener("DOMContentLoaded", () => {
  const addBtn = document.getElementById("missAddBtn");
  const clearBtn = document.getElementById("missClearBtn");
  const quickBtn = document.getElementById("missQuickBtn");
  const input = document.getElementById("missInput");

  // Добавить
  addBtn?.addEventListener("click", () => addMissMoment());

  // Очистить
  clearBtn?.addEventListener("click", () => {
    if (!confirm("Очистить все моменты?")) return;
    saveMissMoments([]);
    renderMissMoments();
  });

  // Быстрые фразы
  const quick = [
    "Я просто скучаю по тебе. Без объяснений.",
    "Сейчас бы к тебе, обнять и молчать.",
    "Каждой клеткой чувствую, как не хватает тебя рядом.",
    "Немного потерялся сегодня, но мысль о тебе держит.",
    "Хочу твой голос, твоё плечо и твой смех прямо сейчас."
  ];

  quickBtn?.addEventListener("click", () =>
    addMissMoment(quick[Math.floor(Math.random() * quick.length)])
  );

  // Ctrl+Enter
  input?.addEventListener("keydown", e => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      addMissMoment();
    }
  });

  // Первичная загрузка
  renderMissMoments();
});
