const authButton = document.getElementById("authButton");
const logoutButton = document.getElementById("logoutButton");
const authStatus = document.getElementById("authStatus");
const uploadForm = document.getElementById("uploadForm");
const uploadStatus = document.getElementById("uploadStatus");
const videoInput = document.getElementById("videoInput");
const scheduleList = document.getElementById("scheduleList");
const channelLabelInput = document.getElementById("channelLabel");
const proxyUrlInput = document.getElementById("proxyUrl");
const channelsList = document.getElementById("channelsList");
const eventLog = document.getElementById("eventLog");
const instagramForm = document.getElementById("instagramForm");
const instagramLabel = document.getElementById("instagramLabel");
const instagramAccountId = document.getElementById("instagramAccountId");
const instagramAccessToken = document.getElementById("instagramAccessToken");
const instagramStatus = document.getElementById("instagramStatus");
const instagramProxyUrl = document.getElementById("instagramProxyUrl");
const tiktokForm = document.getElementById("tiktokForm");
const tiktokLabel = document.getElementById("tiktokLabel");
const tiktokAccountId = document.getElementById("tiktokAccountId");
const tiktokAccessToken = document.getElementById("tiktokAccessToken");
const tiktokStatus = document.getElementById("tiktokStatus");
const tiktokProxyUrl = document.getElementById("tiktokProxyUrl");
const crosspostForm = document.getElementById("crosspostForm");
const crosspostYoutube = document.getElementById("crosspostYoutube");
const crosspostInstagram = document.getElementById("crosspostInstagram");
const crosspostTiktok = document.getElementById("crosspostTiktok");
const crosspostStatus = document.getElementById("crosspostStatus");
const crosspostList = document.getElementById("crosspostList");
const crosspostName = document.getElementById("crosspostName");
const settingsForm = document.getElementById("settingsForm");
const presetName = document.getElementById("presetName");
const settingsYoutube = document.getElementById("settingsYoutube");
const settingsInstagram = document.getElementById("settingsInstagram");
const settingsTiktok = document.getElementById("settingsTiktok");
const settingsAutoSchedule = document.getElementById("settingsAutoSchedule");
const settingsStatus = document.getElementById("settingsStatus");

let availableChannels = [];
let instagramAccounts = [];
let tiktokAccounts = [];

async function refreshStatus() {
  const response = await fetch("/status");
  const data = await response.json();
  if (data.authenticated) {
    authStatus.textContent = "Статус: авторизован";
    logoutButton.disabled = false;
  } else {
    authStatus.textContent = "Статус: не авторизован";
    logoutButton.disabled = true;
  }
  authButton.disabled = false;
  await loadChannels();
}

authButton.addEventListener("click", async () => {
  try {
    const label = channelLabelInput.value.trim();
    const proxyUrl = proxyUrlInput.value.trim();
    const params = new URLSearchParams();
    if (label) {
      params.set("channelLabel", label);
    }
    if (proxyUrl) {
      params.set("proxyUrl", proxyUrl);
    }
    logEvent("Начинаем подключение канала...");
    const response = await fetch(`/auth?${params.toString()}`);
    if (!response.ok) {
      authStatus.textContent = "Ошибка подключения: запустите сервер.";
      logEvent("Ошибка: /auth недоступен.");
      return;
    }
    const data = await response.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      authStatus.textContent = "Ошибка подключения: нет ссылки авторизации.";
      logEvent("Ошибка: ссылка авторизации не получена.");
    }
  } catch (error) {
    authStatus.textContent = "Ошибка подключения: запустите сервер.";
    logEvent("Ошибка подключения к серверу.");
  }
});

logoutButton.addEventListener("click", async () => {
  logEvent("Выход из аккаунтов...");
  await fetch("/logout", { method: "POST" });
  await refreshStatus();
  logEvent("Сессия очищена.");
});

uploadForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  uploadStatus.textContent = "Загрузка началась...";
  logEvent("Начинаем загрузку роликов...");

  const formData = new FormData(uploadForm);
  const perFileTitleInputs = scheduleList.querySelectorAll("input[name='title']");
  const perFileDescriptionInputs = scheduleList.querySelectorAll(
    "textarea[name='description']"
  );
  const perFilePublishAtInputs = scheduleList.querySelectorAll(
    "input[name='publishAt']"
  );
  const perFileChannelInputs = scheduleList.querySelectorAll("select[name='channelId']");
  const perFileCrosspostInputs = scheduleList.querySelectorAll(
    "input[name='crosspost']"
  );
  perFileTitleInputs.forEach((input) => {
    formData.append("title", input.value);
  });
  perFileDescriptionInputs.forEach((input) => {
    formData.append("description", input.value);
  });
  perFilePublishAtInputs.forEach((input) => {
    formData.append("publishAt", input.value);
  });
  perFileChannelInputs.forEach((input) => {
    formData.append("channelId", input.value);
  });
  perFileCrosspostInputs.forEach((input) => {
    formData.append("crosspost", input.checked ? "true" : "false");
  });
  const response = await fetch("/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    uploadStatus.textContent = error.error || "Ошибка загрузки";
    logEvent(`Ошибка загрузки: ${error.error || "неизвестно"}`);
    return;
  }

  const result = await response.json();
  const uploaded = result.uploads || [];
  if (uploaded.length === 0) {
    uploadStatus.textContent = "Загрузка завершена, но ответа нет.";
    return;
  }
  const lines = uploaded.map((item) => {
    const time = item.publishAt ? ` (публикация: ${item.publishAt})` : "";
    const channel = item.channelTitle ? `, канал: ${item.channelTitle}` : "";
    return `ID: ${item.id}${channel}${time}`;
  });
  uploadStatus.textContent = `Готово! ${lines.join(" | ")}`;
  logEvent(`Загрузка завершена: ${uploaded.length} ролик(ов).`);
});

refreshStatus();

if (instagramForm) {
  instagramForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    instagramStatus.textContent = "Подключение...";
    logEvent("Подключаем Instagram аккаунт...");
    const payload = {
      label: instagramLabel.value.trim(),
      accountId: instagramAccountId.value.trim(),
      accessToken: instagramAccessToken.value.trim(),
      proxyUrl: instagramProxyUrl.value.trim(),
    };
    const response = await fetch("/instagram/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json();
      instagramStatus.textContent = error.error || "Ошибка подключения";
      logEvent(`Ошибка Instagram: ${error.error || "неизвестно"}`);
      return;
    }
    const result = await response.json();
    instagramStatus.textContent = `Подключено: ${result.label || result.accountId}`;
    logEvent("Instagram аккаунт подключен.");
  });
}

if (tiktokForm) {
  tiktokForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    tiktokStatus.textContent = "Подключение...";
    logEvent("Подключаем TikTok аккаунт...");
    const payload = {
      label: tiktokLabel.value.trim(),
      accountId: tiktokAccountId.value.trim(),
      accessToken: tiktokAccessToken.value.trim(),
      proxyUrl: tiktokProxyUrl.value.trim(),
    };
    const response = await fetch("/tiktok/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json();
      tiktokStatus.textContent = error.error || "Ошибка подключения";
      logEvent(`Ошибка TikTok: ${error.error || "неизвестно"}`);
      return;
    }
    const result = await response.json();
    tiktokStatus.textContent = `Подключено: ${result.label || result.accountId}`;
    logEvent("TikTok аккаунт подключен.");
  });
}

if (crosspostForm) {
  crosspostForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    crosspostStatus.textContent = "Сохранение...";
    logEvent("Сохраняем связь для кросспостинга...");
    const payload = {
      name: crosspostName.value.trim(),
      youtubeChannelId: crosspostYoutube.value,
      instagramAccountId: crosspostInstagram.value,
      tiktokAccountId: crosspostTiktok.value,
    };
    const response = await fetch("/crosspost/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json();
      crosspostStatus.textContent = error.error || "Ошибка сохранения";
      logEvent(`Ошибка кросспостинга: ${error.error || "неизвестно"}`);
      return;
    }
    crosspostStatus.textContent = "Связь сохранена.";
    logEvent("Связь для кросспостинга сохранена.");
    await loadCrosspostLinks();
  });
}

if (settingsForm) {
  settingsForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    settingsStatus.textContent = "Сохранение...";
    logEvent("Сохраняем базовые настройки...");
    const payload = {
      presetName: presetName.value.trim(),
      publishTo: {
        youtube: settingsYoutube.checked,
        instagram: settingsInstagram.checked,
        tiktok: settingsTiktok.checked,
      },
      autoSchedule: settingsAutoSchedule.checked,
    };
    const response = await fetch("/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json();
      settingsStatus.textContent = error.error || "Ошибка сохранения";
      logEvent(`Ошибка настроек: ${error.error || "неизвестно"}`);
      return;
    }
    settingsStatus.textContent = "Настройки сохранены.";
    logEvent("Базовые настройки сохранены.");
  });
}

