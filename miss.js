// miss.js
// Локальные "моменты скучания" (localStorage)

(function () {
  const missInput = document.getElementById("missInput");
  const missAddBtn = document.getElementById("missAddBtn");
  const missClearBtn = document.getElementById("missClearBtn");
  const missQuickBtn = document.getElementById("missQuickBtn");
  const missList = document.getElementById("missList");
  const missCount = document.getElementById("missCount");

  const STORAGE_KEY = "asyaman_miss_moments";

  const QUICK_PHRASES = [
    "Скучаю по твоему голосу прямо сейчас.",
    "Хочется просто оказаться рядом и молчать.",
    "Не хватает твоих рук, которые обнимают крепко-крепко.",
    "Иногда ловлю себя на том, что просто улыбаюсь, вспоминая тебя.",
    "Скучаю по нашим разговорам до ночи.",
    "Хочу смотреть на тебя вживую, а не через экран.",
    "Скучаю по тому, как ты улыбаешься моим тупым шуткам.",
  ];

  let moments = [];

  function loadMoments() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      moments = raw ? JSON.parse(raw) : [];
    } catch {
      moments = [];
    }
    render();
  }

  function saveMoments() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(moments));
    } catch (err) {
      console.error("Не удалось сохранить моменты скучания:", err);
    }
  }

  function render() {
    if (!missList) return;

    missList.innerHTML = "";
    if (!moments.length) {
      const li = document.createElement("li");
      li.textContent = "Пока здесь пусто. Но это место ждёт, когда ты напишешь, как скучаешь.";
      missList.appendChild(li);
      if (missCount) missCount.textContent = "0";
      return;
    }

    moments.forEach((item) => {
      const li = document.createElement("li");
      const textDiv = document.createElement("div");
      textDiv.textContent = item.text;

      const metaDiv = document.createElement("div");
      metaDiv.style.fontSize = "0.72rem";
      metaDiv.style.color = "#9ca3af";
      metaDiv.style.marginTop = "4px";
      metaDiv.textContent = item.date || "";

      li.appendChild(textDiv);
      li.appendChild(metaDiv);
      missList.appendChild(li);
    });

    if (missCount) missCount.textContent = String(moments.length);
  }

  function addMoment(text) {
    if (!text) return;
    const now = new Date();
    moments.unshift({
      text,
      date: now.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    });
    saveMoments();
    render();
  }

  function clearAll() {
    const ok = window.confirm(
      "Точно удалить все моменты, когда ты скучала/скучал? Вернуть их уже не получится."
    );
    if (!ok) return;
    moments = [];
    saveMoments();
    render();
  }

  function useQuickPhrase() {
    if (!missInput) return;
    const randomIndex = Math.floor(Math.random() * QUICK_PHRASES.length);
    missInput.value = QUICK_PHRASES[randomIndex];
  }

  // Обработчики
  if (missAddBtn) {
    missAddBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (!missInput) return;
      const text = missInput.value.trim();
      if (!text) return;
      addMoment(text);
      missInput.value = "";
    });
  }

  if (missClearBtn) {
    missClearBtn.addEventListener("click", (e) => {
      e.preventDefault();
      clearAll();
    });
  }

  if (missQuickBtn) {
    missQuickBtn.addEventListener("click", (e) => {
      e.preventDefault();
      useQuickPhrase();
    });
  }

  // Старт
  loadMoments();
})();
