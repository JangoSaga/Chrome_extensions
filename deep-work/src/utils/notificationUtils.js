export const NotificationUtils = {
  // Show goal completion notification
  async showGoalNotification(goalName) {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.png",
      title: "Goal Completed! 🎉",
      message: `Congratulations! You've completed your goal: ${goalName}`,
    });
  },

  // Show focus mode warning
  async showFocusWarning(site) {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.png",
      title: "Focus Mode Active",
      message: `You're trying to access ${site} during focus hours.`,
      buttons: [{ title: "Close Tab" }, { title: "Continue Anyway" }],
    });
  },

  // Show productivity summary
  async showDailySummary(stats) {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.png",
      title: "Daily Productivity Summary",
      message: `Productive time: ${stats.productiveHours}hrs\nDistracting time: ${stats.distractingHours}hrs`,
    });
  },
};