function renderScheduleItems(files) {
  scheduleList.innerHTML = "";
  if (!files || files.length === 0) {
    return;
  }
  Array.from(files).forEach((file, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "schedule-item";

    const name = document.createElement("span");
    name.textContent = `${index + 1}. ${file.name}`;

    const input = document.createElement("input");
    input.type = "datetime-local";
    input.name = "publishAt";
    input.placeholder = "Дата и время публикации";

    const scheduleControls = document.createElement("label");
    scheduleControls.className = "schedule-controls";

    const autoCheckbox = document.createElement("input");
    autoCheckbox.type = "checkbox";
    autoCheckbox.name = "autoSchedule";
    autoCheckbox.dataset.index = index.toString();

    const autoText = document.createElement("span");
    autoText.textContent = "Каждые 4 часа";

    scheduleControls.appendChild(autoCheckbox);
    scheduleControls.appendChild(autoText);

    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.name = "title";
    titleInput.placeholder = "Название ролика";
    titleInput.value = file.name.replace(/\.[^/.]+$/, "");

    const descriptionInput = document.createElement("textarea");
    descriptionInput.name = "description";
    descriptionInput.placeholder = "Описание ролика";
    descriptionInput.rows = 2;

    const metaWrapper = document.createElement("div");
    metaWrapper.className = "schedule-meta";
    metaWrapper.appendChild(titleInput);
    metaWrapper.appendChild(descriptionInput);

    const channelSelect = document.createElement("select");
    channelSelect.name = "channelId";
    channelSelect.required = true;

    const channelLock = document.createElement("label");
    channelLock.className = "schedule-lock";

    const channelLockInput = document.createElement("input");
    channelLockInput.type = "checkbox";
    channelLockInput.name = "lockChannel";

    const channelLockText = document.createElement("span");
    channelLockText.textContent = "Только этот";

    channelLock.appendChild(channelLockInput);
    channelLock.appendChild(channelLockText);

    if (availableChannels.length === 0) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "Сначала подключите канал";
      channelSelect.appendChild(option);
    } else {
      availableChannels.forEach((channel) => {
        const option = document.createElement("option");
        option.value = channel.id;
        option.textContent = channel.label || channel.title;
        channelSelect.appendChild(option);
      });
    }

    wrapper.appendChild(name);
    wrapper.appendChild(input);
    if (index === 0) {
      wrapper.appendChild(scheduleControls);
    } else {
      const spacer = document.createElement("span");
      spacer.textContent = "";
      wrapper.appendChild(spacer);
    }
    wrapper.appendChild(metaWrapper);
    const channelWrapper = document.createElement("div");
    channelWrapper.className = "schedule-channel";
    channelWrapper.appendChild(channelSelect);
    channelWrapper.appendChild(channelLock);

    const crosspostLabel = document.createElement("label");
    crosspostLabel.className = "schedule-lock";
    const crosspostInput = document.createElement("input");
    crosspostInput.type = "checkbox";
    crosspostInput.name = "crosspost";
    const crosspostText = document.createElement("span");
    crosspostText.textContent = "Отправить в другие соцсети";
    crosspostLabel.appendChild(crosspostInput);
    crosspostLabel.appendChild(crosspostText);
    channelWrapper.appendChild(crosspostLabel);

    wrapper.appendChild(channelWrapper);
    scheduleList.appendChild(wrapper);

    if (index === 0) {
      autoCheckbox.addEventListener("change", () => {
        if (!autoCheckbox.checked || !input.value) {
          return;
        }
        const startDate = new Date(input.value);
        if (Number.isNaN(startDate.getTime())) {
          return;
        }
        const scheduleInputs = scheduleList.querySelectorAll("input[name='publishAt']");
        scheduleInputs.forEach((scheduleInput, scheduleIndex) => {
          if (scheduleIndex === 0) {
            return;
          }
          const nextDate = new Date(startDate.getTime() + scheduleIndex * 4 * 60 * 60 * 1000);
          const formatted = formatDateTimeLocal(nextDate);
          scheduleInput.value = formatted;
        });
      });
    }

    channelLockInput.addEventListener("change", () => {
      if (!channelLockInput.checked) {
        return;
      }
      const selectedValue = channelSelect.value;
      if (!selectedValue) {
        return;
      }
      const channelSelects = scheduleList.querySelectorAll("select[name='channelId']");
      channelSelects.forEach((select) => {
        select.value = selectedValue;
      });
    });
  });
}

