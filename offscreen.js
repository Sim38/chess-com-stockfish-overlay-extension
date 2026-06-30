const TAG = "offscreen.js";

console.log(`[${TAG}]running offscreen`);

const stockfish = new Worker("/engines/stockfish-18-lite/stockfish-18-lite.js");
let maxDepth = 15;
let multiplePV = 3;
let isEnabled = true;
let latestMove = "";

stockfish.postMessage("fen");
stockfish.postMessage(`setoption name MultiPV value ${multiplePV}`);
stockfish.postMessage("position startpos");
stockfish.postMessage(`go depth ${maxDepth}`);

stockfish.onmessage = (event) => {
  const line = event.data;
  console.log(`[${TAG}] Stockfish:`, line);

  if (isMaxDepthInfoLine(line)) {
    const moveData = parsePV(line);
    if (moveData) {
      console.log(`[${TAG}] Best Move [${moveData[0]}]: ${moveData[1]}`);

      chrome.runtime.sendMessage({
        type: "BESTMOVE",
        data: {
          rank: moveData[0],
          move: moveData[1],
        },
      });
    }
  }
};

chrome.runtime.onMessage.addListener((msg) => {
  console.log(`[${TAG}] Received Message:`, msg);

  if (msg.type === "OFFSCREEN_ANALYZE") {
    latestMove = msg.fen;
    updateStockfish();
  } else if (msg.type === "OFFSCREEN_UPDATE_SETTINGS") {
    const newSettings = msg.data;
    const isChanged =
      newSettings.maxDepth != maxDepth ||
      newSettings.maxLines != multiplePV ||
      newSettings.isEnabled != isEnabled;

    if (isChanged) {
      maxDepth = newSettings.maxDepth;
      multiplePV = newSettings.maxLines;
      isEnabled = newSettings.isEnabled;

      updateStockfish();
    }
  }
});

function isMaxDepthInfoLine(line) {
  const maxDepthRegex = new RegExp(`\\bdepth ${maxDepth}\\b`);

  return (
    line.startsWith("info") &&
    line.includes("multipv") &&
    maxDepthRegex.test(line) // Check for "depth x"
  );
}

function parsePV(data) {
  const multipvMatch = data.match(/multipv (\d+)/);
  const pvMatch = data.match(/\bpv\b ([^\s]+)/);

  if (multipvMatch && pvMatch) {
    const moveRank = multipvMatch[1];
    const move = pvMatch[1];

    return [moveRank, move];
  }
}

function updateStockfish() {
  if (!isEnabled) return;

  stockfish.postMessage("stop");
  stockfish.postMessage(`setoption name MultiPV value ${multiplePV}`);
  stockfish.postMessage("position fen " + latestMove);
  stockfish.postMessage(`go depth ${maxDepth}`);
}
