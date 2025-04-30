chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    const isGoogleDocsTab = changeInfo.url.includes("docs.google.com/document") && /tab=t\.[a-zA-Z0-9]+/.test(changeInfo.url);

    if (isGoogleDocsTab) {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['script.js'],
      });
    }
  }
});