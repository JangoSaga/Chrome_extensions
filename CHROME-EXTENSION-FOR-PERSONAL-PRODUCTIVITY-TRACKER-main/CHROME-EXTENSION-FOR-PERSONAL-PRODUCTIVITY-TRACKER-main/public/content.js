/* eslint-disable no-undef */
let lastActivity = Date.now();
let isPageVisible = !document.hidden;
const DATA_LIMIT = 10000; // 10 seconds

let isExtensionActive = true;
let activityInterval = null;

function sendActivityUpdate() {
  if (!isExtensionActive) return;

  const message = {
    type: "ACTIVITY_UPDATE",
    data: {
      hostname: window.location.hostname,
      title: document.title,
      lastActivity: lastActivity,
      isPageVisible: isPageVisible,
    },
  };

  try {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Message sending failed:", chrome.runtime.lastError);
        if (chrome.runtime.lastError.message.includes("context invalidated")) {
          isExtensionActive = false;
          if (activityInterval) {
            clearInterval(activityInterval);
            activityInterval = null;
          }
          console.log(
            "Extension context invalidated, stopping activity updates"
          );
        }
      } else if (response) {
        console.log("Message sent successfully:", response);
      }
    });
  } catch (error) {
    console.error("Error sending message:", error);
    isExtensionActive = false;
    if (activityInterval) {
      clearInterval(activityInterval);
      activityInterval = null;
    }
  }
}

// Initialize activity monitoring
const startActivityMonitoring = () => {
  isPageVisible = !document.hidden;
  sendActivityUpdate();

  if (!activityInterval) {
    activityInterval = setInterval(() => {
      if (!isExtensionActive) {
        clearInterval(activityInterval);
        activityInterval = null;
        return;
      }
      sendActivityUpdate();
    }, DATA_LIMIT);
  }

  document.addEventListener("visibilitychange", () => {
    isPageVisible = !document.hidden;
    lastActivity = Date.now();
    sendActivityUpdate();
  });

  const activityEvents = ["mousedown", "keydown", "scroll", "touchstart"];
  activityEvents.forEach((eventType) => {
    document.addEventListener(
      eventType,
      () => {
        lastActivity = Date.now();
      },
      { passive: true }
    );
  });
};

const cleanup = () => {
  if (activityInterval) {
    clearInterval(activityInterval);
    activityInterval = null;
  }
  isExtensionActive = false;
};

startActivityMonitoring();
window.addEventListener("beforeunload", cleanup);
