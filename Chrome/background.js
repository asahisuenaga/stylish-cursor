// Background script - simplified to avoid duplicate script injection
// The content script in manifest.json handles all the functionality
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // This listener is kept for potential future use but doesn't inject scripts
  // to avoid conflicts with the content script defined in manifest.json

  if (changeInfo.url) {
    const isGoogleDocsTab = changeInfo.url.includes("docs.google.com/document") && /tab=t\.[a-zA-Z0-9]+/.test(changeInfo.url);

    if (isGoogleDocsTab) {
      // Inject a script to reapply caret styling when tab switches
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
          // Dispatch a custom event to notify the content script about tab switch
          window.dispatchEvent(new CustomEvent('googleDocsTabSwitch', {
            detail: { url: window.location.href }
          }));
        }
      });
    }
  }
});