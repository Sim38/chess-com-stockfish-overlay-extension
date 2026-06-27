createOffscreen();
async function createOffscreen() {
  if (await chrome.offscreen.hasDocument()) return;

  await chrome.offscreen.createDocument({
    url: "offscreen.html",
    reasons: ["WORKERS"],
    justification: "Run Stockfish engine",
  });
}

const messageHandlers = {
  ANALYZE: analyze,
  BESTMOVE: bestMove,
  UPDATE_SETTINGS: updateSettings,
};

chrome.runtime.onMessage.addListener((msg) => {
  console.log("Received", msg);

  const handler = messageHandlers[msg.type];
  if (handler) {
    handler(msg);
  } else {
    console.log(`Handler for ${msg.type} does not exist!`);
  }
});

function analyze(msg) {
  chrome.runtime.sendMessage({
    type: "OFFSCREEN_ANALYZE",
    uci: msg.uci,
  });
}

function bestMove(msg) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      type: "BESTMOVE",
      data: msg.data,
    });
  });
}

function updateSettings(msg) {
  chrome.runtime.sendMessage({
    type: "OFFSCREEN_UPDATE_SETTINGS",
    data: msg.data,
  });

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      type: "UPDATE_SETTINGS",
      data: msg.data,
    });
  });
}
