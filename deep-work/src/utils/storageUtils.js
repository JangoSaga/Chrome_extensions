export const StorageUtils = {
  // Get all website tracking data
  async getWebsiteData() {
    const data = await chrome.storage.local.get({ websiteData: {} });
    return data.websiteData;
  },

  // Get data for specific time period
  async getTimeRangeData(startDate, endDate) {
    const websiteData = await this.getWebsiteData();
    const filteredData = {};

    Object.entries(websiteData).forEach(([domain, data]) => {
      filteredData[domain] = {
        totalTime: 0,
        daily: {},
      };

      Object.entries(data.daily).forEach(([date, time]) => {
        if (
          this.formatDate(date) >= startDate &&
          this.formatDate(date) <= endDate
        ) {
          filteredData[domain].daily[date] = time;
          filteredData[domain].totalTime += time;
        }
      });
    });

    return filteredData;
  },

  // Add or Update Website Data
  async addOrUpdateWebsiteData(domain, timeSpent) {
    const websiteData = await this.getWebsiteData();

    if (!websiteData[domain]) {
      websiteData[domain] = {
        totalTime: 0,
        daily: {},
        weekly: {},
        monthly: {},
      };
    }

    const today = this.formatDate(new Date());

    websiteData[domain].totalTime += timeSpent;

    // Update daily data
    if (!websiteData[domain].daily[today]) {
      websiteData[domain].daily[today] = 0;
    }
    websiteData[domain].daily[today] += timeSpent;

    try {
      await chrome.storage.local.set({ websiteData });
    } catch (error) {
      console.error("Error updating website data:", error);
    }
  },

  // Get/Set Categories
  async getCategories() {
    const data = await chrome.storage.local.get({
      categories: { focusSites: [], distractedSites: [] },
    });
    return data.categories;
  },

  async updateCategories(categories) {
    try {
      await chrome.storage.local.set({ categories });
    } catch (error) {
      console.error("Error updating categories:", error);
    }
  },

  // Get/Set Goals
  async getGoals() {
    const data = await chrome.storage.local.get({ goals: [] });
    return data.goals;
  },

  async updateGoals(goals) {
    try {
      await chrome.storage.local.set({ goals });
    } catch (error) {
      console.error("Error updating goals:", error);
    }
  },

  // Get/Set Settings
  async getSettings() {
    const data = await chrome.storage.local.get({
      settings: { focusMode: false, notifications: true },
    });
    return data.settings;
  },

  async updateSettings(settings) {
    try {
      await chrome.storage.local.set({ settings });
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  },

  // Clear all data
  async clearData() {
    try {
      await chrome.storage.local.clear();
    } catch (error) {
      console.error("Error clearing data:", error);
    }
  },

  // Format time into readable format
  formatTime(ms) {
    const seconds = Math.round(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  },

  // Format date into 'YYYY-MM-DD'
  formatDate(date) {
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  },

  // Focus Mode Methods
  async getFocusMode() {
    const settings = await this.getSettings();
    return settings.focusMode || false;
  },

  async setFocusMode(isEnabled) {
    const settings = await this.getSettings();
    settings.focusMode = isEnabled;
    await this.updateSettings(settings);
  },

  // Aggregated Time Data
  async getCategoryTime() {
    const websiteData = await this.getWebsiteData();
    const { focusSites, distractedSites } = await this.getCategories();

    let totalFocusTime = 0;
    let totalDistractedTime = 0;

    Object.entries(websiteData).forEach(([domain, domainData]) => {
      const timeSpent = domainData.totalTime || 0;

      if (focusSites.includes(domain)) {
        totalFocusTime += timeSpent;
      }

      if (distractedSites.includes(domain)) {
        totalDistractedTime += timeSpent;
      }
    });

    return {
      totalFocusTime,
      totalDistractedTime,
    };
  },

  async getTotalTimeSpentOverall() {
    const websiteData = await this.getWebsiteData();
    return Object.values(websiteData).reduce(
      (acc, domainData) => acc + (domainData.totalTime || 0),
      0
    );
  },
};
