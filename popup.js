const defaultSettings = {
  maxDepth: 15,
  maxLines: 3,
};

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Settings
  chrome.storage.local.get("settings", (data) => {
    const settings = data.settings || defaultSettings;
    document.getElementById("maxDepth").value = settings.maxDepth;
    document.getElementById("maxLines").value = settings.maxLines;
  });

  // Initialize Button Clicks
  const resetButton = document.getElementById("resetButton");
  resetButton.addEventListener("click", resetSettings);

  const applyButton = document.getElementById("applyButton");
  applyButton.addEventListener("click", updateSettings);
});

function resetSettings() {
  const maxDepthInput = document.getElementById("maxDepth");
  maxDepthInput.value = defaultSettings.maxDepth;

  const maxLinesInput = document.getElementById("maxLines");
  maxLinesInput.value = defaultSettings.maxLines;

  chrome.storage.local.set({ settings: defaultSettings });
  chrome.runtime.sendMessage({
    type: "UPDATE_SETTINGS",
    data: defaultSettings,
  });
}

function updateSettings() {
  const maxDepthInput = document.getElementById("maxDepth");
  const maxLinesInput = document.getElementById("maxLines");

  // Validate maxDepth Input
  if (maxDepthInput.value <= 0) {
    maxDepthInput.value = 1;
  }

  // Validate maxLines Input
  if (maxLinesInput.value <= 0) {
    maxLinesInput.value = 1;
  } else if (maxLinesInput.value > 5) {
    maxLinesInput.value = 5;
  }

  const settings = {
    maxDepth: maxDepthInput.value,
    maxLines: maxLinesInput.value,
  };

  chrome.storage.local.set({ settings });
  chrome.runtime.sendMessage({
    type: "UPDATE_SETTINGS",
    data: settings,
  });
}
