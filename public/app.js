const authButton = document.getElementById("authButton");
const logoutButton = document.getElementById("logoutButton");
const authStatus = document.getElementById("authStatus");
const uploadForm = document.getElementById("uploadForm");
const uploadStatus = document.getElementById("uploadStatus");
const uploadButton = document.getElementById("uploadButton");
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
const settingsForm = document.getElementById("settingsForm");
const settingsStatus = document.getElementById("settingsStatus");
const settingsYoutubeList = document.getElementById("settingsYoutubeList");
const settingsInstagramList = document.getElementById("settingsInstagramList");
const settingsTiktokList = document.getElementById("settingsTiktokList");
const notesForm = document.getElementById("notesForm");
const notesText = document.getElementById("notesText");
const notesStatus = document.getElementById("notesStatus");

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
  perFileTitleInputs.forEach((input) => {
    formData.append("title", input.value);
  });
  perFileDescriptionInputs.forEach((input) => {
    formData.append("description", input.value);
  });
  perFilePublishAtInputs.forEach((input) => {
    formData.append("publishAt", input.value);
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

if (notesForm) {
  notesForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    notesStatus.textContent = "Сохранение...";
    const payload = { text: notesText.value };
    const response = await fetch("/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json();
      notesStatus.textContent = error.error || "Ошибка сохранения";
      logEvent(`Ошибка заметок: ${error.error || "неизвестно"}`);
      return;
    }
    notesStatus.textContent = "Заметки сохранены.";
    logEvent("Заметки сохранены.");
  });
}

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

if (settingsForm) {
  settingsForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    settingsStatus.textContent = "Сохранение...";
    logEvent("Сохраняем базовые настройки...");
    const selectedChannels = collectSelectedChannels();
    const payload = {
      selectedChannels,
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
    updateUploadState();
  });
}

function renderScheduleItems(files) {
  cleanupVideoPreviews();
  scheduleList.innerHTML = "";
  if (!files || files.length === 0) {
    updateUploadState();
    return;
  }
  const startDate = new Date(Date.now() + 10 * 60 * 1000);
  Array.from(files).forEach((file, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "schedule-item";

    const name = document.createElement("span");
    name.textContent = `${index + 1}. ${file.name}`;
    name.className = "schedule-name";

    const videoPreview = document.createElement("video");
    videoPreview.className = "schedule-preview";
    videoPreview.controls = true;
    videoPreview.preload = "metadata";
    const objectUrl = URL.createObjectURL(file);
    videoPreview.src = objectUrl;
    videoPreview.dataset.objectUrl = objectUrl;

    const input = document.createElement("input");
    input.type = "datetime-local";
    input.name = "publishAt";
    input.placeholder = "Дата и время публикации";

    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.name = "title";
    titleInput.placeholder = "Название ролика";
    titleInput.value = file.name.replace(/\.[^/.]+$/, "");

    const descriptionInput = document.createElement("textarea");
    descriptionInput.name = "description";
    descriptionInput.placeholder = "Описание ролика";
    descriptionInput.rows = 2;
    descriptionInput.value = "#astrology #horoscope #astro";
    descriptionInput.addEventListener("input", updateUploadState);

    const metaWrapper = document.createElement("div");
    metaWrapper.className = "schedule-meta";
    metaWrapper.appendChild(titleInput);
    metaWrapper.appendChild(descriptionInput);
    metaWrapper.appendChild(input);

    const nextDate = new Date(startDate.getTime() + index * 4 * 60 * 60 * 1000);
    input.value = formatDateTimeLocal(nextDate);
    input.dataset.auto = "true";
    input.addEventListener("input", () => {
      input.dataset.auto = "false";
    });

    wrapper.appendChild(name);
    wrapper.appendChild(videoPreview);
    wrapper.appendChild(metaWrapper);
    scheduleList.appendChild(wrapper);

    if (index === 0) {
      input.addEventListener("change", () => {
        const baseDate = new Date(input.value);
        if (Number.isNaN(baseDate.getTime())) {
          return;
        }
        const scheduleInputs = scheduleList.querySelectorAll("input[name='publishAt']");
        scheduleInputs.forEach((scheduleInput, scheduleIndex) => {
          if (scheduleIndex === 0 || scheduleInput.dataset.auto !== "true") {
            return;
          }
          const nextAutoDate = new Date(
            baseDate.getTime() + scheduleIndex * 4 * 60 * 60 * 1000
          );
          scheduleInput.value = formatDateTimeLocal(nextAutoDate);
        });
      });
    }
  });
  updateUploadState();
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
      item.textContent = channel.label || channel.title;
      channelsList.appendChild(item);
    });
  }
  renderScheduleItems(videoInput.files);
  await loadSocialAccounts();
  await loadSettings();
  await loadNotes();
  updateUploadState();
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
  applySelectedChannels(data.selectedChannels || {});
  updateUploadState();
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

  renderSettingsList(settingsYoutubeList, availableChannels, "youtube");
  renderSettingsList(settingsInstagramList, instagramAccounts, "instagram");
  renderSettingsList(settingsTiktokList, tiktokAccounts, "tiktok");
}

