/* eslint-disable no-undef */
// Storage utilities for SiteSort Pro Chrome Extension

// Storage keys
const STORAGE_KEYS = {
  WEBSITES: 'sitesort_websites',
  CATEGORIES: 'sitesort_categories',
  SETTINGS: 'sitesort_settings',
  STATS: 'sitesort_stats',
};

// Website storage functions
export async function getWebsites() {
  try {
    const result = await chrome.storage.sync.get([STORAGE_KEYS.WEBSITES]);
    return result[STORAGE_KEYS.WEBSITES] || [];
  } catch (error) {
    console.error('Error getting websites from storage:', error);
    return [];
  }
}

export async function saveWebsites(websites) {
  try {
    await chrome.storage.sync.set({
      [STORAGE_KEYS.WEBSITES]: websites,
    });

    // Update stats
    await updateStats();

    console.log('Websites saved to storage');
    return true;
  } catch (error) {
    console.error('Error saving websites to storage:', error);

    // Try local storage as fallback
    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.WEBSITES]: websites,
      });
      console.log('Websites saved to local storage as fallback');
      return true;
    } catch (localError) {
      console.error('Error saving to local storage:', localError);
      return false;
    }
  }
}

async function getWebsiteById(id) {
  const websites = await getWebsites();
  return websites.find((website) => website.id === id);
}

async function getWebsiteByDomain(domain) {
  const websites = await getWebsites();
  return websites.find((website) => website.domain === domain);
}

async function addWebsite(websiteData) {
  const websites = await getWebsites();
  const newWebsite = {
    id: Date.now(),
    domain: websiteData.domain,
    category: websiteData.category,
    description: websiteData.description || '',
    visits: 0,
    lastVisit: null,
    dateAdded: new Date().toISOString(),
    ...websiteData,
  };

  websites.push(newWebsite);
  await saveWebsites(websites);
  return newWebsite;
}

async function updateWebsite(id, updateData) {
  const websites = await getWebsites();
  const index = websites.findIndex((website) => website.id === id);

  if (index !== -1) {
    websites[index] = { ...websites[index], ...updateData };
    await saveWebsites(websites);
    return websites[index];
  }

  return null;
}

async function deleteWebsite(id) {
  const websites = await getWebsites();
  const filteredWebsites = websites.filter((website) => website.id !== id);
  await saveWebsites(filteredWebsites);
  return filteredWebsites;
}

// Category storage functions
export async function getCategories() {
  try {
    const result = await chrome.storage.sync.get([STORAGE_KEYS.CATEGORIES]);
    return (
      result[STORAGE_KEYS.CATEGORIES] || [
        'Entertainment',
        'Education',
        'Work',
        'Social Media',
        'News',
        'Shopping',
        'Technology',
        'Health',
        'Finance',
        'Travel',
      ]
    );
  } catch (error) {
    console.error('Error getting categories from storage:', error);
    return [];
  }
}

export async function saveCategories(categories) {
  try {
    await chrome.storage.sync.set({
      [STORAGE_KEYS.CATEGORIES]: categories,
    });
    console.log('Categories saved to storage');
    return true;
  } catch (error) {
    console.error('Error saving categories to storage:', error);

    // Fallback to local storage
    try {
      await chrome.storage.local.set({
        [STORAGE_KEYS.CATEGORIES]: categories,
      });
      console.log('Categories saved to local storage as fallback');
      return true;
    } catch (localError) {
      console.error('Error saving categories to local storage:', localError);
      return false;
    }
  }
}

async function addCategory(categoryName) {
  const categories = await getCategories();
  if (!categories.includes(categoryName)) {
    categories.push(categoryName);
    await saveCategories(categories);
  }
  return categories;
}

async function deleteCategory(categoryName) {
  const categories = await getCategories();
  const filteredCategories = categories.filter((cat) => cat !== categoryName);
  await saveCategories(filteredCategories);

  // Update websites that use this category to 'Uncategorized'
  const websites = await getWebsites();
  const updatedWebsites = websites.map((website) => {
    if (website.category === categoryName) {
      return { ...website, category: 'Uncategorized' };
    }
    return website;
  });

  await saveWebsites(updatedWebsites);
  return filteredCategories;
}

// Settings storage functions
async function getSettings() {
  try {
    const result = await chrome.storage.sync.get([STORAGE_KEYS.SETTINGS]);
    return (
      result[STORAGE_KEYS.SETTINGS] || {
        showNotifications: true,
        showCategoryIndicator: true,
        trackVisits: true,
        autoSuggestCategories: true,
        darkMode: false,
        compactView: false,
      }
    );
  } catch (error) {
    console.error('Error getting settings from storage:', error);
    return {};
  }
}

async function saveSettings(settings) {
  try {
    const currentSettings = await getSettings();
    const updatedSettings = { ...currentSettings, ...settings };

    await chrome.storage.sync.set({
      [STORAGE_KEYS.SETTINGS]: updatedSettings,
    });

    console.log('Settings saved to storage');
    return updatedSettings;
  } catch (error) {
    console.error('Error saving settings to storage:', error);
    return null;
  }
}

