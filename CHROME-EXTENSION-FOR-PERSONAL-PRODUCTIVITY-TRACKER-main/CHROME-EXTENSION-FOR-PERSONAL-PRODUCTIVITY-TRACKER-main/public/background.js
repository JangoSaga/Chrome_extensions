/* eslint-disable no-undef */
chrome.runtime.onInstalled.addListener(async () => {
  const defaults = {
    websiteData: {},
    distracted_domains: ["www.youtube.com", "www.yahoo.com"],
    siteLimit: {
      "www.example.com": 1,
    },
  };
  console.log("Extension installed. Defaults set:", defaults);
  await chrome.storage.local.set(defaults);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in background script:", message);

  if (message.type === "ACTIVITY_UPDATE") {
    handleActivityUpdate(message.data)
      .then((response) => {
        sendResponse({
          status: "success",
          message: "Activity logged and stored.",
          ...response,
        });
      })
      .catch((error) => {
        console.error("Error handling activity update:", error);
        sendResponse({
          status: "error",
          message: error.message,
        });
      });

    return true; // Keep the message channel open for async response
  }
  return true;
});

async function handleActivityUpdate(data) {
  try {
    const isDistracting = await isDistractingSites(data.hostname);
    const storage = await chrome.storage.local.get(["websiteData"]);
    const websiteData = storage.websiteData || {};

    if (isDistracting) {
      const now = new Date();
      const currentDay = now.toISOString().split("T")[0];
      const currentWeek = getWeekNumber(now);
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      if (!websiteData[data.hostname]) {
        websiteData[data.hostname] = {
          visits: 0,
          totalTime: {
            daily: {},
            weekly: {},
            monthly: {},
          },
          firstVisit: Date.now(),
          lastVisit: Date.now(),
          title: data.title,
        };
      }

      const domainData = websiteData[data.hostname];
      domainData.visits += 1;
      domainData.lastVisit = Date.now();
      domainData.title = data.title;

      if (!domainData.totalTime.daily[currentDay]) {
        domainData.totalTime.daily[currentDay] = 0;
      }
      if (!domainData.totalTime.weekly[`${currentYear}-W${currentWeek}`]) {
        domainData.totalTime.weekly[`${currentYear}-W${currentWeek}`] = 0;
      }
      if (!domainData.totalTime.monthly[`${currentYear}-${currentMonth}`]) {
        domainData.totalTime.monthly[`${currentYear}-${currentMonth}`] = 0;
      }

      if (data.isPageVisible) {
        const timeSinceLastActivity = Date.now() - data.lastActivity;
        domainData.totalTime.daily[currentDay] += timeSinceLastActivity;
        domainData.totalTime.weekly[`${currentYear}-W${currentWeek}`] +=
          timeSinceLastActivity;
        domainData.totalTime.monthly[`${currentYear}-${currentMonth}`] +=
          timeSinceLastActivity;
      }

      cleanupOldData(domainData.totalTime);
      await chrome.storage.local.set({ websiteData });

      console.log(
        `Updated data for ${data.hostname}:`,
        websiteData[data.hostname]
      );
    }

    return {
      stored: !!isDistracting,
      currentData: isDistracting ? websiteData[data.hostname] : null,
    };
  } catch (error) {
    console.error("Error in handleActivityUpdate:", error);
    throw error;
  }
}

function getWeekNumber(date) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

function cleanupOldData(totalTime) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const twelveWeeksAgo = new Date(now - 12 * 7 * 24 * 60 * 60 * 1000);
  const twelveMonthsAgo = new Date(now - 12 * 30 * 24 * 60 * 60 * 1000);

  Object.keys(totalTime.daily).forEach((day) => {
    if (new Date(day) < thirtyDaysAgo) {
      delete totalTime.daily[day];
    }
  });

  Object.keys(totalTime.weekly).forEach((week) => {
    const [year, weekNum] = week.split("-W");
    const weekDate = getDateOfWeek(parseInt(weekNum), parseInt(year));
    if (weekDate < twelveWeeksAgo) {
      delete totalTime.weekly[week];
    }
  });

  Object.keys(totalTime.monthly).forEach((month) => {
    const [year, monthNum] = month.split("-");
    const monthDate = new Date(parseInt(year), parseInt(monthNum) - 1);
    if (monthDate < twelveMonthsAgo) {
      delete totalTime.monthly[month];
    }
  });
}