function renderSettingsList(container, items, network) {
  if (!container) {
    return;
  }
  container.innerHTML = "";
  if (!items || items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "status";
    empty.textContent = "Аккаунты не подключены.";
    container.appendChild(empty);
    return;
  }
  items.forEach((item) => {
    const label = document.createElement("label");
    label.className = "settings-option";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.dataset.network = network;
    checkbox.value = item.id;
    checkbox.addEventListener("change", updateUploadState);
    const text = document.createElement("span");
    text.textContent = item.label || item.title || item.id;
    label.appendChild(checkbox);
    label.appendChild(text);
    container.appendChild(label);
  });
}

function collectSelectedChannels() {
  const selected = { youtube: [], instagram: [], tiktok: [] };
  const checkboxes = settingsForm?.querySelectorAll(
    ".settings-option input[type='checkbox']"
  );
  if (!checkboxes) {
    return selected;
  }
  checkboxes.forEach((checkbox) => {
    if (!checkbox.checked) {
      return;
    }
    const network = checkbox.dataset.network;
    if (!selected[network]) {
      selected[network] = [];
    }
    selected[network].push(checkbox.value);
  });
  return selected;
}

function applySelectedChannels(selectedChannels) {
  if (!settingsForm) {
    return;
  }
  const checkboxes = settingsForm.querySelectorAll(
    ".settings-option input[type='checkbox']"
  );
  checkboxes.forEach((checkbox) => {
    const network = checkbox.dataset.network;
    const list = selectedChannels?.[network] || [];
    checkbox.checked = list.includes(checkbox.value);
  });
}

async function loadNotes() {
  if (!notesText) {
    return;
  }
  const response = await fetch("/notes");
  if (!response.ok) {
    return;
  }
  const data = await response.json();
  notesText.value = data.text || "";
}

function updateUploadState() {
  if (!uploadButton) {
    return;
  }
  const hasSelectedChannels =
    settingsForm?.querySelectorAll(".settings-option input[data-network='youtube']:checked")
      .length > 0;
  const descriptionInputs = scheduleList.querySelectorAll("textarea[name='description']");
  const hasDescriptions =
    descriptionInputs.length > 0 &&
    Array.from(descriptionInputs).every((input) => input.value.trim().length > 0);
  uploadButton.disabled = !(hasSelectedChannels && hasDescriptions);
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

function cleanupVideoPreviews() {
  const previews = scheduleList.querySelectorAll("video[data-object-url]");
  previews.forEach((preview) => {
    const url = preview.dataset.objectUrl;
    if (url) {
      URL.revokeObjectURL(url);
    }
  });
}
