/* eslint-disable no-undef */
// Background script for SiteSort Pro Chrome Extension

// Import utilities
import {
  getWebsites,
  saveWebsites,
  getCategories,
  saveCategories,
} from '../utils/storage.js';
import { extractDomain } from '../utils/domain.js';

// Initialize extension on install
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('SiteSort Pro installed/updated');

  if (details.reason === 'install') {
    // Initialize default categories and sample data
    await initializeDefaultData();
  }
});

// Handle tab updates to track website visits
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const domain = extractDomain(tab.url);
    if (domain && !isSystemUrl(tab.url)) {
      await trackWebsiteVisit(domain, tab.url, tab.title);
    }
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);

  switch (request.action) {
    case 'getCurrentDomain':
      handleGetCurrentDomain(sender.tab, sendResponse);
      return true; // Keep message channel open for async response

    case 'getWebsiteData':
      handleGetWebsiteData(sendResponse);
      return true;

    case 'saveWebsiteData':
      handleSaveWebsiteData(request.data, sendResponse);
      return true;

    case 'deleteWebsite':
      handleDeleteWebsite(request.id, sendResponse);
      return true;

    case 'getCategories':
      handleGetCategories(sendResponse);
      return true;

    case 'saveCategories':
      handleSaveCategories(request.categories, sendResponse);
      return true;

    case 'exportData':
      handleExportData(sendResponse);
      return true;

    case 'importData':
      handleImportData(request.data, sendResponse);
      return true;

    default:
      console.warn('Unknown action:', request.action);
  }
});

// Initialize default data
async function initializeDefaultData() {
  try {
    const defaultCategories = [
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
    ];

    const defaultWebsites = [
      {
        id: Date.now() + 1,
        domain: 'youtube.com',
        category: 'Entertainment',
        description: 'Video streaming platform',
        visits: 0,
        lastVisit: null,
        dateAdded: new Date().toISOString(),
      },
      {
        id: Date.now() + 2,
        domain: 'github.com',
        category: 'Technology',
        description: 'Code repository and collaboration',
        visits: 0,
        lastVisit: null,
        dateAdded: new Date().toISOString(),
      },
      {
        id: Date.now() + 3,
        domain: 'coursera.org',
        category: 'Education',
        description: 'Online learning platform',
        visits: 0,
        lastVisit: null,
        dateAdded: new Date().toISOString(),
      },
    ];

    await saveCategories(defaultCategories);
    await saveWebsites(defaultWebsites);

    console.log('Default data initialized');
  } catch (error) {
    console.error('Error initializing default data:', error);
  }
}

// Track website visits
async function trackWebsiteVisit(domain, url, title) {
  try {
    const websites = await getWebsites();
    const existingWebsite = websites.find((site) => site.domain === domain);

    if (existingWebsite) {
      // Update visit count and last visit time
      existingWebsite.visits = (existingWebsite.visits || 0) + 1;
      existingWebsite.lastVisit = new Date().toISOString();
      existingWebsite.title = title || existingWebsite.title;

      await saveWebsites(websites);

      // Send notification to content script
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url && extractDomain(tabs[0].url) === domain) {
          chrome.tabs
            .sendMessage(tabs[0].id, {
              action: 'websiteTracked',
              website: existingWebsite,
            })
            .catch(() => {
              // Ignore errors if content script not ready
            });
        }
      });
    }
  } catch (error) {
    console.error('Error tracking website visit:', error);
  }
}

// Message handlers
async function handleGetCurrentDomain(tab, sendResponse) {
  try {
    if (tab && tab.url) {
      const domain = extractDomain(tab.url);
      const websites = await getWebsites();
      const website = websites.find((site) => site.domain === domain);

      sendResponse({
        success: true,
        domain: domain,
        website: website || null,
        url: tab.url,
        title: tab.title,
      });
    } else {
      sendResponse({
        success: false,
        error: 'No active tab found',
      });
    }
  } catch (error) {
    console.error('Error getting current domain:', error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}

async function handleGetWebsiteData(sendResponse) {
  try {
    const websites = await getWebsites();
    sendResponse({
      success: true,
      websites: websites,
    });
  } catch (error) {
    console.error('Error getting website data:', error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}

async function handleSaveWebsiteData(data, sendResponse) {
  try {
    const websites = await getWebsites();

    if (data.id) {
      // Update existing website
      const index = websites.findIndex((site) => site.id === data.id);
      if (index !== -1) {
        websites[index] = { ...websites[index], ...data };
      }
    } else {
      // Add new website
      const newWebsite = {
        ...data,
        id: Date.now(),
        visits: 0,
        lastVisit: null,
        dateAdded: new Date().toISOString(),
      };
      websites.push(newWebsite);
    }

    await saveWebsites(websites);
    sendResponse({
      success: true,
      websites: websites,
    });
  } catch (error) {
    console.error('Error saving website data:', error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}

async function handleDeleteWebsite(id, sendResponse) {
  try {
    const websites = await getWebsites();
    const filteredWebsites = websites.filter((site) => site.id !== id);

    await saveWebsites(filteredWebsites);
    sendResponse({
      success: true,
      websites: filteredWebsites,
    });
  } catch (error) {
    console.error('Error deleting website:', error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}

async function handleGetCategories(sendResponse) {
  try {
    const categories = await getCategories();
    sendResponse({
      success: true,
      categories: categories,
    });
  } catch (error) {
    console.error('Error getting categories:', error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}

async function handleSaveCategories(categories, sendResponse) {
  try {
    await saveCategories(categories);
    sendResponse({
      success: true,
      categories: categories,
    });
  } catch (error) {
    console.error('Error saving categories:', error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}

async function handleExportData(sendResponse) {
  try {
    const websites = await getWebsites();
    const categories = await getCategories();

    const exportData = {
      websites: websites,
      categories: categories,
      exportDate: new Date().toISOString(),
      version: '1.0.0',
    };

    sendResponse({
      success: true,
      data: exportData,
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}

async function handleImportData(data, sendResponse) {
  try {
    if (data.websites) {
      await saveWebsites(data.websites);
    }

    if (data.categories) {
      await saveCategories(data.categories);
    }

    sendResponse({
      success: true,
      message: 'Data imported successfully',
    });
  } catch (error) {
    console.error('Error importing data:', error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}

// Utility functions to check system URLs
function isSystemUrl(url) {
  const systemUrls = [
    'chrome://',
    'chrome-extension://',
    'moz-extension://',
    'edge://',
    'about:',
    'file://',
  ];

  return systemUrls.some((systemUrl) => url.startsWith(systemUrl));
}
