// thoughts.js
// Локальный дневник мыслей — только в браузере, без Firebase.

const THOUGHTS_KEY = "asyaman_thoughts";

function loadThoughts() {
  try {
    const raw = localStorage.getItem(THOUGHTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Ошибка чтения мыслей:", e);
    return [];
  }
}

function saveThoughts(list) {
  try {
    localStorage.setItem(THOUGHTS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("Ошибка сохранения мыслей:", e);
  }
}

function renderThoughts() {
  const listEl = document.getElementById("thoughtList");
  const counterMiss = document.getElementById("missCount"); // просто, чтобы не оставлять пустым
  if (!listEl) return;

  const items = loadThoughts();
  listEl.innerHTML = "";

  if (!items.length) {
    const li = document.createElement("li");
    li.className = "thought-item";
    li.textContent = "Пока здесь пусто. Можно начать с одной маленькой мысли.";
    listEl.appendChild(li);
    if (counterMiss) counterMiss.textContent = "0";
    return;
  }

  items
    .sort((a, b) => b.createdAt - a.createdAt)
    .forEach((item) => {
      const li = document.createElement("li");
      li.className = "thought-item";

      const textEl = document.createElement("div");
      textEl.textContent = item.text;

      const meta = document.createElement("div");
      meta.className = "thought-meta";
      const date = new Date(item.createdAt);
      const formatted = date.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      meta.textContent = `Записано ${formatted}`;

      li.appendChild(textEl);
      li.appendChild(meta);
      listEl.appendChild(li);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("thoughtInput");
  const addBtn = document.getElementById("addThoughtBtn");
  const clearBtn = document.getElementById("clearThoughtsBtn");

  if (!input || !addBtn || !clearBtn) {
    return;
  }

  function addThought() {
    const text = (input.value || "").trim();
    if (!text) return;

    const current = loadThoughts();
    current.push({
      id: Date.now(),
      text,
      createdAt: Date.now(),
    });
    saveThoughts(current);
    input.value = "";
    renderThoughts();
  }

  addBtn.addEventListener("click", addThought);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      addThought();
    }
  });

  clearBtn.addEventListener("click", () => {
    if (!confirm("Точно очистить все мысли?")) return;
    saveThoughts([]);
    renderThoughts();
  });

  renderThoughts();
});
