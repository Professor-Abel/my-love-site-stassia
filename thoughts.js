// thoughts.js
// Логика для раздела "Мысли": localStorage, добавление, удаление, очистка

(function () {
  const STORAGE_KEY = "asyaman_thoughts";

  // Элементы DOM
  const inputEl = document.getElementById("thought-input");
  const addBtn = document.getElementById("add-thought");
  const clearBtn = document.getElementById("clear-thoughts");
  const listEl = document.getElementById("thoughts-list");

  if (!inputEl || !addBtn || !clearBtn || !listEl) {
    // Если по какой-то причине разметки нет — выходим тихо
    return;
  }

  // ===== Работа с localStorage =====

  function loadThoughts() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch (e) {
      console.warn("Не удалось загрузить мысли:", e);
      return [];
    }
  }

  function saveThoughts(thoughts) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(thoughts));
    } catch (e) {
      console.warn("Не удалось сохранить мысли:", e);
    }
  }

  // ===== Отрисовка =====

  function renderThoughts() {
    const thoughts = loadThoughts();
    listEl.innerHTML = "";

    if (thoughts.length === 0) {
      const empty = document.createElement("div");
      empty.textContent = "Пока здесь пусто. Напиши первую мысль 💭";
      empty.style.fontSize = "12px";
      empty.style.color = "rgba(148, 163, 184, 0.9)";
      listEl.appendChild(empty);
      return;
    }

    thoughts.forEach((th, index) => {
      const item = document.createElement("div");
      item.className = "thought-item";

      const left = document.createElement("div");
      left.style.flex = "1";

      const textDiv = document.createElement("div");
      textDiv.className = "thought-text";
      textDiv.textContent = th.text || "";

      const metaDiv = document.createElement("div");
      metaDiv.className = "thought-meta";
      metaDiv.textContent = th.date || "";

      left.appendChild(textDiv);
      left.appendChild(metaDiv);

      const removeBtn = document.createElement("button");
      removeBtn.className = "thought-remove-btn";
      removeBtn.textContent = "×";
      removeBtn.title = "Удалить запись";
      removeBtn.addEventListener("click", () => {
        removeThought(index);
      });

      item.appendChild(left);
      item.appendChild(removeBtn);

      listEl.appendChild(item);
    });
  }

  // ===== Операции с мыслями =====

  function addThought(text) {
    const trimmed = (text || "").trim();
    if (!trimmed) return;

    const thoughts = loadThoughts();
    const now = new Date();
    const dateStr = now.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Добавляем в начало списка
    thoughts.unshift({
      text: trimmed,
      date: dateStr,
    });

    saveThoughts(thoughts);
    renderThoughts();
  }

  function removeThought(index) {
    const thoughts = loadThoughts();
    if (index < 0 || index >= thoughts.length) return;
    thoughts.splice(index, 1);
    saveThoughts(thoughts);
    renderThoughts();
  }

  function clearThoughts() {
    if (!confirm("Точно удалить все записи?")) return;
    saveThoughts([]);
    renderThoughts();
  }

  // ===== Обработчики событий =====

  addBtn.addEventListener("click", () => {
    addThought(inputEl.value);
    inputEl.value = "";
    inputEl.focus();
  });

  clearBtn.addEventListener("click", () => {
    clearThoughts();
  });

  // Ctrl+Enter — быстрое добавление
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.ctrlKey) {
      addThought(inputEl.value);
      inputEl.value = "";
    }
  });

  // Первая отрисовка при загрузке
  renderThoughts();
})();
