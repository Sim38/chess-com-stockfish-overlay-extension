createOffscreen();
async function createOffscreen() {
  if (await chrome.offscreen.hasDocument()) return;

  await chrome.offscreen.createDocument({
    url: "offscreen.html",
    reasons: ["WORKERS"],
    justification: "Run Stockfish engine",
  });
}

chrome.runtime.onMessage.addListener((msg) => {
  console.log("Received", msg);
  if (msg.type === "ANALYZE") {
    chrome.runtime.sendMessage({
      type: "OFFSCREEN_ANALYZE",
      uci: msg.uci,
    });
  } else if (msg.type === "BESTMOVE") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "BESTMOVE",
        data: msg.data,
      });
    });
  }
});
