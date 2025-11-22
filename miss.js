// miss.js
// Логика для раздела "Когда скучаешь": добавление, удаление, очистка, localStorage.

(function () {
  const STORAGE_KEY = "asyaman_miss";

  // DOM элементы
  const inputEl = document.getElementById("missInput");
  const addBtn = document.getElementById("addMissBtn");
  const clearBtn = document.getElementById("clearMissBtn");
  const listEl = document.getElementById("missList");

  if (!inputEl || !addBtn || !clearBtn || !listEl) {
    // Если блоки не найдены — тихо выходим
    return;
  }

  // ====== Загружаем данные ======

  function loadMiss() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch (e) {
      console.warn("Не удалось загрузить записи 'Когда скучаешь':", e);
      return [];
    }
  }

  function saveMiss(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn("Не удалось сохранить:", e);
    }
  }

  // ====== Отрисовка ======

  function renderMiss() {
    const list = loadMiss();
    listEl.innerHTML = "";

    if (list.length === 0) {
      const empty = document.createElement("div");
      empty.textContent = "Пока здесь пусто… Напиши, когда скучаешь ❤️";
      empty.style.fontSize = "12px";
      empty.style.color = "rgba(148, 163, 184, 0.9)";
      listEl.appendChild(empty);
      return;
    }

    list.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "miss-item";

      const left = document.createElement("div");
      left.style.flex = "1";

      const textDiv = document.createElement("div");
      textDiv.className = "miss-text";
      textDiv.textContent = item.text || "";

      const metaDiv = document.createElement("div");
      metaDiv.className = "miss-meta";
      metaDiv.textContent = item.date || "";

      left.appendChild(textDiv);
      left.appendChild(metaDiv);

      const removeBtn = document.createElement("button");
      removeBtn.className = "miss-remove-btn";
      removeBtn.textContent = "×";
      removeBtn.title = "Удалить";
      removeBtn.addEventListener("click", () => removeMiss(index));

      row.appendChild(left);
      row.appendChild(removeBtn);

      listEl.appendChild(row);
    });
  }

  // ====== Логика действий ======

  function addMiss(text) {
    const trimmed = (text || "").trim();
    if (!trimmed) return;

    const list = loadMiss();
    const now = new Date();

    const dateStr = now.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    list.unshift({
      text: trimmed,
      date: dateStr,
    });

    saveMiss(list);
    renderMiss();
  }

  function removeMiss(index) {
    const list = loadMiss();
    if (index < 0 || index >= list.length) return;
    list.splice(index, 1);
    saveMiss(list);
    renderMiss();
  }

  function clearMiss() {
    if (!confirm("Точно удалить все записи?")) return;
    saveMiss([]);
    renderMiss();
  }

  // ====== Обработчики ======

  addBtn.addEventListener("click", () => {
    addMiss(inputEl.value);
    inputEl.value = "";
    inputEl.focus();
  });

  clearBtn.addEventListener("click", () => {
    clearMiss();
  });

  // Ctrl + Enter
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.ctrlKey) {
      addMiss(inputEl.value);
      inputEl.value = "";
    }
  });

  // Отрисовка при загрузке
  renderMiss();
})();
