// Define helloTranslations at the very top so it's available everywhere
const helloTranslations = [
  'hello', // en
  'ሰላም', // am
  'مرحبا', // ar
  'Здравей', // bg
  'হ্যালো', // bn
  'Hola', // ca
  'Ahoj', // cs
  'Hej', // da
  'Hallo', // de
  'Γειά', // el
  'Hola', // es
  'Tere', // et
  'سلام', // fa
  'Hei', // fi
  'Kumusta', // fil
  'Bonjour', // fr
  'હેલો', // gu
  'שלום', // he
  'नमस्ते', // hi
  'Bok', // hr
  'Helló', // hu
  'Halo', // id
  'Ciao', // it
  'こんにちは', // ja
  'ಹಲೋ', // kn
  '안녕하세요', // ko
  'Labas', // lt
  'Sveiki', // lv
  'ഹലോ', // ml
  'नमस्कार', // mr
  'Halo', // ms
  'Hallo', // nl
  'Hei', // no
  'Cześć', // pl
  'Olá', // pt_BR
  'Olá', // pt_PT
  'Salut', // ro
  'Привет', // ru
  'Ahoj', // sk
  'Živjo', // sl
  'Здраво', // sr
  'Hej', // sv
  'Hujambo', // sw
  'வணக்கம்', // ta
  'హలో', // te
  'สวัสดี', // th
  'Merhaba', // tr
  'Привіт', // uk
  'Xin chào', // vi
  '你好', // zh_CN
  '你好', // zh_TW
];

let helloIndex = 0;
let typingTimeout = null;
let typingState = { text: '', phase: 'typing', charIndex: 0 };

