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

function initialiseDefaults() {
  const defaults = {};
}
