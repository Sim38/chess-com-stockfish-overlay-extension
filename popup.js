const defaultSettings = {
  maxDepth: 15,
};

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Settings
  chrome.storage.local.get("settings", (data) => {
    const settings = data.settings || defaultSettings;
    document.getElementById("maxDepth").value = settings.maxDepth;
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

  chrome.storage.local.set({ settings: defaultSettings });
  chrome.runtime.sendMessage({
    type: "UPDATE_SETTINGS",
    data: defaultSettings,
  });
}

function updateSettings() {
  const maxDepthInput = document.getElementById("maxDepth");

  const settings = {
    maxDepth: maxDepthInput.value,
  };

  chrome.storage.local.set({ settings });
  chrome.runtime.sendMessage({
    type: "UPDATE_SETTINGS",
    data: settings,
  });
}