function formatDateTimeLocal(date) {
  const pad = (value) => String(value).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

videoInput.addEventListener("change", (event) => {
  renderScheduleItems(event.target.files);
});

async function loadChannels() {
  const response = await fetch("/channels");
  const data = await response.json();
  availableChannels = data.channels || [];
  channelsList.innerHTML = "";
  if (availableChannels.length === 0) {
    channelsList.textContent = "Подключенные каналы отсутствуют.";
  } else {
    availableChannels.forEach((channel) => {
      const item = document.createElement("span");
      item.textContent = `${channel.label || channel.title} (${channel.title})`;
      channelsList.appendChild(item);
    });
  }
  renderScheduleItems(videoInput.files);
  await loadSocialAccounts();
  await loadCrosspostLinks();
  await loadSettings();
}

async function loadSettings() {
  if (!settingsForm) {
    return;
  }
  const response = await fetch("/settings");
  if (!response.ok) {
    return;
  }
  const data = await response.json();
  if (data.presetName) {
    presetName.value = data.presetName;
  }
  if (data.publishTo) {
    settingsYoutube.checked = Boolean(data.publishTo.youtube);
    settingsInstagram.checked = Boolean(data.publishTo.instagram);
    settingsTiktok.checked = Boolean(data.publishTo.tiktok);
  }
  settingsAutoSchedule.checked = Boolean(data.autoSchedule);
}

async function loadSocialAccounts() {
  const [instagramResponse, tiktokResponse] = await Promise.all([
    fetch("/instagram/accounts"),
    fetch("/tiktok/accounts"),
  ]);
  const instagramData = await instagramResponse.json();
  const tiktokData = await tiktokResponse.json();
  instagramAccounts = instagramData.accounts || [];
  tiktokAccounts = tiktokData.accounts || [];

  if (crosspostInstagram) {
    crosspostInstagram.innerHTML = "";
    const blank = document.createElement("option");
    blank.value = "";
    blank.textContent = "Не выбрано";
    crosspostInstagram.appendChild(blank);
    instagramAccounts.forEach((account) => {
      const option = document.createElement("option");
      option.value = account.id;
      option.textContent = account.label || account.id;
      crosspostInstagram.appendChild(option);
    });
  }

  if (crosspostTiktok) {
    crosspostTiktok.innerHTML = "";
    const blank = document.createElement("option");
    blank.value = "";
    blank.textContent = "Не выбрано";
    crosspostTiktok.appendChild(blank);
    tiktokAccounts.forEach((account) => {
      const option = document.createElement("option");
      option.value = account.id;
      option.textContent = account.label || account.id;
      crosspostTiktok.appendChild(option);
    });
  }

  if (crosspostYoutube) {
    crosspostYoutube.innerHTML = "";
    const blank = document.createElement("option");
    blank.value = "";
    blank.textContent = "Выберите канал";
    crosspostYoutube.appendChild(blank);
    availableChannels.forEach((channel) => {
      const option = document.createElement("option");
      option.value = channel.id;
      option.textContent = channel.label || channel.title;
      crosspostYoutube.appendChild(option);
    });
  }
}

async function loadCrosspostLinks() {
  if (!crosspostList) {
    return;
  }
  const response = await fetch("/crosspost/links");
  const data = await response.json();
  const links = data.links || [];
  crosspostList.innerHTML = "";
  if (links.length === 0) {
    crosspostList.textContent = "Связи не настроены.";
    return;
  }
  links.forEach((link) => {
    const yt = availableChannels.find((c) => c.id === link.youtubeChannelId);
    const ig = instagramAccounts.find((a) => a.id === link.instagramAccountId);
    const tt = tiktokAccounts.find((a) => a.id === link.tiktokAccountId);
    const row = document.createElement("span");
    const name = link.name ? `(${link.name}) ` : "";
    row.textContent = `${name}YouTube: ${yt?.label || yt?.title || link.youtubeChannelId} • Instagram: ${
      ig?.label || link.instagramAccountId || "—"
    } • TikTok: ${tt?.label || link.tiktokAccountId || "—"}`;
    crosspostList.appendChild(row);
  });
}

function logEvent(message) {
  if (!eventLog) {
    return;
  }
  const row = document.createElement("div");
  const time = new Date();
  const stamp = time.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  row.textContent = `[${stamp}] ${message}`;
  eventLog.prepend(row);
}
