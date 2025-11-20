// miss.js
// Логика страницы "Когда скучаешь": LocalStorage + Firestore

const STORAGE_KEY = "missMoments";

// ===== LocalStorage =====
function loadMissMoments() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Ошибка чтения missMoments:", e);
    return [];
  }
}

function saveMissMoments(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("Ошибка сохранения missMoments:", e);
  }
}

// ===== Firestore отправка =====
function sendMissToFirestore(text) {
  if (window.saveEntryToFirestore) {
    window.saveEntryToFirestore("missMoments", text);
  } else {
    console.warn("Firestore недоступен или пользователь не авторизован");
  }
}

// ===== Рендер =====
function renderMissMoments() {
  const listEl = document.getElementById("missList");
  const countEl = document.getElementById("missCount");

  const items = loadMissMoments();
  listEl.innerHTML = "";

  if (items.length === 0) {
    const li = document.createElement("li");
    li.style.fontSize = "13px";
    li.style.color = "var(--text-soft)";
    li.textContent =
      "Здесь пока пусто… но как только ты соскучишься, эта строчка станет нашей 💜";
    listEl.appendChild(li);
    if (countEl) countEl.textContent = "";
    return;
  }

  // Счётчик
  if (countEl) {
    const c = items.length;
    countEl.textContent =
      c + " " + (c === 1 ? "момент" : c < 5 ? "момента" : "моментов");
  }

  // Элементы
  items.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "miss-item";

    const left = document.createElement("div");

    const text = document.createElement("div");
    text.className = "miss-text";
    text.textContent = item.text;

    const meta = document.createElement("div");
    meta.className = "miss-meta";
    meta.textContent = item.date;

    left.appendChild(text);
    left.appendChild(meta);

    const btn = document.createElement("button");
    btn.className = "miss-remove-btn";
    btn.innerHTML = "✕";
    btn.title = "Удалить";

    btn.addEventListener("click", () => {
      const arr = loadMissMoments();
      arr.splice(index, 1);
      saveMissMoments(arr);
      renderMissMoments();
    });

    li.appendChild(left);
    li.appendChild(btn);
    listEl.appendChild(li);
  });
}

// ===== Добавить момент =====
function addMissMoment(customText = null) {
  const input = document.getElementById("missInput");
  const value = customText || (input ? input.value.trim() : "");

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
  const list = loadMissMoments();
  list.unshift({
    text: value,
    date: `Момент скучания от ${dateStr}`,
  });
  saveMissMoments(list);

  // Firestore
  sendMissToFirestore(value);

  if (input) input.value = "";
  renderMissMoments();
}

// ===== Init =====
document.addEventListener("DOMContentLoaded", () => {
  const addBtn = document.getElementById("missAddBtn");
  const clearBtn = document.getElementById("missClearBtn");
  const quickBtn = document.getElementById("missQuickBtn");
  const input = document.getElementById("missInput");

  addBtn?.addEventListener("click", () => addMissMoment());

  clearBtn?.addEventListener("click", () => {
    if (!confirm("Очистить все моменты?")) return;
    saveMissMoments([]);
    renderMissMoments();
  });

  const quickPhrases = [
    "Я просто скучаю по тебе. Без объяснений.",
    "Сейчас бы к тебе, обнять и молчать.",
    "Каждой клеткой чувствую, что тебя не хватает.",
    "Сегодня немного пусто, но мысль о тебе спасает.",
    "Хочу услышать твой голос прямо сейчас.",
  ];

  quickBtn?.addEventListener("click", () => {
    const phrase = quickPhrases[Math.floor(Math.random() * quickPhrases.length)];
    addMissMoment(phrase);
  });

  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      addMissMoment();
    }
  });

  renderMissMoments();
});
