// miss.js
// Логика раздела "Когда скучаешь" — локальное хранилище + случайные фразы.

document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "asyaman_miss_v1";

  const missInput = document.getElementById("missInput");
  const missAddBtn = document.getElementById("missAddBtn");
  const missQuickBtn = document.getElementById("missQuickBtn");
  const missClearBtn = document.getElementById("missClearBtn");
  const missListEl = document.getElementById("missList");
  const missCountEl = document.getElementById("missCount");

  if (!missInput || !missAddBtn || !missQuickBtn || !missClearBtn || !missListEl) {
    return;
  }

  const randomPhrases = [
    "Скучаю по твоему голосу прямо сейчас.",
    "Хочу, чтобы ты была рядом и просто молчала со мной.",
    "Каждая мелочь вокруг напоминает о тебе.",
    "Скучаю по твоим сообщениям, даже если мы только что переписывались.",
    "Хочу обнять тебя так, чтобы мир исчез на пару минут.",
    "Скучаю по тому, как ты смеёшься.",
    "Если бы можно было — сейчас бы просто пришёл к тебе домой.",
    "Скучаю по твоему взгляду, который видит меня настоящим.",
  ];

  let missList = [];

  function loadMiss() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        missList = [];
        renderMiss();
        return;
      }
      missList = JSON.parse(raw) || [];
      renderMiss();
    } catch (e) {
      console.error("Ошибка чтения раздела 'Когда скучаешь':", e);
      missList = [];
      renderMiss();
    }
  }

  function saveMiss() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(missList));
    } catch (e) {
      console.error("Ошибка сохранения раздела 'Когда скучаешь':", e);
    }
  }

  function formatDate(ts) {
    try {
      const d = new Date(ts);
      return d.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }

  function updateMissCount() {
    if (!missCountEl) return;
    missCountEl.textContent = String(missList.length);
  }

  function renderMiss() {
    missListEl.innerHTML = "";

    if (!missList.length) {
      const li = document.createElement("li");
      li.textContent = "Пока нет ни одного момента. Напиши, когда особенно скучаешь.";
      missListEl.appendChild(li);
      updateMissCount();
      return;
    }

    missList.forEach((item) => {
      const li = document.createElement("li");

      const textDiv = document.createElement("div");
      textDiv.textContent = item.text || "";

      const metaDiv = document.createElement("div");
      metaDiv.style.fontSize = "0.72rem";
      metaDiv.style.color = "#9ca3af";
      metaDiv.style.marginTop = "4px";
      metaDiv.textContent = item.createdAt ? formatDate(item.createdAt) : "";

      li.appendChild(textDiv);
      li.appendChild(metaDiv);
      missListEl.appendChild(li);
    });

    updateMissCount();
  }

  function addMiss(textFromOutside) {
    const baseText =
      typeof textFromOutside === "string"
        ? textFromOutside
        : (missInput.value || "").trim();

    const text = baseText.trim();
    if (!text) return;

    missList.unshift({
      text,
      createdAt: Date.now(),
    });

    saveMiss();
    renderMiss();

    if (!textFromOutside && missInput) {
      missInput.value = "";
    }
  }

  function addRandomPhrase() {
    const phrase =
      randomPhrases[Math.floor(Math.random() * randomPhrases.length)];
    missInput.value = phrase;
  }

  function clearMiss() {
    if (!missList.length) return;
    const ok = window.confirm(
      "Точно удалить все моменты из раздела 'Когда скучаешь'? Это только на этом устройстве."
    );
    if (!ok) return;

    missList = [];
    saveMiss();
    renderMiss();
  }

  missAddBtn.addEventListener("click", (e) => {
    e.preventDefault();
    addMiss();
  });

  missQuickBtn.addEventListener("click", (e) => {
    e.preventDefault();
    addRandomPhrase();
  });

  missClearBtn.addEventListener("click", (e) => {
    e.preventDefault();
    clearMiss();
  });

  missInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      addMiss();
    }
  });

  loadMiss();
});
