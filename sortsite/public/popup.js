document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('manageBtn')?.addEventListener('click', () => {
    // eslint-disable-next-line no-undef
    chrome.tabs.create({ url: 'index.html' });
  });
});
