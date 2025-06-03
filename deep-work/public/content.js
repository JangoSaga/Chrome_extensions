// Content script runs in the context of web pages
let lastActivity = Date.now();
let isPageVisible = true;

// Track user activity on the page
document.addEventListener("mousemove", updateActivity);
document.addEventListener("keydown", updateActivity);
document.addEventListener("scroll", updateActivity);
document.addEventListener("click", updateActivity);

// Track page visibility
document.addEventListener("visibilitychange", () => {
  isPageVisible = !document.hidden;
  sendActivityUpdate();
});

// Update last activity timestamp
function updateActivity() {
  lastActivity = Date.now();
  sendActivityUpdate();
}

// Send activity data to background script
let screenTime = 0;
function sendActivityUpdate() {
  if (isPageVisible && Date.now() - lastActivity < 5 * 60 * 1000) {
    screenTime += 30000; // Increment by 30 seconds
  }

  chrome.runtime.sendMessage({
    type: "ACTIVITY_UPDATE",
    data: {
      url: window.location.href,
      hostname: window.location.hostname,
      title: document.title,
      lastActivity: lastActivity,
      isActive: isPageVisible && Date.now() - lastActivity < 5 * 60 * 1000,
      timestamp: Date.now(),
      screenTime,
    },
  });
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_PAGE_INFO") {
    sendResponse({
      url: window.location.href,
      hostname: window.location.hostname,
      title: document.title,
      isActive: isPageVisible && Date.now() - lastActivity < 5 * 60 * 1000,
    });
  }
  return true;
});

// Initial activity report on page load
sendActivityUpdate();

// Send periodic updates
setInterval(sendActivityUpdate, 30000);

// Track time spent in specific page sections (optional)
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        chrome.runtime.sendMessage({
          type: "SECTION_VIEW",
          data: {
            section: entry.target.dataset.section,
            url: window.location.href,
            timestamp: Date.now(),
          },
        });
      }
    });
  },
  { threshold: 0.5 }
);

// Observe sections with data-section attribute
document.querySelectorAll("[data-section]").forEach((section) => {
  observer.observe(section);
});

// Handle cleanup when possible
window.addEventListener("beforeunload", () => {
  chrome.runtime.sendMessage({
    type: "PAGE_UNLOAD",
    data: {
      url: window.location.href,
      timestamp: Date.now(),
    },
  });
});

// Error handling
const handleError = (error) => {
  console.error("Content Script Error:", error);
  chrome.runtime.sendMessage({
    type: "ERROR",
    data: {
      message: error.message,
      stack: error.stack,
      url: window.location.href,
    },
  });
};

window.addEventListener("error", handleError);
