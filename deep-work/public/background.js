// Time tracking state
let activeTab = null;
let startTime = null;

// Initialize storage with default values
chrome.runtime.onInstalled.addListener(async () => {
  try {
    const existing = await chrome.storage.local.get([
      "categories",
      "goals",
      "settings",
      "websiteData",
    ]);

    const defaults = {
      websiteData: existing.websiteData || {},
      categories: existing.categories || {
        focusSites: ["www.leetcode.com"],
        distractedSites: ["www.youtube.com"],
      },
      goals: existing.goals || [
        {
          type: "FOCUS_INC",
          description: "Boost focus:",
          target: 0,
          progress: 0,
        },
        {
          type: "DISTRACTION_LIMIT",
          description: "Reduce distraction:",
          target: 0,
          progress: 0,
        },
        {
          type: "TOTAL_PRODUCTIVITY",
          description: "Boost productivity:",
          target: 0,
          progress: 0,
        },
      ],
      settings: existing.settings || {
        focusMode: false,
        focusHours: [],
        notifications: true,
      },
    };

    await chrome.storage.local.set(defaults);
  } catch (error) {
    console.error("Error initializing defaults:", error);
  }
});

// Track active tab changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    handleTabChange(tab);
  } catch (error) {
    console.error("Error fetching active tab:", error);
  }
});

// Track URL changes within the same tab
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    handleTabChange(tab);
  }
});

// Handle tab/URL changes
async function handleTabChange(tab) {
  try {
    if (activeTab) {
      await saveTimeData(activeTab.url, Date.now() - startTime);
    }

    activeTab = tab;
    startTime = Date.now();

    if (!tab || !tab.url) return;

    const { settings } = await chrome.storage.local.get("settings");
    if (settings.focusMode && (await isDistracting(tab.url))) {
      showFocusModeNotification();
    }
  } catch (error) {
    console.error("Error handling tab change:", error);
  }
}

// Save time data to storage
async function saveTimeData(url, screenTime) {
  try {
    if (!url.startsWith("http")) return;
    const domain = new URL(url).hostname;
    const { websiteData = {} } = await chrome.storage.local.get("websiteData");

    if (!websiteData[domain]) {
      websiteData[domain] = {
        totalTime: 0,
        daily: {},
      };
    }

    const today = new Date().toISOString().split("T")[0];
    websiteData[domain].totalTime += screenTime;

    if (!websiteData[domain].daily[today]) {
      websiteData[domain].daily[today] = 0;
    }
    websiteData[domain].daily[today] += screenTime;

    await chrome.storage.local.set({ websiteData });
  } catch (error) {
    console.error("Error saving time data:", error);
  }
}

// Check if website is in distracting categories
async function isDistracting(url) {
  try {
    const domain = new URL(url).hostname;
    const { categories } = await chrome.storage.local.get("categories");
    return categories.distractedSites.includes(domain);
  } catch (error) {
    console.error("Error checking distraction status:", error);
    return false;
  }
}

// Notification handling
function showFocusModeNotification() {
  if (chrome.notifications) {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.png",
      title: "Focus Mode Active",
      message:
        "You are trying to access a distracting website during focus hours.",
    });
  } else {
    console.error("Chrome notifications API is not available.");
  }
}

// Periodic saving of active tab data
setInterval(async () => {
  try {
    if (activeTab && activeTab.id) {
      const response = await chrome.tabs.sendMessage(activeTab.id, {
        type: "GET_PAGE_INFO",
      });
      if (response && response.isActive) {
        await saveTimeData(activeTab.url, 30000);
      }
    }
  } catch (error) {
    console.error("Error in periodic saving:", error);
  }
}, 30000);
