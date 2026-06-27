console.log("running offscreen");

const stockfish = new Worker("/engines/stockfish-18-lite/stockfish-18-lite.js");
const maxDepth = 15;

stockfish.postMessage("uci");
stockfish.postMessage("setoption name MultiPV value 3");
stockfish.postMessage("position startpos");
stockfish.postMessage(`go depth ${maxDepth}`);

stockfish.onmessage = (event) => {
  const line = event.data;
  // console.log("Stockfish:", line);

  if (isMaxDepthInfoLine(line)) {
    const moveData = parsePV(line);
    if (moveData) {
      console.log(`Best Move [${moveData[0]}]: ${moveData[1]}`);

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
  if (msg.type === "OFFSCREEN_ANALYZE") {
    console.log("Analyze request:", msg);
    updateStockfish(msg.uci);
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

function updateStockfish(move) {
  stockfish.postMessage("stop");
  stockfish.postMessage("position startpos moves " + move);
  stockfish.postMessage(`go depth ${maxDepth}`);
}
