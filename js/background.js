/* Background service worker */
// Listen for install events
chrome.runtime.onInstalled.addListener(() => {
  console.log('HN & Reddit Discussions extension installed');
});

// Add other background logic if needed
