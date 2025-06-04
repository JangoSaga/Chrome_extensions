/* eslint-disable no-undef */
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('PRODBOARD INSTALLED');
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'Extension Installed',
    message: 'ProdBoard has been successfully installed!',
  });
  if (details.reason === 'install') {
    await initialiseDefaults();
  }
});

async function initialiseDefaults() {
  const defaults = {
    websiteData: {},
    distracted_domains: ['www.youtube.com', 'www.yahoo.com'],
    siteLimit: {
      'www.example.com': 1,
    },
    notificationSettings: {
      enabled: true,
      warningTime: 30, // seconds before limit
      showRemaining: true,
    },
  };
  console.log('Defaults set.', defaults);
  await chrome.storage.local.set(defaults);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received in background script:', message);

  if (message.type === 'ACTIVITY_UPDATE') {
    handleActivityUpdate(message.data)
      .then((response) => {
        sendResponse({
          status: 'success',
          message: 'Activity logged and stored.',
          ...response,
        });
      })
      .catch((error) => {
        console.error('Error handling activity update:', error);
        sendResponse({
          status: 'error',
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
    const storage = await chrome.storage.local.get(['websiteData']);
    const websiteData = storage.websiteData || {};

    if (isDistracting) {
      const now = new Date();
      const currentDay = now.toISOString().split('T')[0];
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
    console.error('Error in handleActivityUpdate:', error);
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
    const [year, weekNum] = week.split('-W');
    const weekDate = getDateOfWeek(parseInt(weekNum), parseInt(year));
    if (weekDate < twelveWeeksAgo) {
      delete totalTime.weekly[week];
    }
  });

  Object.keys(totalTime.monthly).forEach((month) => {
    const [year, monthNum] = month.split('-');
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
    const data = await chrome.storage.local.get(['distracted_domains']);
    const distractedDomains = data.distracted_domains || [];
    return distractedDomains.includes(domainCheck);
  } catch (error) {
    console.error('Error getting categories:', error);
    throw error;
  }
}

async function addDistractedSites(newSites) {
  try {
    const data = await chrome.storage.local.get(['distracted_domains']);
    const distractedDomains = data.distracted_domains || [];
    const newDistractedDomains = [...distractedDomains, ...newSites];
    await chrome.storage.local.set({
      distracted_domains: newDistractedDomains,
    });
  } catch (error) {
    console.error('Error updating categories:', error);
  }
}

async function deleteDistractedSite(domain) {
  try {
    const data = await chrome.storage.local.get(['distracted_domains']);
    const distractedDomains = data.distracted_domains || [];
    const newDistractedDomains = distractedDomains.filter(
      (site) => site !== domain
    );
    await chrome.storage.local.set({
      distracted_domains: newDistractedDomains,
    });
  } catch (error) {
    console.error('Error updating categories:', error);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ADD_DISTRACTED_SITE') {
    addDistractedSites([message.site])
      .then(() => {
        sendResponse({ status: 'success', message: 'Site added.' });
      })
      .catch((error) => {
        console.error('Error adding site:', error);
        sendResponse({ status: 'error', message: error.message });
      });
    return true;
  }

  if (message.type === 'DELETE_DISTRACTED_SITE') {
    deleteDistractedSite(message.site)
      .then(() => {
        sendResponse({ status: 'success', message: 'Site deleted.' });
      })
      .catch((error) => {
        console.error('Error deleting site:', error);
        sendResponse({ status: 'error', message: error.message });
      });
    return true;
  }

  if (message.type === 'UPDATE_SITE_LIMIT') {
    updateSiteLimit(message.site, message.limit)
      .then(() => {
        sendResponse({ status: 'success', message: 'Site limit updated.' });
      })
      .catch((error) => {
        console.error('Error updating site limit:', error);
        sendResponse({ status: 'error', message: error.message });
      });
    return true;
  }

  if (message.type === 'GET_SITE_DATA') {
    getSiteData()
      .then((data) => {
        sendResponse({ status: 'success', data });
      })
      .catch((error) => {
        console.error('Error getting site data:', error);
        sendResponse({ status: 'error', message: error.message });
      });
    return true;
  }
});

async function updateSiteLimit(site, limit) {
  try {
    const data = await chrome.storage.local.get(['siteLimit']);
    const siteLimit = data.siteLimit || {};
    siteLimit[site] = limit;
    await chrome.storage.local.set({ siteLimit });
  } catch (error) {
    console.error('Error updating site limit:', error);
    throw error;
  }
}

async function getSiteData() {
  try {
    const data = await chrome.storage.local.get([
      'websiteData',
      'distracted_domains',
      'siteLimit',
    ]);
    return {
      websiteData: data.websiteData || {},
      distracted_domains: data.distracted_domains || [],
      siteLimit: data.siteLimit || {},
    };
  } catch (error) {
    console.error('Error getting site data:', error);
    throw error;
  }
}

let siteTimeData = {};
let notificationTimers = {};

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const hostname = new URL(tab.url).hostname;

    // Get site limits from storage
    const { siteLimit } = await chrome.storage.local.get(['siteLimit']);
    if (siteLimit && siteLimit[hostname]) {
      // Track time for the site
      trackSiteTime(tabId, hostname, siteLimit[hostname]);
    }
  }
});

let trackingIntervals = {};

async function trackSiteTime(tabId, hostname, limit) {
  if (!trackingIntervals[tabId]) {
    console.log(`Started tracking time for ${hostname}`);

    // Get notification settings
    const { notificationSettings } = await chrome.storage.local.get([
      'notificationSettings',
    ]);
    const settings = notificationSettings || {
      enabled: true,
      warningTime: 30,
      showRemaining: true,
    };

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
      const elapsed = Date.now() - tabData.startTime;
      tabData.timeSpent += elapsed;

      const limitMs = limit * 60 * 1000;
      const timeRemaining = limitMs - tabData.timeSpent;
      const warningTime = settings.warningTime * 1000;

      // Send notification warning before limit is reached
      if (
        settings.enabled &&
        timeRemaining <= warningTime &&
        timeRemaining > 0 &&
        !notificationTimers[tabId]
      ) {
        const remainingMinutes = Math.ceil(timeRemaining / 60000);

        chrome.notifications.create(`warning-${tabId}`, {
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: 'ProdBoard Warning',
          message: settings.showRemaining
            ? `Time limit approaching for ${hostname}. ${remainingMinutes} minute(s) remaining.`
            : `Time limit approaching for ${hostname}.`,
          priority: 2,
        });

        notificationTimers[tabId] = true;
      }

      // Check if time spent exceeds the limit
      if (tabData.timeSpent >= limitMs) {
        // Send final notification
        chrome.notifications.create(`limit-reached-${tabId}`, {
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: 'ProdBoard - Time Limit Reached',
          message: `Time limit reached for ${hostname}. Redirecting...`,
          priority: 2,
        });

        // Redirect user to a different page
        chrome.tabs.update(tabId, { url: 'https://www.google.com' });

        // Clean up after redirect
        clearInterval(trackingIntervals[tabId]);
        delete trackingIntervals[tabId];
        delete siteTimeData[tabId];
        delete notificationTimers[tabId];
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
    delete notificationTimers[tabId];
  }
});

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
  chrome.notifications.clear(notificationId);

  // Open the extension popup or dashboard
  if (
    notificationId.includes('warning') ||
    notificationId.includes('limit-reached')
  ) {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
  }
});