// Statistics storage functions
async function getStats() {
  try {
    const result = await chrome.storage.local.get([STORAGE_KEYS.STATS]);
    return (
      result[STORAGE_KEYS.STATS] || {
        totalWebsites: 0,
        totalVisits: 0,
        categoriesCount: 0,
        lastUpdated: new Date().toISOString(),
        topCategories: [],
        topWebsites: [],
      }
    );
  } catch (error) {
    console.error('Error getting stats from storage:', error);
    return {};
  }
}

async function updateStats() {
  try {
    const websites = await getWebsites();
    const categories = await getCategories();

    // Calculate total visits
    const totalVisits = websites.reduce(
      (sum, website) => sum + (website.visits || 0),
      0
    );

    // Get top categories
    const categoryCount = {};
    websites.forEach((website) => {
      categoryCount[website.category] =
        (categoryCount[website.category] || 0) + 1;
    });

    const topCategories = Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, count]) => ({ category, count }));

    // Get top websites by visits
    const topWebsites = websites
      .filter((website) => website.visits > 0)
      .sort((a, b) => (b.visits || 0) - (a.visits || 0))
      .slice(0, 10)
      .map((website) => ({
        domain: website.domain,
        category: website.category,
        visits: website.visits,
      }));

    const stats = {
      totalWebsites: websites.length,
      totalVisits: totalVisits,
      categoriesCount: categories.length,
      lastUpdated: new Date().toISOString(),
      topCategories: topCategories,
      topWebsites: topWebsites,
    };

    await chrome.storage.local.set({
      [STORAGE_KEYS.STATS]: stats,
    });

    return stats;
  } catch (error) {
    console.error('Error updating stats:', error);
    return null;
  }
}

// Bulk operations
async function exportData() {
  try {
    const websites = await getWebsites();
    const categories = await getCategories();
    const settings = await getSettings();
    const stats = await getStats();

    return {
      websites,
      categories,
      settings,
      stats,
      exportDate: new Date().toISOString(),
      version: '1.0.0',
    };
  } catch (error) {
    console.error('Error exporting data:', error);
    return null;
  }
}

async function importData(data) {
  try {
    if (data.websites) {
      await saveWebsites(data.websites);
    }

    if (data.categories) {
      await saveCategories(data.categories);
    }

    if (data.settings) {
      await saveSettings(data.settings);
    }

    // Update stats after import
    await updateStats();

    console.log('Data imported successfully');
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
}

async function clearAllData() {
  try {
    await chrome.storage.sync.clear();
    await chrome.storage.local.clear();
    console.log('All data cleared');
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    return false;
  }
}

// Search and filter functions
async function searchWebsites(query) {
  const websites = await getWebsites();

  if (!query || query.trim() === '') {
    return websites;
  }

  const searchTerm = query.toLowerCase().trim();

  return websites.filter((website) => {
    return (
      website.domain.toLowerCase().includes(searchTerm) ||
      website.category.toLowerCase().includes(searchTerm) ||
      (website.description &&
        website.description.toLowerCase().includes(searchTerm))
    );
  });
}

async function getWebsitesByCategory(category) {
  const websites = await getWebsites();

  if (!category || category === 'All') {
    return websites;
  }

  return websites.filter((website) => website.category === category);
}

async function getRecentWebsites(limit = 10) {
  const websites = await getWebsites();

  return websites
    .filter((website) => website.lastVisit)
    .sort((a, b) => new Date(b.lastVisit) - new Date(a.lastVisit))
    .slice(0, limit);
}

async function getMostVisitedWebsites(limit = 10) {
  const websites = await getWebsites();

  return websites
    .filter((website) => website.visits > 0)
    .sort((a, b) => (b.visits || 0) - (a.visits || 0))
    .slice(0, limit);
}

// Utility functions
function generateId() {
  return Date.now() + Math.random().toString(36).substr(2, 9);
}

async function getStorageUsage() {
  try {
    const syncUsage = await chrome.storage.sync.getBytesInUse();
    const localUsage = await chrome.storage.local.getBytesInUse();

    return {
      sync: {
        used: syncUsage,
        quota: chrome.storage.sync.QUOTA_BYTES,
        percentage: (syncUsage / chrome.storage.sync.QUOTA_BYTES) * 100,
      },
      local: {
        used: localUsage,
        quota: chrome.storage.local.QUOTA_BYTES,
        percentage: (localUsage / chrome.storage.local.QUOTA_BYTES) * 100,
      },
    };
  } catch (error) {
    console.error('Error getting storage usage:', error);
    return null;
  }
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = {
    // Website functions
    getWebsites,
    saveWebsites,
    getWebsiteById,
    getWebsiteByDomain,
    addWebsite,
    updateWebsite,
    deleteWebsite,

    // Category functions
    getCategories,
    saveCategories,
    addCategory,
    deleteCategory,

    // Settings functions
    getSettings,
    saveSettings,

    // Stats functions
    getStats,
    updateStats,

    // Bulk operations
    exportData,
    importData,
    clearAllData,

    // Search and filter
    searchWebsites,
    getWebsitesByCategory,
    getRecentWebsites,
    getMostVisitedWebsites,

    // Utilities
    generateId,
    getStorageUsage,
    STORAGE_KEYS,
  };
}