document.addEventListener('DOMContentLoaded', () => {
  // Get references to elements
  const saveButton = document.getElementById('saveButton');
  const maker = document.getElementById('maker');
  const infoMessage = document.getElementById("infoMessage");
  const redirectContainer = document.getElementById("redirectContainer");
  const optionsContainer = document.getElementById("optionsContainer");

  // Localize button text
  if (document.getElementById('closeUpgradePopup')) {
    document.getElementById('closeUpgradePopup').innerText = chrome.i18n.getMessage("closeButton");
  }

  if (document.getElementById('submitCodeButton')) {
    document.getElementById('submitCodeButton').innerText = chrome.i18n.getMessage("submitButton");
  }

  // Set localized text for static elements
  if (document.getElementById('title')) {
    document.getElementById('title').innerText = chrome.i18n.getMessage("title");
  }
  if (document.getElementById('ThicknessLabel')) {
    document.getElementById('ThicknessLabel').innerText = chrome.i18n.getMessage("ThicknessLabel");
  }
  if (document.getElementById('BlinkLabel')) {
    document.getElementById('BlinkLabel').innerText = chrome.i18n.getMessage("BlinkLabel");
  }
  if (document.getElementById('gradientLabel')) {
    document.getElementById('gradientLabel').innerText = chrome.i18n.getMessage("gradientLabel");
  }
  if (document.getElementById('infoMessageText')) {
    document.getElementById('infoMessageText').innerText = chrome.i18n.getMessage("infoMessage");
  }
  if (document.getElementById('redirectButton')) {
    document.getElementById('redirectButton').innerText = chrome.i18n.getMessage("openDocsButton");
  }
  if (saveButton) {
    saveButton.innerText = chrome.i18n.getMessage("saveButton");
  }
  if (maker) {
    maker.innerText = chrome.i18n.getMessage("maker");
  }
  const trueOption = document.querySelector('#BlinkSelect option[value="true"]');
  const falseOption = document.querySelector('#BlinkSelect option[value="false"]');

  if (trueOption) {
    trueOption.innerText = chrome.i18n.getMessage("falseOption");
  }
  if (falseOption) {
    falseOption.innerText = chrome.i18n.getMessage("trueOption");
  }

  // Load saved settings
  chrome.storage.sync.get(['Thickness', 'Blink', 'gradientStyle'], (result) => {
    // No need to set values here as we're removing the old <select> elements
  });

  // Event listener for "Save" button to close the popup
  saveButton.addEventListener('click', () => {
    window.close();
  });

  // Event listener for "Feedback" button
  maker.addEventListener('click', () => {
    window.open('https://stylish-cursor.framer.website/#donate', '_blank');
  });

  // Check if user is in Google Docs
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentUrl = tabs[0].url;
    const isGoogleDocs = currentUrl.includes("docs.google.com/document");

    if (!isGoogleDocs) {
      // Show message and button if not in Google Docs
      infoMessage.innerHTML = `<p>${chrome.i18n.getMessage("notInDocsMessage")}</p>`;
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

  // Show/hide live preview based on site
  let isGoogleDocs = false;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentUrl = tabs[0].url;
    isGoogleDocs = currentUrl.includes("docs.google.com/document");
    const livePreviewSection = document.getElementById('livePreviewSection');
    if (isGoogleDocs) {
      livePreviewSection.style.display = 'block';
      updateSettingsLivePreview();
    } else {
      livePreviewSection.style.display = 'none';
    }
  });

  // Map of locale codes to helloTranslations index
  const localeToHelloIndex = {
    'en': 0, 'am': 1, 'ar': 2, 'bg': 3, 'bn': 4, 'ca': 5, 'cs': 6, 'da': 7, 'de': 8, 'el': 9, 'es': 10, 'et': 11, 'fa': 12, 'fi': 13, 'fil': 14, 'fr': 15, 'gu': 16, 'he': 17, 'hi': 18, 'hr': 19, 'hu': 20, 'id': 21, 'it': 22, 'ja': 23, 'kn': 24, 'ko': 25, 'lt': 26, 'lv': 27, 'ml': 28, 'mr': 29, 'ms': 30, 'nl': 31, 'no': 32, 'pl': 33, 'pt': 34, 'pt_BR': 34, 'pt_PT': 35, 'ro': 36, 'ru': 37, 'sk': 38, 'sl': 39, 'sr': 40, 'sv': 41, 'sw': 42, 'ta': 43, 'te': 44, 'th': 45, 'tr': 46, 'uk': 47, 'vi': 48, 'zh': 49, 'zh_CN': 49, 'zh_TW': 50
  };

  // On first load, set helloIndex to user's locale
  (function setHelloIndexToLocale() {
    const userLocale = (chrome.i18n.getUILanguage() || '').replace('-', '_');
    if (localeToHelloIndex.hasOwnProperty(userLocale)) {
      helloIndex = localeToHelloIndex[userLocale];
    } else if (localeToHelloIndex.hasOwnProperty(userLocale.split('_')[0])) {
      helloIndex = localeToHelloIndex[userLocale.split('_')[0]];
    } else {
      helloIndex = 0;
    }
  })();

  function getGradientColors(gradientValue) {
    // Match the color arrays from script.js
    const gradientStyles = {
      rainbow: ['#FFB6C1', '#FF69B4', '#DA70D6', '#9370DB', '#48C9B0', '#F0E68C', '#FFD700'],
      red: ['#FF0000', '#B22222', '#8B0000', '#DC143C', '#FF6347'],
      dynamic: ['#e6e6e6', '#333333'],
      snow: ['#00BFFF', '#1E90FF', '#4682B4', '#ADD8E6', '#F0F8FF'],
      ocean: ['#2193B0', '#6DD5ED', '#B2FEFA', '#2F80ED', '#56CCF2'],
      forest: ['#005C1E', '#228B22', '#8FBC8F', '#2E8B57', '#006400'],
      fire: ['#FF4500', '#FF8C00', '#FFD700', '#FFA500', '#FF6347'],
      ice: ['#00FFFF', '#E0FFFF', '#AFEEEE', '#7FFFD4', '#40E0D0'],
      neon: ['#39FF14', '#FF073A', '#FFD700', '#DA22FF', '#7FFF00'],
      gold: ['#FFD700', '#FFB84D', '#FFA500', '#FF8C00', '#DAA520'],
      silver: ['#C0C0C0', '#D3D3D3', '#A9A9A9', '#808080', '#B0C4DE'],
      twilight: ['#FFA07A', '#FA8072', '#E9967A', '#8B4513', '#2E2E2E'],
      tropical: ['#FFD700', '#FF4500', '#FF8C00', '#00FA9A', '#20B2AA'],
      floral: ['#FF69B4', '#FFB6C1', '#FFC0CB', '#FFDAB9', '#FFE4E1'],
      candy: ['#FFC3A0', '#FF85A1', '#FF6D6A', '#FFC1CC', '#FF99A8']
    };
    return gradientStyles[gradientValue] || gradientStyles.rainbow;
  }

  function updateSettingsLivePreview(updateCaretOnly = false) {
    if (!isGoogleDocs) return;
    const thicknessObj = thicknessOptions.find(o => o.value === currentThickness) || thicknessOptions[0];
    const blinkObj = blinkOptions.find(o => o.value === currentBlink) || blinkOptions[0];
    const gradientColors = getGradientColors(currentGradient);
    const gradientCSS = `linear-gradient(-45deg, ${gradientColors.join(', ')})`;
    const previewBox = document.getElementById('settingsLivePreview');
    const livePreviewLabel = chrome.i18n.getMessage('livePreviewLabel') || 'Live Preview';
    previewBox.parentElement.querySelector('#settingsLivePreviewLabel').textContent = livePreviewLabel;

    // Typing animation logic
    const helloText = helloTranslations[helloIndex % helloTranslations.length];
    if (!typingState.text || typingState.text !== helloText) {
      typingState = { text: helloText, phase: 'typing', charIndex: 0 };
    }
    let displayText = helloText.slice(0, typingState.charIndex);
    let caretClass = `live-gradient-bar live-gradient-animated${blinkObj.blink ? ' live-caret-blink' : ''}`;
    let caretStyle = `display:inline-block;vertical-align:bottom;width:${thicknessObj.width}px;height:20px;margin-left:8px;border-radius:3px;background:${gradientCSS};`;

    previewBox.innerHTML = `
      <div class='cursor-dropdown-selected' style='overflow: hidden; display: flex; align-items: center; justify-content: center; gap: 0;'>
        <span style='font-size: 14px; font-family: inherit; color: inherit; user-select: none;'>${displayText}</span>
        <span class='${caretClass}' style='${caretStyle}'></span>
      </div>
    `;

    if (updateCaretOnly) return;
    if (typingTimeout) clearTimeout(typingTimeout);
    if (typingState.phase === 'typing') {
      if (typingState.charIndex < helloText.length) {
        typingTimeout = setTimeout(() => {
          typingState.charIndex++;
          updateSettingsLivePreview();
        }, 120);
      } else {
        typingState.phase = 'pause';
        typingTimeout = setTimeout(() => {
          typingState.phase = 'erasing';
          updateSettingsLivePreview();
        }, 1200);
      }
    } else if (typingState.phase === 'erasing') {
      if (typingState.charIndex > 0) {
        typingTimeout = setTimeout(() => {
          typingState.charIndex--;
          updateSettingsLivePreview();
        }, 60);
      } else {
        typingState.phase = 'typing';
        helloIndex = (helloIndex + 1) % helloTranslations.length;
        typingState.text = helloTranslations[helloIndex % helloTranslations.length];
        typingTimeout = setTimeout(() => {
          updateSettingsLivePreview();
        }, 400);
      }
    }
  }

  document.addEventListener("contextmenu", (e) => e.preventDefault());

  // --- Custom Dropdown for Thickness ---
  const thicknessOptions = [
    { value: '2', label: '2 px', width: 2 },
    { value: '4', label: '4 px', width: 4 },
    { value: '6', label: '6 px', width: 6 },
    { value: '8', label: '8 px', width: 8 }
  ];
  const thicknessDropdownContainer = document.getElementById('thicknessDropdownContainer');
  // Track current selected values for live preview
  let currentThickness = '2';

  function closeAllDropdowns(exceptId) {
    document.querySelectorAll('.cursor-dropdown-list.open').forEach(list => {
      if (!exceptId || list.id !== exceptId) list.classList.remove('open');
    });
    document.querySelectorAll('.cursor-dropdown-selected.open').forEach(sel => {
      if (!exceptId || sel.id !== exceptId.replace('List', 'Selected')) sel.classList.remove('open');
    });
  }

  function renderThicknessDropdown(selectedValue) {
    currentThickness = selectedValue;
    const selected = thicknessOptions.find(o => o.value === selectedValue) || thicknessOptions[0];
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    thicknessDropdownContainer.innerHTML = `
      <div class="cursor-dropdown-selected" id="thicknessDropdownSelected">
        <span class="${isDark ? 'dark-preview-bar' : ''}" style="display:inline-block;vertical-align:middle;margin-right:8px;width:${selected.width}px;height:20px;border-radius:3px;background:#111;"></span>
        <span class="cursor-label">${selected.label}</span>
        <span class="cursor-dropdown-arrow">▼</span>
      </div>
      <div class="cursor-dropdown-list" id="thicknessDropdownList">
        ${thicknessOptions.map(o => `
          <div class="cursor-dropdown-option${o.value === selectedValue ? ' selected' : ''}" data-value="${o.value}">
            <span class="${isDark ? 'dark-preview-bar' : ''}" style="display:inline-block;vertical-align:middle;margin-right:8px;width:${o.width}px;height:20px;border-radius:3px;background:#111;"></span>
            <span class="cursor-label">${o.label}</span>
          </div>
        `).join('')}
      </div>
    `;
    updateSettingsLivePreview(true);
    const selectedDiv = document.getElementById('thicknessDropdownSelected');
    const listDiv = document.getElementById('thicknessDropdownList');
    let docClickHandler;
    selectedDiv.onclick = (e) => {
      e.stopPropagation();
      closeAllDropdowns('thicknessDropdownList');
      listDiv.classList.toggle('open');
      selectedDiv.classList.toggle('open');
      if (listDiv.classList.contains('open')) {
        docClickHandler = function handler(ev) {
          if (!thicknessDropdownContainer.contains(ev.target)) {
            listDiv.classList.remove('open');
            selectedDiv.classList.remove('open');
            document.removeEventListener('click', docClickHandler);
          }
        };
        setTimeout(() => document.addEventListener('click', docClickHandler), 0);
      } else if (docClickHandler) {
        document.removeEventListener('click', docClickHandler);
      }
    };
    Array.from(listDiv.getElementsByClassName('cursor-dropdown-option')).forEach(option => {
      option.onclick = (e) => {
        e.stopPropagation();
        const value = option.getAttribute('data-value');
        chrome.storage.sync.set({ Thickness: value });
        renderThicknessDropdown(value);
      };
    });
  }
  chrome.storage.sync.get(['Thickness'], (result) => {
    renderThicknessDropdown(result.Thickness || '2');
  });

  // --- Custom Dropdown for Blink ---
  const blinkOptions = [
    { value: 'false', label: chrome.i18n.getMessage("trueOption") || 'Yes', blink: true },
    { value: 'true', label: chrome.i18n.getMessage("falseOption") || 'No', blink: false }
  ];
  const blinkDropdownContainer = document.getElementById('blinkDropdownContainer');
  // Track current selected values for live preview
  let currentBlink = 'false';

  function renderBlinkDropdown(selectedValue) {
    currentBlink = selectedValue;
    const selected = blinkOptions.find(o => o.value === selectedValue) || blinkOptions[0];
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const thickness = 4; // fixed thickness for blink preview
    const blinkBar = `<span class="${isDark ? 'dark-preview-bar' : ''}" style="display:inline-block;vertical-align:middle;margin-right:8px;width:${thickness}px;height:20px;border-radius:3px;background:#111;${selected.blink ? 'animation:caret-blink 0.7s steps(1) infinite;' : ''}"></span>`;
    blinkDropdownContainer.innerHTML = `
      <div class="cursor-dropdown-selected" id="blinkDropdownSelected">
        ${blinkBar}
        <span class="cursor-label">${selected.label}</span>
        <span class="cursor-dropdown-arrow">▼</span>
      </div>
      <div class="cursor-dropdown-list" id="blinkDropdownList">
        ${blinkOptions.map(o => `
          <div class="cursor-dropdown-option${o.value === selectedValue ? ' selected' : ''}" data-value="${o.value}">
            <span class="${isDark ? 'dark-preview-bar' : ''}" style="display:inline-block;vertical-align:middle;margin-right:8px;width:${thickness}px;height:20px;border-radius:3px;background:#111;${o.blink ? 'animation:caret-blink 0.7s steps(1) infinite;' : ''}"></span>
            <span class="cursor-label">${o.label}</span>
          </div>
        `).join('')}
      </div>
    `;
    updateSettingsLivePreview(true);
    const selectedDiv = document.getElementById('blinkDropdownSelected');
    const listDiv = document.getElementById('blinkDropdownList');
    let docClickHandler;
    selectedDiv.onclick = (e) => {
      e.stopPropagation();
      closeAllDropdowns('blinkDropdownList');
      listDiv.classList.toggle('open');
      selectedDiv.classList.toggle('open');
      if (listDiv.classList.contains('open')) {
        docClickHandler = function handler(ev) {
          if (!blinkDropdownContainer.contains(ev.target)) {
            listDiv.classList.remove('open');
            selectedDiv.classList.remove('open');
            document.removeEventListener('click', docClickHandler);
          }
        };
        setTimeout(() => document.addEventListener('click', docClickHandler), 0);
      } else if (docClickHandler) {
        document.removeEventListener('click', docClickHandler);
      }
    };
    Array.from(listDiv.getElementsByClassName('cursor-dropdown-option')).forEach(option => {
      option.onclick = (e) => {
        e.stopPropagation();
        const value = option.getAttribute('data-value');
        chrome.storage.sync.set({ Blink: value === 'true' });
        renderBlinkDropdown(value);
      };
    });
  }
  chrome.storage.sync.get(['Blink'], (result) => {
    renderBlinkDropdown(result.Blink !== undefined ? String(result.Blink) : 'false');
  });

  // --- Custom Dropdown for Gradient ---
  const gradientOptions = [
    { value: 'dynamic', label: chrome.i18n.getMessage("gradientDynamic") || 'Dynamic', gradient: 'linear-gradient(180deg, #ff9800, #2196f3)' },
    { value: 'rainbow', label: chrome.i18n.getMessage("gradientRainbow") || 'Rainbow', gradient: 'linear-gradient(180deg, #ff0000, #ff9900, #33cc33, #0066ff, #6600cc, #ff3399)' },
    { value: 'red', label: chrome.i18n.getMessage("gradientRed") || 'Red', gradient: 'linear-gradient(180deg, #ff4b2b, #ff416c)' },
    { value: 'snow', label: chrome.i18n.getMessage("gradientSnow") || 'Snow', gradient: 'linear-gradient(180deg, #e0eafc, #cfdef3)' },
    { value: 'ocean', label: chrome.i18n.getMessage("gradientOcean") || 'Ocean', gradient: 'linear-gradient(180deg, #2193b0, #6dd5ed)' },
    { value: 'forest', label: chrome.i18n.getMessage("gradientForest") || 'Forest', gradient: 'linear-gradient(180deg, #56ab2f, #a8e063)' },
    { value: 'fire', label: chrome.i18n.getMessage("gradientFire") || 'Fire', gradient: 'linear-gradient(180deg, #ff512f, #dd2476)' },
    { value: 'ice', label: chrome.i18n.getMessage("gradientIce") || 'Ice', gradient: 'linear-gradient(180deg, #83a4d4, #b6fbff)' },
    { value: 'neon', label: chrome.i18n.getMessage("gradientNeon") || 'Neon', gradient: 'linear-gradient(180deg, #00f2fe, #4facfe)' },
    { value: 'gold', label: chrome.i18n.getMessage("gradientGold") || 'Gold', gradient: 'linear-gradient(180deg, #ffd700, #ffb700)' },
    { value: 'silver', label: chrome.i18n.getMessage("gradientSilver") || 'Silver', gradient: 'linear-gradient(180deg, #bdc3c7, #e2e2e2)' },
    { value: 'twilight', label: chrome.i18n.getMessage("gradientTwilight") || 'Twilight', gradient: 'linear-gradient(180deg, #0f2027, #2c5364)' },
    { value: 'vintage', label: chrome.i18n.getMessage("gradientVintage") || 'Vintage', gradient: 'linear-gradient(180deg, #eacda3, #d6ae7b)' },
    { value: 'tropical', label: chrome.i18n.getMessage("gradientTropical") || 'Tropical', gradient: 'linear-gradient(180deg, #f7971e, #ffd200, #21d4fd, #b721ff)' },
    { value: 'floral', label: chrome.i18n.getMessage("gradientFloral") || 'Floral', gradient: 'linear-gradient(180deg, #ffdde1, #ee9ca7)' },
    { value: 'candy', label: chrome.i18n.getMessage("gradientCandy") || 'Candy', gradient: 'linear-gradient(180deg, #fcb69f, #ffecd2)' }
  ];
  const gradientDropdownContainer = document.getElementById('gradientDropdownContainer');
  // Track current selected values for live preview
  let currentGradient = 'rainbow';

  function renderGradientDropdown(selectedValue) {
    currentGradient = selectedValue;
    const selected = gradientOptions.find(o => o.value === selectedValue) || gradientOptions[0];
    const getGradientColors = (gradientValue) => {
      const gradientStyles = {
        rainbow: ['#FFB6C1', '#FF69B4', '#DA70D6', '#9370DB', '#48C9B0', '#F0E68C', '#FFD700'],
        red: ['#FF0000', '#B22222', '#8B0000', '#DC143C', '#FF6347'],
        dynamic: ['#e6e6e6', '#333333'],
        snow: ['#00BFFF', '#1E90FF', '#4682B4', '#ADD8E6', '#F0F8FF'],
        ocean: ['#2193B0', '#6DD5ED', '#B2FEFA', '#2F80ED', '#56CCF2'],
        forest: ['#005C1E', '#228B22', '#8FBC8F', '#2E8B57', '#006400'],
        fire: ['#FF4500', '#FF8C00', '#FFD700', '#FFA500', '#FF6347'],
        ice: ['#00FFFF', '#E0FFFF', '#AFEEEE', '#7FFFD4', '#40E0D0'],
        neon: ['#39FF14', '#FF073A', '#FFD700', '#DA22FF', '#7FFF00'],
        gold: ['#FFD700', '#FFB84D', '#FFA500', '#FF8C00', '#DAA520'],
        silver: ['#C0C0C0', '#D3D3D3', '#A9A9A9', '#808080', '#B0C4DE'],
        twilight: ['#FFA07A', '#FA8072', '#E9967A', '#8B4513', '#2E2E2E'],
        tropical: ['#FFD700', '#FF4500', '#FF8C00', '#00FA9A', '#20B2AA'],
        floral: ['#FF69B4', '#FFB6C1', '#FFC0CB', '#FFDAB9', '#FFE4E1'],
        candy: ['#FFC3A0', '#FF85A1', '#FF6D6A', '#FFC1CC', '#FF99A8']
      };
      return gradientStyles[gradientValue] || gradientStyles.rainbow;
    };
    const selectedGradColors = getGradientColors(selected.value);
    const selectedGradCSS = `linear-gradient(-45deg, ${selectedGradColors.join(', ')})`;
    gradientDropdownContainer.innerHTML = `
      <div class="cursor-dropdown-selected" id="gradientDropdownSelected">
        <span style="display:inline-block;vertical-align:middle;margin-right:8px;width:6px;height:20px;border-radius:3px;background:${selectedGradCSS};background-size:400% 400%;animation:gradientAnimation 10s ease infinite;"></span>
        <span class="cursor-label">${selected.label}</span>
        <span class="cursor-dropdown-arrow">▼</span>
      </div>
      <div class="cursor-dropdown-list" id="gradientDropdownList">
        ${gradientOptions.map(o => {
          const gradColors = getGradientColors(o.value);
          const gradCSS = `linear-gradient(-45deg, ${gradColors.join(', ')})`;
          return `
            <div class="cursor-dropdown-option${o.value === selectedValue ? ' selected' : ''}" data-value="${o.value}">
              <span style="display:inline-block;vertical-align:middle;margin-right:8px;width:6px;height:20px;border-radius:3px;background:${gradCSS};background-size:400% 400%;animation:gradientAnimation 10s ease infinite;"></span>
              <span class="cursor-label">${o.label}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
    updateSettingsLivePreview(true);
    const selectedDiv = document.getElementById('gradientDropdownSelected');
    const listDiv = document.getElementById('gradientDropdownList');
    let docClickHandler;
    selectedDiv.onclick = (e) => {
      e.stopPropagation();
      closeAllDropdowns('gradientDropdownList');
      listDiv.classList.toggle('open');
      selectedDiv.classList.toggle('open');
      if (listDiv.classList.contains('open')) {
        docClickHandler = function handler(ev) {
          if (!gradientDropdownContainer.contains(ev.target)) {
            listDiv.classList.remove('open');
            selectedDiv.classList.remove('open');
            document.removeEventListener('click', docClickHandler);
          }
        };
        setTimeout(() => document.addEventListener('click', docClickHandler), 0);
      } else if (docClickHandler) {
        document.removeEventListener('click', docClickHandler);
      }
    };
    Array.from(listDiv.getElementsByClassName('cursor-dropdown-option')).forEach(option => {
      option.onclick = (e) => {
        e.stopPropagation();
        const value = option.getAttribute('data-value');
        chrome.storage.sync.set({ gradientStyle: value });
        renderGradientDropdown(value);
      };
    });
  }
  chrome.storage.sync.get(['gradientStyle'], (result) => {
    renderGradientDropdown(result.gradientStyle || 'rainbow');
  });

});