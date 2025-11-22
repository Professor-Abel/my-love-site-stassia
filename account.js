// account.js
// Логика профиля: имя, "о себе", аватар (URL) — всё хранится в localStorage
// Привязка к пользователю идёт через asyaman_last_email (который мы сохраняем в auth-wishes.js)

(function () {
  // DOM-элементы
  const accountViewBlock = document.getElementById("account-view");
  const accountEditBlock = document.getElementById("account-edit");
  const accountGuestBlock = document.getElementById("account-guest");

  const accountEmailSpan = document.getElementById("account-email");

  const accountAvatarImg = document.getElementById("account-avatar-img");
  const accountDisplayNameSpan = document.getElementById("account-displayName");
  const accountAboutSpan = document.getElementById("account-about");

const accountDisplayNameInput = document.getElementById("account-displayName-input");
const accountAboutInput = document.getElementById("account-about-input");
const accountAvatarInput = document.getElementById("account-avatar-input");
const accountAvatarFileInput = document.getElementById("account-avatar-file");


  const accountEditBtn = document.getElementById("account-edit-btn");
  const accountSaveBtn = document.getElementById("account-save-btn");
  const accountCancelBtn = document.getElementById("account-cancel-btn");

  const accountStatusEl = document.getElementById("account-status");

  // ========= ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =========

  function getCurrentEmail() {
    try {
      const email = localStorage.getItem("asyaman_last_email");
      return email || "";
    } catch (e) {
      console.warn("Не удалось прочитать asyaman_last_email:", e);
      return "";
    }
  }

  function getProfileKey(email) {
    if (!email) return "asyaman_profile_guest";
    return "asyaman_profile_" + email.toLowerCase();
  }

  function loadProfile() {
    const email = getCurrentEmail();
    const key = getProfileKey(email);

    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        // Профиль по умолчанию
        return {
          displayName: "Анастасия",
          about:
            "Я люблю белые розы, тёплые вечера и наш маленький мир Асъяман. 💜",
          avatarUrl: "images/stassia-avatar.jpg",
        };
      }
      const parsed = JSON.parse(raw);
      return {
        displayName: parsed.displayName || "Анастасия",
        about:
          parsed.about ||
          "Я люблю белые розы, тёплые вечера и наш маленький мир Асъяман. 💜",
        avatarUrl: parsed.avatarUrl || "images/stassia-avatar.jpg",
      };
    } catch (e) {
      console.warn("Не удалось загрузить профиль:", e);
      return {
        displayName: "Анастасия",
        about:
          "Я люблю белые розы, тёплые вечера и наш маленький мир Асъяман. 💜",
        avatarUrl: "images/stassia-avatar.jpg",
      };
    }
  }

  function saveProfile(profile) {
    const email = getCurrentEmail();
    const key = getProfileKey(email);
    try {
      localStorage.setItem(key, JSON.stringify(profile));
    } catch (e) {
      console.warn("Не удалось сохранить профиль:", e);
    }
  }

  function setStatus(message, type = "") {
    if (!accountStatusEl) return;
    accountStatusEl.textContent = message || "";
    accountStatusEl.className = "auth-status";
    if (type) {
      accountStatusEl.classList.add(type);
    }
  }

  function applyProfileToView(profile) {
    if (accountDisplayNameSpan) {
      accountDisplayNameSpan.textContent = profile.displayName || "";
    }
    if (accountAboutSpan) {
      accountAboutSpan.textContent = profile.about || "";
    }
    if (accountAvatarImg) {
      accountAvatarImg.src = profile.avatarUrl || "images/stassia-avatar.jpg";
    }
  }

  function openEdit(profile) {
    if (accountViewBlock) accountViewBlock.style.display = "none";
    if (accountEditBlock) accountEditBlock.style.display = "";

    if (accountDisplayNameInput) {
      accountDisplayNameInput.value = profile.displayName || "";
    }
    if (accountAboutInput) {
      accountAboutInput.value = profile.about || "";
    }
    if (accountAvatarInput) {
      accountAvatarInput.value = profile.avatarUrl || "";
    }

    setStatus("");
  }

  function closeEdit() {
    if (accountViewBlock) accountViewBlock.style.display = "";
    if (accountEditBlock) accountEditBlock.style.display = "none";
    setStatus("");
  }

  // ========= ИНИЦИАЛИЗАЦИЯ =========

  function initAccount() {
    // Если нет блока аккаунта — выходим
    if (!accountViewBlock && !accountEditBlock) {
      return;
    }

    const email = getCurrentEmail();
    const profile = loadProfile();

    // Покажем email, если есть
    if (accountEmailSpan) {
      accountEmailSpan.textContent = email || "";
    }

    applyProfileToView(profile);

    // По умолчанию — режим просмотра
    if (accountViewBlock) accountViewBlock.style.display = "";
    if (accountEditBlock) accountEditBlock.style.display = "none";

    // Если вообще нет email (гость) и при этом есть блок гостя — оставляем сообщение
    if (!email && accountGuestBlock) {
      // Гость увидит текст: "Чтобы увидеть и настроить свой профиль, войди..."
      // Ничего дополнительно делать не нужно.
    }

    // Кнопка "Изменить профиль"
    if (accountEditBtn) {
      accountEditBtn.addEventListener("click", () => {
        openEdit(profile);
      });
    }

    // Кнопка "Сохранить"
// Кнопка "Сохранить"
if (accountSaveBtn) {
  accountSaveBtn.addEventListener("click", () => {
    const baseProfile = loadProfile();

    const displayName =
      (accountDisplayNameInput?.value || "").trim() || baseProfile.displayName;
    const about =
      (accountAboutInput?.value || "").trim() || baseProfile.about;
    const urlFromInput = (accountAvatarInput?.value || "").trim();
    const file =
      accountAvatarFileInput && accountAvatarFileInput.files
        ? accountAvatarFileInput.files[0]
        : null;

    const finishSave = (finalAvatarUrl) => {
      const newProfile = {
        displayName,
        about,
        avatarUrl: finalAvatarUrl || baseProfile.avatarUrl,
      };

      saveProfile(newProfile);
      applyProfileToView(newProfile);
      setStatus("Профиль сохранён 💾", "success");
      closeEdit();
    };

    // Если выбрана фотография — читаем её как dataURL и сохраняем
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target && e.target.result ? String(e.target.result) : "";
        finishSave(result || urlFromInput);
      };
      reader.onerror = () => {
        setStatus(
          "Не получилось прочитать файл. Попробуй другую фотографию 💔",
          "error"
        );
      };
      reader.readAsDataURL(file);
    } else {
      // Если файла нет — используем введённый URL или старый аватар
      finishSave(urlFromInput);
    }
  });
}


    // Кнопка "Отмена"
    if (accountCancelBtn) {
      accountCancelBtn.addEventListener("click", () => {
        // Просто закрываем редактирование без сохранения
        closeEdit();
      });
    }
  }

  // Ждём DOM
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAccount);
  } else {
    initAccount();
  }
})();
