chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    const isGoogleDocsTab = changeInfo.url.includes("docs.google.com/document") && /tab=t\.[a-zA-Z0-9]+/.test(changeInfo.url);

    if (isGoogleDocsTab) {
      // In Manifest V2, content scripts are automatically injected
      // based on the content_scripts section in manifest.json
      // No need for programmatic script injection
      console.log('Google Docs tab detected, content script should be active');
      
      // Send a message to the content script to re-initialize
      chrome.tabs.sendMessage(tabId, { action: 'reinitialize' }, (response) => {
        if (chrome.runtime.lastError) {
          // Content script might not be ready yet, that's okay
          console.log('Content script not ready yet:', chrome.runtime.lastError.message);
        } else {
          console.log('Reinitialization message sent successfully');
        }
      });
    }
  }
});