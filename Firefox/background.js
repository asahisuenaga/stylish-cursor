if (typeof browser === "undefined") {
  var browser = chrome;
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    const isGoogleDocsTab = changeInfo.url.includes("docs.google.com/document") && /tab=t\.[a-zA-Z0-9]+/.test(changeInfo.url);

    if (isGoogleDocsTab) {
        browser.tabs.executeScript(tabId, {
        file: 'script.js',
    });
    }
  }
});