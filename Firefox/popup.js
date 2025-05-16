if (typeof browser === "undefined") {
  var browser = chrome;
}

document.addEventListener('DOMContentLoaded', () => {
  // Get references to elements
  const caretWidthSelect = document.getElementById('caretWidth');
  const removeBlinkSelect = document.getElementById('removeBlinkSelect');
  const gradientStyleSelect = document.getElementById('gradientStyle');
  const saveButton = document.getElementById('saveButton');
  const maker = document.getElementById('maker');
  const infoMessage = document.getElementById("infoMessage");
  const redirectContainer = document.getElementById("redirectContainer");
  const optionsContainer = document.getElementById("optionsContainer");

  // Localize button text
  if (document.getElementById('closeUpgradePopup')) {
    document.getElementById('closeUpgradePopup').innerText = browser.i18n.getMessage("closeButton");
  }

  if (document.getElementById('submitCodeButton')) {
    document.getElementById('submitCodeButton').innerText = browser.i18n.getMessage("submitButton");
  }

  // Set localized text for static elements
  if (document.getElementById('title')) {
    document.getElementById('title').innerText = browser.i18n.getMessage("title");
  }
  if (document.getElementById('caretWidthLabel')) {
    document.getElementById('caretWidthLabel').innerText = browser.i18n.getMessage("caretWidthLabel");
  }
  if (document.getElementById('removeBlinkLabel')) {
    document.getElementById('removeBlinkLabel').innerText = browser.i18n.getMessage("removeBlinkLabel");
  }
  if (document.getElementById('gradientLabel')) {
    document.getElementById('gradientLabel').innerText = browser.i18n.getMessage("gradientLabel");
  }
  if (document.getElementById('infoMessageText')) {
    document.getElementById('infoMessageText').innerText = browser.i18n.getMessage("infoMessage");
  }
  if (document.getElementById('redirectButton')) {
    document.getElementById('redirectButton').innerText = browser.i18n.getMessage("openDocsButton");
  }
  if (saveButton) {
    saveButton.innerText = browser.i18n.getMessage("saveButton");
  }
  if (maker) {
    maker.innerText = browser.i18n.getMessage("maker");
  }
  const trueOption = document.querySelector('#removeBlinkSelect option[value="true"]');
  const falseOption = document.querySelector('#removeBlinkSelect option[value="false"]');

  if (trueOption) {
    trueOption.innerText = browser.i18n.getMessage("falseOption");
  }
  if (falseOption) {
    falseOption.innerText = browser.i18n.getMessage("trueOption");
  }

  // Set localized text for gradient options
  const gradientOptions = gradientStyleSelect ? gradientStyleSelect.querySelectorAll('option') : [];
  gradientOptions.forEach(option => {
    const i18nKey = option.getAttribute('data-i18n');
    if (i18nKey) {
      option.innerText = browser.i18n.getMessage(i18nKey);
    }
  });

  // Load saved settings
  browser.storage.sync.get(['caretWidth', 'removeBlink', 'gradientStyle'], (result) => {
    caretWidthSelect.value = result.caretWidth || '2';
    removeBlinkSelect.value = result.removeBlink !== undefined ? String(result.removeBlink) : 'false';
    gradientStyleSelect.value = result.gradientStyle || 'dynamic'; // Load gradient style
  });

  // Event listeners to save settings when changed
  caretWidthSelect.addEventListener('change', (event) => {
    const width = event.target.value;
    browser.storage.sync.set({ caretWidth: width });
  });

  removeBlinkSelect.addEventListener('change', (event) => {
    const shouldRemoveBlink = event.target.value === 'true';
    browser.storage.sync.set({ removeBlink: shouldRemoveBlink });
  });

  gradientStyleSelect.addEventListener('change', (event) => {
    const style = event.target.value;
    browser.storage.sync.set({ gradientStyle: style });
  });

  // Event listener for "Save" button to close the popup
  saveButton.addEventListener('click', () => {
    window.close();
  });

  // Event listener for "Feedback" button
  maker.addEventListener('click', () => {
    window.open('https://asahi.fyi/', '_blank');
  });

  // Check if user is in Google Docs
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    const currentUrl = tabs[0].url;
    const isGoogleDocs = currentUrl.includes("docs.google.com/document");

    if (!isGoogleDocs) {
      // Show message and button if not in Google Docs
      infoMessage.innerHTML = `<p>${browser.i18n.getMessage("notInDocsMessage")}</p>`;
      redirectContainer.style.display = 'block';
      optionsContainer.style.display = 'none';
      saveButton.style.display = 'none';
      
      // Event listener for "Open Google Docs" button
      document.getElementById('redirectButton').addEventListener('click', () => {
        window.open('https://docs.google.com/document', '_blank');
      });
    } else {
      // Hide redirect message if in Google Docs
      redirectContainer.style.display = 'none';
    }
  });


// Injected code for monitoring tab changes and reloading caret styles
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && changeInfo.url.includes("docs.google.com/document")) {
    browser.tabs.executeScript({
      file: "script.js"
    });
  }
});

document.addEventListener("contextmenu", (e) => e.preventDefault());

});