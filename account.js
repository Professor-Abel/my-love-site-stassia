// account.js
// Логика профиля: имя, "о себе", аватар (URL или файл) — всё хранится в localStorage
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

  const accountStatus = document.getElementById("account-status");

  const LAST_EMAIL_KEY = "asyaman_last_email";

  function getCurrentEmail() {
    try {
      return localStorage.getItem(LAST_EMAIL_KEY) || "";
    } catch (e) {
      return "";
    }
  }

  function profileKeyForEmail(email) {
    return email ? `asyaman_profile_${email}` : "asyaman_profile_guest";
  }

  function loadProfile() {
    const email = getCurrentEmail();
    const key = profileKeyForEmail(email);

    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        return {
          displayName: "Abel",
          about: "Асъяман. 💜",
          avatarUrl: "",
        };
      }
      const parsed = JSON.parse(raw);
      return {
        displayName: parsed.displayName || "Abel",
        about: parsed.about || "Асъяман. 💜",
        avatarUrl: parsed.avatarUrl || "",
      };
    } catch (e) {
      console.warn("Не удалось загрузить профиль:", e);
      return {
        displayName: "Abel",
        about: "Асъяман. 💜",
        avatarUrl: "",
      };
    }
  }

  function saveProfile(profile) {
    const email = getCurrentEmail();
    const key = profileKeyForEmail(email);

    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          displayName: profile.displayName || "",
          about: profile.about || "",
          avatarUrl: profile.avatarUrl || "",
        })
      );
    } catch (e) {
      console.warn("Не удалось сохранить профиль:", e);
    }
  }

  function setStatus(message, type = "") {
    if (!accountStatus) return;
    accountStatus.textContent = message || "";
    accountStatus.classList.remove("status-error", "status-success");
    if (type === "error") {
      accountStatus.classList.add("status-error");
    } else if (type === "success") {
      accountStatus.classList.add("status-success");
    }
  }

  function applyProfileToView(profile) {
    if (accountDisplayNameSpan) {
      accountDisplayNameSpan.textContent = profile.displayName || "Abel";
    }
    if (accountAboutSpan) {
      accountAboutSpan.textContent = profile.about || "Асъяман. 💜";
    }

    if (accountAvatarImg) {
      if (profile.avatarUrl) {
        accountAvatarImg.src = profile.avatarUrl;
        accountAvatarImg.classList.remove("avatar-empty");
      } else {
        accountAvatarImg.src = "";
        accountAvatarImg.classList.add("avatar-empty");
      }
    }
  }

  function fillEditForm(profile) {
    if (accountDisplayNameInput) {
      accountDisplayNameInput.value = profile.displayName || "";
    }
    if (accountAboutInput) {
      accountAboutInput.value = profile.about || "";
    }
    if (accountAvatarInput) {
      accountAvatarInput.value = profile.avatarUrl || "";
    }
    if (accountAvatarFileInput) {
      accountAvatarFileInput.value = "";
    }
  }

  function openEdit() {
    const profile = loadProfile();
    fillEditForm(profile);

    if (accountViewBlock) accountViewBlock.style.display = "none";
    if (accountEditBlock) accountEditBlock.style.display = "";
    setStatus("");
  }

  function closeEdit() {
    if (accountEditBlock) accountEditBlock.style.display = "none";
    if (accountViewBlock) accountViewBlock.style.display = "";
    setStatus("");
  }

  function initAccount() {
    const profile = loadProfile();
    applyProfileToView(profile);

    // Кнопка "Изменить профиль"
    if (accountEditBtn) {
      accountEditBtn.addEventListener("click", () => {
        openEdit();
      });
    }

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
          finishSave(urlFromInput);
        }
      });
    }

    // Кнопка "Отмена"
    if (accountCancelBtn) {
      accountCancelBtn.addEventListener("click", () => {
        closeEdit();
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    initAccount();
  });
})();