function getDateOfWeek(week, year) {
  const jan4 = new Date(year, 0, 4);
  const dayOfJan4 = jan4.getDay();
  const firstMonday = new Date(jan4.getTime() - (dayOfJan4 - 1) * 86400000);
  return new Date(firstMonday.getTime() + (week - 1) * 7 * 86400000);
}

async function isDistractingSites(domainCheck) {
  try {
    const data = await chrome.storage.local.get(["distracted_domains"]);
    const distractedDomains = data.distracted_domains || [];
    return distractedDomains.includes(domainCheck);
  } catch (error) {
    console.error("Error getting categories:", error);
    throw error;
  }
}
async function addDistractedSites(newSites) {
  try {
    const data = await chrome.storage.local.get(["distracted_domains"]);
    const distractedDomains = data.distracted_domains || [];
    const newDistractedDomains = [...distractedDomains, ...newSites];
    await chrome.storage.local.set({
      distracted_domains: newDistractedDomains,
    });
  } catch (error) {
    console.error("Error updating categories:", error);
  }
}

async function deleteDistractedSite(domain) {
  try {
    const data = await chrome.storage.local.get(["distracted_domains"]);
    const distractedDomains = data.distracted_domains || [];
    const newDistractedDomains = distractedDomains.filter(
      (site) => site !== domain
    );
    await chrome.storage.local.set({
      distracted_domains: newDistractedDomains,
    });
  } catch (error) {
    console.error("Error updating categories:", error);
  }
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "ADD_DISTRACTED_SITE") {
    addDistractedSites([message.site])
      .then(() => {
        sendResponse({ status: "success", message: "Site added." });
      })
      .catch((error) => {
        console.error("Error adding site:", error);
        sendResponse({ status: "error", message: error.message });
      });
    return true;
  }

  if (message.type === "DELETE_DISTRACTED_SITE") {
    deleteDistractedSite(message.site)
      .then(() => {
        sendResponse({ status: "success", message: "Site deleted." });
      })
      .catch((error) => {
        console.error("Error deleting site:", error);
        sendResponse({ status: "error", message: error.message });
      });
    return true;
  }
});
let siteTimeData = {};

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    const hostname = new URL(tab.url).hostname;

    // Get site limits from storage
    const { siteLimits } = await chrome.storage.local.get(["siteLimits"]);
    // const limit = siteLimits[hostname];
    if (siteLimits && siteLimits[hostname]) {
      // Track time for the site
      trackSiteTime(tabId, hostname, siteLimits[hostname]);
    }
  }
});

let trackingIntervals = {};

async function trackSiteTime(tabId, hostname, limit) {
  if (!trackingIntervals[tabId]) {
    console.log(`Started tracking time for ${hostname}`);
    trackingIntervals[tabId] = setInterval(async () => {
      const currentTime = Date.now();

      // Initialize site data if not present
      if (!siteTimeData[tabId]) {
        siteTimeData[tabId] = {
          hostname,
          startTime: currentTime,
          timeSpent: 0,
        };
      }

      const tabData = siteTimeData[tabId];
      const elapsed = Date.now() - tabData.startTime; // Time since last check
      tabData.timeSpent += elapsed;

      // Check if time spent exceeds the limit
      if (tabData.timeSpent >= limit * 60 * 1000) {
        // Redirect user to a React page
        chrome.tabs.update(tabId, { url: "https://www.google.com" });

        // Clean up after redirect
        clearInterval(trackingIntervals[tabId]);
        delete trackingIntervals[tabId];
        delete siteTimeData[tabId];
      }

      // Reset start time for the next interval
      tabData.startTime = Date.now();
    }, 1000); // Check every second
  }
}

// Clean up tracking when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  if (trackingIntervals[tabId]) {
    clearInterval(trackingIntervals[tabId]);
    delete trackingIntervals[tabId];
    delete siteTimeData[tabId];
  }
});
