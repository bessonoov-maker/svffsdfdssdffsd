require("dotenv").config();
const path = require("path");
const fs = require("fs");
const express = require("express");
const session = require("express-session");
const multer = require("multer");
const { HttpsProxyAgent } = require("https-proxy-agent");
const { google } = require("googleapis");

const app = express();
const upload = multer({ dest: path.join(__dirname, "uploads") });
const DATA_DIR = path.join(__dirname, "data");
const CHANNELS_FILE = path.join(DATA_DIR, "channels.json");
const INSTAGRAM_FILE = path.join(DATA_DIR, "instagram.json");
const TIKTOK_FILE = path.join(DATA_DIR, "tiktok.json");
const CROSSPOST_FILE = path.join(DATA_DIR, "crosspost.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

function loadStoredChannels() {
  try {
    const raw = fs.readFileSync(CHANNELS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveStoredChannels(channels) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(CHANNELS_FILE, JSON.stringify(channels, null, 2));
}

let storedChannels = loadStoredChannels();
let storedInstagram = loadStoredInstagram();
let storedTiktok = loadStoredTiktok();
let storedCrosspost = loadStoredCrosspost();
let storedSettings = loadStoredSettings();

function loadStoredInstagram() {
  try {
    const raw = fs.readFileSync(INSTAGRAM_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveStoredInstagram(accounts) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(INSTAGRAM_FILE, JSON.stringify(accounts, null, 2));
}

function loadStoredTiktok() {
  try {
    const raw = fs.readFileSync(TIKTOK_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveStoredTiktok(accounts) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(TIKTOK_FILE, JSON.stringify(accounts, null, 2));
}

function loadStoredCrosspost() {
  try {
    const raw = fs.readFileSync(CROSSPOST_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveStoredCrosspost(links) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(CROSSPOST_FILE, JSON.stringify(links, null, 2));
}

function loadStoredSettings() {
  try {
    const raw = fs.readFileSync(SETTINGS_FILE, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    return {};
  }
}

function saveStoredSettings(settings) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

const PORT = process.env.PORT || 3000;
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI || `http://localhost:${PORT}/oauth2callback`;
const SESSION_SECRET = process.env.SESSION_SECRET || "change-me";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.warn(
    "Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET. See README.md for setup instructions."
  );
}

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

function createOAuthClient(tokens) {
  const client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );
  client.setCredentials(tokens);
  return client;
}

function parseAuthState(state) {
  if (!state) {
    return {};
  }
  try {
    const decoded = Buffer.from(state, "base64").toString("utf8");
    return JSON.parse(decoded);
  } catch (error) {
    return { label: state };
  }
}

function buildAuthState(payload) {
  if (!payload || (!payload.label && !payload.proxyUrl)) {
    return "";
  }
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

const YOUTUBE_SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
];

function ensureAuthenticated(req, res, next) {
  if (!storedChannels.length) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  return next();
}

app.get("/auth", (req, res) => {
  const channelLabel = req.query.channelLabel || "";
  const proxyUrl = req.query.proxyUrl || "";
  console.info("Starting OAuth flow", { channelLabel, proxyUrl: proxyUrl ? "set" : "none" });
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: YOUTUBE_SCOPES,
    prompt: "consent",
    state: buildAuthState({ label: channelLabel, proxyUrl }),
  });
  res.json({ url });
});

app.get("/oauth2callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code) {
      return res.status(400).send("Missing code parameter");
    }
    const { tokens } = await oauth2Client.getToken(code);
    const stateData = parseAuthState(state);
    const authedClient = createOAuthClient(tokens);
    const proxyAgent = stateData.proxyUrl
      ? new HttpsProxyAgent(stateData.proxyUrl)
      : undefined;
    const youtube = google.youtube({
      version: "v3",
      auth: authedClient,
      requestOptions: proxyAgent ? { agent: proxyAgent } : undefined,
    });
    const channelsResponse = await youtube.channels.list({
      part: ["snippet"],
      mine: true,
    });

    const channel = channelsResponse.data.items?.[0];
    if (!channel) {
      return res.status(400).send("No YouTube channel found for this account.");
    }

    const channelInfo = {
      id: channel.id,
      title: channel.snippet?.title || "YouTube Channel",
      label: stateData.label || channel.snippet?.title || "YouTube Channel",
      proxyUrl: stateData.proxyUrl || "",
      tokens,
    };

    storedChannels = storedChannels.filter((item) => item.id !== channelInfo.id);
    storedChannels.push(channelInfo);
    saveStoredChannels(storedChannels);
    console.info("Connected channel", {
      id: channelInfo.id,
      title: channelInfo.title,
      label: channelInfo.label,
      proxy: channelInfo.proxyUrl ? "set" : "none",
    });
    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.status(500).send("Authentication failed");
  }
});

app.get("/status", (req, res) => {
  res.json({ authenticated: Boolean(storedChannels.length) });
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

app.get("/instagram/accounts", (req, res) => {
  res.json({
    accounts: storedInstagram.map((account) => ({
      id: account.id,
      label: account.label,
    })),
  });
});

app.post("/instagram/connect", (req, res) => {
  const { label, accountId, accessToken, proxyUrl } = req.body || {};
  if (!accountId || !accessToken) {
    return res.status(400).json({ error: "Account ID and access token required" });
  }
  const account = {
    id: accountId,
    label: label || accountId,
    accessToken,
    proxyUrl: proxyUrl || "",
  };
  storedInstagram = storedInstagram.filter((item) => item.id !== account.id);
  storedInstagram.push(account);
  saveStoredInstagram(storedInstagram);
  console.info("Connected Instagram account", { id: account.id, label: account.label });
  return res.json({ ok: true, id: account.id, label: account.label });
});

app.post("/instagram/publish", (req, res) => {
  res.status(501).json({
    error:
      "Instagram publishing requires Graph API setup. Store account via /instagram/connect and add publishing credentials.",
  });
});

app.get("/tiktok/accounts", (req, res) => {
  res.json({
    accounts: storedTiktok.map((account) => ({
      id: account.id,
      label: account.label,
    })),
  });
});

app.post("/tiktok/connect", (req, res) => {
  const { label, accountId, accessToken, proxyUrl } = req.body || {};
  if (!accountId || !accessToken) {
    return res.status(400).json({ error: "Account ID and access token required" });
  }
  const account = {
    id: accountId,
    label: label || accountId,
    accessToken,
    proxyUrl: proxyUrl || "",
  };
  storedTiktok = storedTiktok.filter((item) => item.id !== account.id);
  storedTiktok.push(account);
  saveStoredTiktok(storedTiktok);
  console.info("Connected TikTok account", { id: account.id, label: account.label });
  return res.json({ ok: true, id: account.id, label: account.label });
});

app.post("/tiktok/publish", (req, res) => {
  res.status(501).json({
    error:
      "TikTok publishing requires API setup. Store account via /tiktok/connect and add publishing credentials.",
  });
});

app.get("/crosspost/links", (req, res) => {
  res.json({ links: storedCrosspost });
});

app.post("/crosspost/links", (req, res) => {
  const { name, youtubeChannelId, instagramAccountId, tiktokAccountId } = req.body || {};
  if (!youtubeChannelId) {
    return res.status(400).json({ error: "YouTube channel required" });
  }
  const link = {
    name: name || "",
    youtubeChannelId,
    instagramAccountId: instagramAccountId || "",
    tiktokAccountId: tiktokAccountId || "",
  };
  storedCrosspost = storedCrosspost.filter(
    (item) => item.youtubeChannelId !== youtubeChannelId
  );
  storedCrosspost.push(link);
  saveStoredCrosspost(storedCrosspost);
  console.info("Saved crosspost link", link);
  return res.json({ ok: true });
});

app.get("/settings", (req, res) => {
  res.json(storedSettings);
});

app.post("/settings", (req, res) => {
  const { presetName, publishTo, autoSchedule } = req.body || {};
  storedSettings = {
    presetName: presetName || "",
    publishTo: {
      youtube: Boolean(publishTo?.youtube),
      instagram: Boolean(publishTo?.instagram),
      tiktok: Boolean(publishTo?.tiktok),
    },
    autoSchedule: Boolean(autoSchedule),
  };
  saveStoredSettings(storedSettings);
  console.info("Saved settings", storedSettings);
  return res.json({ ok: true });
});

app.get("/channels", (req, res) => {
  res.json({
    channels: storedChannels.map((channel) => ({
      id: channel.id,
      title: channel.title,
      label: channel.label,
    })),
  });
});

app.post("/upload", ensureAuthenticated, upload.array("videos"), async (req, res) => {
  try {
    const files = req.files || [];
    if (files.length === 0) {
      return res.status(400).json({ error: "No video files provided" });
    }

    const { privacyStatus } = req.body;
    const titleValues = req.body.title || [];
    const titleList = Array.isArray(titleValues) ? titleValues : [titleValues];
    const descriptionValues = req.body.description || [];
    const descriptionList = Array.isArray(descriptionValues)
      ? descriptionValues
      : [descriptionValues];
    const publishAtValues = req.body.publishAt || [];
    const publishAtList = Array.isArray(publishAtValues)
      ? publishAtValues
      : [publishAtValues];
    const channelValues = req.body.channelId || [];
    const channelList = Array.isArray(channelValues)
      ? channelValues
      : [channelValues];
    const channels = storedChannels;

    console.info("Upload request received", {
      files: files.length,
      channels: channels.length,
    });

    const results = [];
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const filePath = file.path;
      const publishAt = publishAtList[index];
      const videoTitle = titleList[index] || file.originalname || "Untitled upload";
      const videoDescription = descriptionList[index] || "";
      const isDraft = privacyStatus === "draft";
      const scheduledPublishAt = publishAt && !isDraft
        ? new Date(publishAt).toISOString()
        : undefined;
      const resolvedPrivacyStatus = scheduledPublishAt
        ? "private"
        : isDraft
          ? "private"
          : privacyStatus || "private";
      const selectedChannelId = channelList[index] || channels[0]?.id;
      const channel = channels.find((item) => item.id === selectedChannelId);

      if (!channel) {
        fs.unlink(filePath, () => {});
        return res.status(400).json({ error: "Selected channel not found" });
      }

      const authedClient = createOAuthClient(channel.tokens);
      const proxyAgent = channel.proxyUrl ? new HttpsProxyAgent(channel.proxyUrl) : undefined;
      const youtube = google.youtube({
        version: "v3",
        auth: authedClient,
        requestOptions: proxyAgent ? { agent: proxyAgent } : undefined,
      });

      const requestBody = {
        snippet: {
          title: videoTitle,
          description: videoDescription,
        },
        status: {
          privacyStatus: resolvedPrivacyStatus,
          ...(scheduledPublishAt ? { publishAt: scheduledPublishAt } : {}),
        },
      };

      console.info("Uploading video", {
        index: index + 1,
        file: file.originalname,
        channel: channel.title,
        publishAt: scheduledPublishAt || (isDraft ? "draft" : "immediate"),
      });

      const response = await youtube.videos.insert({
        part: ["snippet", "status"],
        requestBody,
        media: {
          body: fs.createReadStream(filePath),
        },
      });

      fs.unlink(filePath, () => {});

      results.push({
        id: response.data.id,
        title: response.data.snippet?.title,
        status: response.data.status?.privacyStatus,
        publishAt: response.data.status?.publishAt,
        channelId: channel.id,
        channelTitle: channel.title,
      });
    }

    res.json({ uploads: results });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Upload failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
