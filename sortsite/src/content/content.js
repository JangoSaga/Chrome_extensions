/* eslint-disable no-undef */
// Content script for SiteSort Pro Chrome Extension

// Initialize content script
(function () {
  'use strict';

  let currentWebsite = null;
  let notificationElement = null;

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script received message:', request);

    switch (request.action) {
      case 'websiteTracked':
        handleWebsiteTracked(request.website);
        break;

      case 'getCategoryInfo':
        handleGetCategoryInfo(sendResponse);
        return true;

      case 'showCategoryBadge':
        showCategoryBadge(request.category);
        break;

      case 'hideCategoryBadge':
        hideCategoryBadge();
        break;

      default:
        console.warn('Unknown action in content script:', request.action);
    }
  });

  // Initialize when page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  function initialize() {
    console.log('SiteSort Pro content script initialized');

    // Get current website info from background
    getCurrentWebsiteInfo();

    // Add keyboard shortcuts
    addKeyboardShortcuts();

    // Monitor for dynamic content changes (for SPAs)
    observePageChanges();
  }

  function getCurrentWebsiteInfo() {
    chrome.runtime.sendMessage(
      {
        action: 'getCurrentDomain',
      },
      (response) => {
        if (response && response.success && response.website) {
          currentWebsite = response.website;
          showCategoryIndicator(response.website);
        }
      }
    );
  }

  function handleWebsiteTracked(website) {
    currentWebsite = website;
    updateCategoryIndicator(website);

    // Show a subtle notification that the visit was tracked
    showVisitNotification(website);
  }

  function handleGetCategoryInfo(sendResponse) {
    if (currentWebsite) {
      sendResponse({
        success: true,
        website: currentWebsite,
      });
    } else {
      sendResponse({
        success: false,
        message: 'No category information available',
      });
    }
  }

  function showCategoryIndicator(website) {
    // Remove existing indicator
    removeCategoryIndicator();

    // Create category indicator
    const indicator = createCategoryIndicator(website);
    document.body.appendChild(indicator);

    // Auto-hide after 3 seconds
    setTimeout(() => {
      if (indicator && indicator.parentNode) {
        indicator.style.opacity = '0';
        setTimeout(() => {
          removeCategoryIndicator();
        }, 300);
      }
    }, 3000);
  }

  function updateCategoryIndicator(website) {
    const existingIndicator = document.getElementById(
      'sitesort-category-indicator'
    );
    if (existingIndicator) {
      const categorySpan = existingIndicator.querySelector('.category-name');
      const visitSpan = existingIndicator.querySelector('.visit-count');

      if (categorySpan) {
        categorySpan.textContent = website.category;
      }

      if (visitSpan) {
        visitSpan.textContent = `${website.visits} visits`;
      }
    } else {
      showCategoryIndicator(website);
    }
  }

  function createCategoryIndicator(website) {
    const indicator = document.createElement('div');
    indicator.id = 'sitesort-category-indicator';
    indicator.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px 16px;
        border-radius: 25px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        font-weight: 500;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        z-index: 2147483647;
        transition: all 0.3s ease;
        cursor: pointer;
        user-select: none;
      " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="
            width: 8px;
            height: 8px;
            background: #4ade80;
            border-radius: 50%;
            animation: pulse 2s infinite;
          "></div>
          <span class="category-name">${website.category}</span>
          <span style="opacity: 0.7; font-size: 11px;" class="visit-count">${website.visits} visits</span>
        </div>
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      </style>
    `;

    // Add click handler to show more info
    indicator.addEventListener('click', () => {
      showWebsiteDetails(website);
    });

    return indicator;
  }

  function removeCategoryIndicator() {
    const existing = document.getElementById('sitesort-category-indicator');
    if (existing) {
      existing.remove();
    }
  }

  function showVisitNotification(website) {
    // Remove existing notification
    removeVisitNotification();

    const notification = document.createElement('div');
    notification.id = 'sitesort-visit-notification';
    notification.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 12px;
        z-index: 2147483647;
        transition: all 0.3s ease;
        opacity: 0;
        transform: translateY(20px);
      ">
        Visit tracked in ${website.category}
      </div>
    `;

    document.body.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
      const div = notification.querySelector('div');
      div.style.opacity = '1';
      div.style.transform = 'translateY(0)';
    });

    // Auto-remove after 2 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        const div = notification.querySelector('div');
        div.style.opacity = '0';
        div.style.transform = 'translateY(20px)';
        setTimeout(() => {
          removeVisitNotification();
        }, 300);
      }
    }, 2000);
  }

  function removeVisitNotification() {
    const existing = document.getElementById('sitesort-visit-notification');
    if (existing) {
      existing.remove();
    }
  }

  function showWebsiteDetails(website) {
    const modal = document.createElement('div');
    modal.id = 'sitesort-details-modal';
    modal.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2147483647;
        backdrop-filter: blur(4px);
      " onclick="this.remove()">
        <div style="
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
          max-width: 400px;
          width: 90%;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        " onclick="event.stopPropagation()">
          <h3 style="margin: 0 0 16px 0; color: #333; font-size: 18px; font-weight: 600;">
            ${website.domain}
          </h3>
          <div style="margin-bottom: 12px;">
            <span style="
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 4px 12px;
              border-radius: 16px;
              font-size: 12px;
              font-weight: 500;
            ">${website.category}</span>
          </div>
          <p style="color: #666; font-size: 14px; line-height: 1.5; margin: 12px 0;">
            ${website.description || 'No description available'}
          </p>
          <div style="display: flex; justify-content: space-between; font-size: 12px; color: #888; margin-top: 16px;">
            <span>Visits: ${website.visits}</span>
            <span>Added: ${new Date(
              website.dateAdded
            ).toLocaleDateString()}</span>
          </div>
          <button style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
            margin-top: 16px;
            width: 100%;
          " onclick="this.closest('#sitesort-details-modal').remove()">
            Close
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  function addKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + Shift + S: Show category info
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        if (currentWebsite) {
          showWebsiteDetails(currentWebsite);
        } else {
          showNoDataMessage();
        }
      }

      // Ctrl/Cmd + Shift + C: Quick categorize current site
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        showQuickCategorizeModal();
      }
    });
  }

  function showNoDataMessage() {
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        z-index: 2147483647;
        text-align: center;
      ">
        This website is not categorized yet.<br>
        <small style="opacity: 0.7;">Use the extension popup to add it.</small>
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  function showQuickCategorizeModal() {
    // Get current domain
    const domain = window.location.hostname.replace('www.', '');

    const modal = document.createElement('div');
    modal.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2147483647;
        backdrop-filter: blur(4px);
      " onclick="this.remove()">
        <div style="
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
          max-width: 400px;
          width: 90%;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        " onclick="event.stopPropagation()">
          <h3 style="margin: 0 0 16px 0; color: #333; font-size: 18px; font-weight: 600;">
            Quick Categorize: ${domain}
          </h3>
          <p style="color: #666; font-size: 14px; margin-bottom: 16px;">
            Use the extension popup to categorize this website properly.
          </p>
          <button style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
            width: 100%;
          " onclick="this.closest('div').remove()">
            Got it
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  function observePageChanges() {
    let lastUrl = window.location.href;

    // Observer for URL changes in SPAs
    const observer = new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        // Delay to ensure page has loaded
        setTimeout(() => {
          getCurrentWebsiteInfo();
        }, 1000);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Also listen for popstate events
    window.addEventListener('popstate', () => {
      setTimeout(() => {
        getCurrentWebsiteInfo();
      }, 500);
    });
  }

  function showCategoryBadge(category) {
    removeCategoryBadge();

    const badge = document.createElement('div');
    badge.id = 'sitesort-category-badge';
    badge.innerHTML = `
      <div style="
        position: fixed;
        top: 10px;
        left: 10px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 6px 12px;
        border-radius: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 11px;
        font-weight: 500;
        z-index: 2147483647;
        opacity: 0.8;
      ">
        ${category}
      </div>
    `;

    document.body.appendChild(badge);
  }

  function hideCategoryBadge() {
    removeCategoryBadge();
  }

  function removeCategoryBadge() {
    const existing = document.getElementById('sitesort-category-badge');
    if (existing) {
      existing.remove();
    }
  }
})();
