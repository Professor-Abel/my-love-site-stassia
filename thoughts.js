// thoughts.js
// Локальные мысли (localStorage) — маленький личный дневник

(function () {
  const thoughtInput = document.getElementById("thoughtInput");
  const addThoughtBtn = document.getElementById("addThoughtBtn");
  const clearThoughtsBtn = document.getElementById("clearThoughtsBtn");
  const thoughtList = document.getElementById("thoughtList");

  const STORAGE_KEY = "asyaman_thoughts";

  let thoughts = [];

  function loadThoughts() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      thoughts = raw ? JSON.parse(raw) : [];
    } catch {
      thoughts = [];
    }
    render();
  }

  function saveThoughts() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(thoughts));
    } catch (err) {
      console.error("Не удалось сохранить мысли:", err);
    }
  }

  function render() {
    if (!thoughtList) return;

    thoughtList.innerHTML = "";
    if (!thoughts.length) {
      const li = document.createElement("li");
      li.className = "thought-item";
      li.textContent = "Пока здесь пусто. Но этот раздел создан как раз для твоих мыслей.";
      thoughtList.appendChild(li);
      return;
    }

    thoughts.forEach((item) => {
      const li = document.createElement("li");
      li.className = "thought-item";

      const textDiv = document.createElement("div");
      textDiv.textContent = item.text;
      li.appendChild(textDiv);

      if (item.date) {
        const metaDiv = document.createElement("div");
        metaDiv.className = "thought-meta";
        metaDiv.textContent = item.date;
        li.appendChild(metaDiv);
      }

      thoughtList.appendChild(li);
    });
  }

  function addThought(text) {
    if (!text) return;
    const now = new Date();
    thoughts.unshift({
      text,
      date: now.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
    saveThoughts();
    render();
  }

  function clearAll() {
    const ok = window.confirm(
      "Точно удалить все мысли из этого раздела? Это уже нельзя будет вернуть."
    );
    if (!ok) return;
    thoughts = [];
    saveThoughts();
    render();
  }

  // Обработчики
  if (addThoughtBtn) {
    addThoughtBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (!thoughtInput) return;
      const text = thoughtInput.value.trim();
      if (!text) return;
      addThought(text);
      thoughtInput.value = "";
    });
  }

  if (clearThoughtsBtn) {
    clearThoughtsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      clearAll();
    });
  }

  // Старт
  loadThoughts();
})();
