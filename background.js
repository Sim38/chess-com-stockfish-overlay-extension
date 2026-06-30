const TAG = "background.js";

createOffscreen();
async function createOffscreen() {
  if (await chrome.offscreen.hasDocument()) return;

  await chrome.offscreen.createDocument({
    url: "offscreen.html",
    reasons: ["WORKERS"],
    justification: "Run Stockfish engine",
  });

  chrome.storage.local.get("settings", (data) => {
    updateSettings({ data: data.settings });
  });
}

const messageHandlers = {
  ANALYZE: analyze,
  BESTMOVE: bestMove,
  UPDATE_SETTINGS: updateSettings,
};

chrome.runtime.onMessage.addListener((msg) => {
  console.log(`[${TAG}] Received Message:`, msg);
  const handler = messageHandlers[msg.type];
  if (handler) {
    handler(msg);
  } else {
    console.log(`[${TAG}] Handler for ${msg.type} does not exist!`);
  }
});

function analyze(msg) {
  chrome.runtime.sendMessage({
    type: "OFFSCREEN_ANALYZE",
    fen: msg.fen,
  });
}

function bestMove(msg) {
  // Send data to content.js
  chrome.tabs.query({ url: "*://*.chess.com/*" }, (tabs) => {
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, {
        type: "BESTMOVE",
        data: msg.data,
      });
    }
  });
}

function updateSettings(msg) {
  chrome.runtime.sendMessage({
    type: "OFFSCREEN_UPDATE_SETTINGS",
    data: msg.data,
  });

  // Send data to content.js
  chrome.tabs.query({ url: "*://*.chess.com/*" }, (tabs) => {
    for (const tab of tabs) {
      chrome.tabs.sendMessage(tab.id, {
        type: "UPDATE_SETTINGS",
        data: msg.data,
      });
    }
  });
}
