let globalMoves = "";
let gameObserverIntervalId = null;

let settings = {};

chrome.storage.local.get("settings", (data) => {
  settings = data.settings;
});

waitForBoardHistory(startBoardHistoryObserver);

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "BESTMOVE") {
    console.log("Engine says:", msg.data);
    showBestMoves(msg.data);
  } else if (msg.type === "UPDATE_SETTINGS") {
    const newSettings = msg.data;
    settings = newSettings;

    if (!settings.isEnabled) {
      clearArrows();
    }
  }
});

function waitForBoardHistory(callback) {
  const boardHistory = document.getElementById("scroll-container");

  if (boardHistory) {
    callback();
    return;
  }

  const observer = new MutationObserver(() => {
    const boardHistory = document.getElementById("scroll-container");

    if (boardHistory) {
      observer.disconnect();
      callback();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function startBoardHistoryObserver() {
  const boardHistory = document.getElementById("scroll-container");

  const boardHistoryObserver = new MutationObserver((mutations) => {
    console.log("\nBoard history changed");
    const uciHistory = getUciHistory();
    const moves = uciHistory.join(" ");

    if (settings.isEnabled && moves !== globalMoves) {
      console.log("New Move Spotted", moves);
      clearArrows();
      globalMoves = moves;

      chrome.runtime.sendMessage({ type: "ANALYZE", uci: moves });
    }
  });

  boardHistoryObserver.observe(boardHistory, {
    childList: true,
    subtree: true,
  });
}
function getUciHistory() {
  const chess = new Chess();

  const moves = document.getElementsByClassName("node main-line-ply");
  for (const move of moves) {
    const piece = move.querySelector("[data-figurine]");
    let moveNotation = move.innerText.trim();

    if (piece) {
      moveNotation = piece.dataset.figurine + moveNotation;
    }

    chess.move(moveNotation);
  }

  const history = chess.history({ verbose: true });
  const uciHistory = history.map((m) => m.from + m.to + (m.promotion || ""));

  return uciHistory;
}

function showBestMoves(moves) {
  const coords = moveToCoords(moves.move);
  drawArrows(coords.from, coords.to, moves.rank);
}

function moveToCoords(uci, flipped = false) {
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);

  return {
    from: squareToCoord(from, flipped),
    to: squareToCoord(to, flipped),
  };
}

function squareToCoord(square, flipped = false) {
  const file = square.charCodeAt(0) - 97; // a-h → 0-7
  const rank = parseInt(square[1]) - 1; // 1-8 → 0-7

  let x = file * 12.5;
  let y = (7 - rank) * 12.5;

  if (flipped) {
    x = 100 - x;
    y = 100 - y;
  }

  return { x: x + 6.25, y: y + 6.25 }; // center of square
}

function adjustToCoordinates(from, to, shrinkAmount) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  const len = Math.sqrt(dx * dx + dy * dy);

  // avoid division by zero
  if (len === 0) return { from, to };

  const ratio = (len - shrinkAmount) / len;

  return {
    x: from.x + dx * ratio,
    y: from.y + dy * ratio,
  };
}

function drawArrows(from, to, rank) {
  // const colors = ["rgb(0, 200, 120)", "rgb(255, 170, 0)", "rgb(255, 80, 80)"];
  const colors = [
    "rgb(0, 200, 120)", // Best move (strong green)
    "rgb(120, 210, 90)", // Good (lighter green)
    "rgb(255, 200, 0)", // Slightly worse (yellow)
    "rgb(255, 140, 0)", // Bad (orange)
    "rgb(255, 70, 70)", // Worst (red)
  ];
  const arrowId = `rank${rank}Arrow`;

  const svg = document
    .querySelector("wc-chess-board")
    .querySelector("svg.arrows");
  const NS = "http://www.w3.org/2000/svg";

  const existingArrow = svg.getElementById(arrowId);
  if (existingArrow) {
    existingArrow.remove();
  }

  const line = document.createElementNS(NS, "line");
  line.id = arrowId;

  const adjustedTo = adjustToCoordinates(from, to, 7);

  line.setAttribute("x1", from.x);
  line.setAttribute("y1", from.y);
  line.setAttribute("x2", adjustedTo.x);
  line.setAttribute("y2", adjustedTo.y);

  line.setAttribute("stroke", colors[rank - 1]);
  line.setAttribute("stroke-width", "2.5");
  line.setAttribute("stroke-linecap", "round");
  line.setAttribute("opacity", "0.6");

  // arrow head
  const markerId = "arrowhead";

  if (!svg.querySelector("#arrowhead")) {
    const defs = document.createElementNS(NS, "defs");

    const marker = document.createElementNS(NS, "marker");
    marker.setAttribute("id", markerId);
    marker.setAttribute("markerWidth", "10");
    marker.setAttribute("markerHeight", "10");
    marker.setAttribute("refX", "0");
    marker.setAttribute("refY", "1.5");
    marker.setAttribute("orient", "auto");

    const poly = document.createElementNS(NS, "polygon");
    poly.setAttribute("points", "0 0, 3 1.5, 0 3");
    poly.setAttribute("fill", "context-stroke");

    marker.appendChild(poly);
    defs.appendChild(marker);
    svg.appendChild(defs);
  }

  line.setAttribute("marker-end", "url(#arrowhead)");

  svg.appendChild(line);
  return line;
}

function clearArrows() {
  const svg = document
    .querySelector("wc-chess-board")
    .querySelector("svg.arrows");
  svg.querySelectorAll("line").forEach((el) => el.remove());
}

function clearArrow(rank) {
  const arrowId = `rank${rank}Arrow`;
  const svg = document
    .querySelector("wc-chess-board")
    .querySelector("svg.arrows");

  const existingArrow = svg.getElementById(arrowId);
  if (existingArrow) {
    existingArrow.remove();
  }
}
