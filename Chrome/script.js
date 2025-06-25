// Cache for DOM elements and computed values
const cache = {
    cursorElements: null,
    lastStorageCheck: 0,
    storageCache: {},
    timeTracker: null,
    visibilityHandler: null
};

// Debounced storage operations to reduce CPU usage
function debouncedStorageGet(keys, callback, delay = 100) {
    const cacheKey = Array.isArray(keys) ? keys.join(',') : keys;
    const now = Date.now();
    
    // Return cached result if recent
    if (cache.storageCache[cacheKey] && (now - cache.lastStorageCheck) < delay) {
        callback(cache.storageCache[cacheKey]);
        return;
    }
    
    cache.lastStorageCheck = now;
    chrome.storage.sync.get(keys, (result) => {
        cache.storageCache[cacheKey] = result;
        callback(result);
    });
}

// Function to convert RGB color to an array of values
function rgbToArray(rgb) {
    return rgb.match(/\d+/g).map(Number);
}

// Function to adjust color (lighter or darker)
function adjustColor(color, amount) {
    return `rgb(${color.map(value => Math.min(255, Math.max(0, value + amount))).join(', ')})`;
}

// Function to apply gradient animation based on the current border-color
function applyGradientAnimation(cursor, colorScheme = 'dynamic') {
    const computedStyle = window.getComputedStyle(cursor);
    const borderColor = computedStyle.borderColor || 'rgb(0, 0, 0)';
    const borderColorArray = rgbToArray(borderColor);

    // Define gradient styles
    const gradientStyles = {
        rainbow: ['#FFB6C1', '#FF69B4', '#DA70D6', '#9370DB', '#48C9B0', '#F0E68C', '#FFD700'],
        red: ['#FF0000', '#B22222', '#8B0000', '#DC143C', '#FF6347'],
        dynamic: [
            adjustColor(borderColorArray, 150), // lighter
            adjustColor(borderColorArray, -150) // darker
        ],
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

    // Select the gradient based on the color scheme
    const gradientColors = gradientStyles[colorScheme] || gradientStyles.dynamic;

    // Apply gradient animation
    const styleSheet = document.createElement('style');
    document.head.appendChild(styleSheet);

    const keyframes = `
        @keyframes gradientAnimation {
            0% { background-position: 0% 0%; }
            25% { background-position: 100% 0%; }
            50% { background-position: 100% 100%; }
            75% { background-position: 0% 100%; }
            100% { background-position: 0% 0%; }
        }
    `;
    styleSheet.sheet.insertRule(keyframes, 0);

    cursor.style.borderWidth = "0";
    cursor.style.background = `linear-gradient(-45deg, ${gradientColors.join(', ')})`;
    cursor.style.backgroundSize = "400% 400%";
    cursor.style.animation = "gradientAnimation 10s ease infinite";
}

// Updated monitorColorChange to persist the chosen gradient style
function monitorColorChange(cursor) {
    let lastBorderColor = window.getComputedStyle(cursor).borderColor;

    const observer = new MutationObserver(() => {
        const currentBorderColor = window.getComputedStyle(cursor).borderColor;
        if (currentBorderColor !== lastBorderColor) {
            lastBorderColor = currentBorderColor;
            
            // Retrieve the stored gradient style and reapply it
            debouncedStorageGet(['gradientStyle'], (result) => {
                const gradientStyle = result.gradientStyle || 'rainbow';
                applyGradientAnimation(cursor, gradientStyle);
            });
        }
    });

    observer.observe(cursor, { attributes: true, attributeFilter: ['style'] });
}

// Function to apply blink removal from storage
function applyBlinkRemoval() {
    debouncedStorageGet(['Blink'], (result) => {
        const Blink = result.Blink || false;
        const cursorElements = document.querySelectorAll('.docs-text-ui-cursor-blink, .kix-cursor, .CodeMirror-cursor, .monaco-editor .cursors-layer .cursor');

        if (Blink) {
            cursorElements.forEach(cursor => {
                cursor.style.setProperty('-webkit-animation-iteration-count', '0', 'important');
                cursor.style.setProperty('animation-iteration-count', '0', 'important');
                cursor.style.setProperty('visibility', 'visible', 'important');
            });
        } else {
            cursorElements.forEach(cursor => {
                cursor.style.removeProperty('-webkit-animation-iteration-count');
                cursor.style.removeProperty('animation-iteration-count');
                cursor.style.removeProperty('visibility');
            });
        }
    });
}

// Listen for storage changes and apply new blink removal live
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.Blink) {
        // Clear cache when storage changes
        cache.storageCache = {};
        applyBlinkRemoval();
    }
});

// Function to apply caret width from storage
function applyCaretWidth(cursor) {
    debouncedStorageGet(['Thickness'], (result) => {
        const width = result.Thickness || '2';  // Default to 2 pixels if unset
        cursor.style.width = `${width}px`;
    });
}

// Updated initialize function to retrieve and apply gradient style on load
function initialize() {
    // Cache cursor elements to avoid repeated DOM queries
    if (!cache.cursorElements) {
        cache.cursorElements = document.getElementsByClassName("kix-cursor-caret");
    }
    
    if (cache.cursorElements.length > 0) {
        // Retrieve the stored gradient style and apply it to all cursor elements
        debouncedStorageGet(['gradientStyle'], (result) => {
            const gradientStyle = result.gradientStyle || 'rainbow';
            Array.from(cache.cursorElements).forEach(cursor => {
                applyGradientAnimation(cursor, gradientStyle);
            });
        });

        // Apply caret width from storage
        applyCaretWidth(cache.cursorElements[0]);

        // Monitor for any color changes or mutations in the cursor element
        monitorColorChange(cache.cursorElements[0]);

        // Apply blink removal if needed
        applyBlinkRemoval();

        // Listen for storage changes and apply new settings live
        chrome.storage.onChanged.addListener((changes, area) => {
            if (area === 'sync') {
                // Clear cache when storage changes
                cache.storageCache = {};
                
                if (changes.Thickness) {
                    const newWidth = changes.Thickness.newValue || '2';
                    Array.from(cache.cursorElements).forEach(cursor => {
                        cursor.style.width = `${newWidth}px`;
                    });
                }
                if (changes.Blink) {
                    applyBlinkRemoval();
                }
                if (changes.gradientStyle) {
                    const gradientStyle = changes.gradientStyle.newValue || 'dynamic';
                    Array.from(cache.cursorElements).forEach(cursor => {
                        applyGradientAnimation(cursor, gradientStyle);
                    });
                }
            }
        });

        // Show thank you overlay (only once)
        showThankYouOverlay();

        // Schedule rating overlay (only once, after delay)
        scheduleRatingOverlay();
    } else {
        setTimeout(initialize, 500);     // Retry if cursor element is not found
    }
}

// Start the initialization process
initialize();

function applyCaretStyling() {
  debouncedStorageGet(['Thickness', 'Blink', 'gradientStyle'], (result) => {

    const Thickness = result.Thickness || '2';
    const Blink = result.Blink !== undefined ? result.Blink : false;
    const gradientStyle = result.gradientStyle || 'rainbow';

    // Apply caret width
    document.documentElement.style.setProperty('--caret-width', `${Thickness}px`);

    // Apply remove blink setting
    const caretBlinkStyle = Blink ? 'blink-off-class' : 'blink-on-class';
    document.documentElement.classList.remove('blink-off-class', 'blink-on-class');
    document.documentElement.classList.add(caretBlinkStyle);

    // Apply gradient styling
    const gradientClass = `gradient-${gradientStyle}`;
    document.documentElement.classList.remove(...Array.from(document.documentElement.classList).filter(cls => cls.startsWith('gradient-')));
    document.documentElement.classList.add(gradientClass);
  });
}

// Apply caret styling when the script runs
applyCaretStyling();

// Function to show thank you overlay (only once)
function showThankYouOverlay() {
    // Check if overlay has already been shown
    if (localStorage.getItem('stylishCursorOverlayShown')) {
        return;
    }

    // Create overlay container with minimal styles
    const overlay = document.createElement('div');
    overlay.id = 'stylish-cursor-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 999999;
        font-family: Arial, sans-serif;
    `;

    // Create message container with simplified styles
    const messageContainer = document.createElement('div');
    messageContainer.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 8px;
        text-align: center;
        max-width: 350px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    `;

    // Get localized messages
    const thankYouTitle = chrome.i18n.getMessage('thankYouTitle');
    const thankYouMessage1 = chrome.i18n.getMessage('thankYouMessage1');
    const thankYouMessage2 = chrome.i18n.getMessage('thankYouMessage2');
    const visitGitHubButton = chrome.i18n.getMessage('visitGitHubButton');
    const gotItButton = chrome.i18n.getMessage('gotItButton');

    // Create message content with simplified HTML
    messageContainer.innerHTML = `
        <div style="margin-bottom: 15px;">
            <h2 style="color: #1a73e8; margin: 0 0 10px 0; font-size: 20px; font-weight: 500;">
                ${thankYouTitle}
            </h2>
            <p style="color: #5f6368; margin: 0 0 15px 0; font-size: 14px; line-height: 1.4;">
                ${thankYouMessage1}
            </p>
            <p style="color: #5f6368; margin: 0 0 20px 0; font-size: 14px; line-height: 1.4;">
                ${thankYouMessage2}
            </p>
        </div>
        <div style="display: flex; gap: 10px; justify-content: center;">
            <a href="https://github.com/your-username/stylish-cursor" 
               target="_blank" 
               style="
                   background: #1a73e8;
                   color: white;
                   padding: 10px 20px;
                   border-radius: 4px;
                   text-decoration: none;
                   font-weight: 500;
                   font-size: 14px;
               ">
                ${visitGitHubButton}
            </a>
            <button onclick="dismissThankYouOverlay()"
                    style="
                        background: #f1f3f4;
                        color: #5f6368;
                        padding: 10px 20px;
                        border: none;
                        border-radius: 4px;
                        font-weight: 500;
                        cursor: pointer;
                        font-size: 14px;
                    ">
                ${gotItButton}
            </button>
        </div>
    `;

    // Add message to overlay
    overlay.appendChild(messageContainer);

    // Add overlay to page
    document.body.appendChild(overlay);

    // Close overlay when clicking outside
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            dismissThankYouOverlay();
        }
    });

    // Auto-dismiss after 30 seconds
    setTimeout(dismissThankYouOverlay, 30000);
}

// Function to dismiss thank you overlay
function dismissThankYouOverlay() {
    const overlay = document.getElementById('stylish-cursor-overlay');
    if (overlay) {
        overlay.remove();
        localStorage.setItem('stylishCursorOverlayShown', 'true');
    }
}

// Function to show rating request overlay (only once, after delay)
function showRatingOverlay() {
    // Check if rating overlay has already been shown
    if (localStorage.getItem('stylishCursorRatingShown')) {
        return;
    }

    // Only show if we're currently in Google Docs
    if (!window.location.href.includes('docs.google.com/document')) {
        return;
    }

    // Create overlay container with minimal styles
    const overlay = document.createElement('div');
    overlay.id = 'stylish-cursor-rating-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 999999;
        font-family: Arial, sans-serif;
    `;

    // Create message container with simplified styles
    const messageContainer = document.createElement('div');
    messageContainer.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 8px;
        text-align: center;
        max-width: 350px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    `;

    // Get localized messages
    const ratingTitle = chrome.i18n.getMessage('ratingTitle');
    const ratingMessage1 = chrome.i18n.getMessage('ratingMessage1');
    const ratingMessage2 = chrome.i18n.getMessage('ratingMessage2');
    const rateExtensionButton = chrome.i18n.getMessage('rateExtensionButton');
    const maybeLaterButton = chrome.i18n.getMessage('maybeLaterButton');

    // Create message content with simplified HTML
    messageContainer.innerHTML = `
        <div style="margin-bottom: 15px;">
            <h2 style="color: #1a73e8; margin: 0 0 10px 0; font-size: 20px; font-weight: 500;">
                ${ratingTitle}
            </h2>
            <p style="color: #5f6368; margin: 0 0 15px 0; font-size: 14px; line-height: 1.4;">
                ${ratingMessage1}
            </p>
            <p style="color: #5f6368; margin: 0 0 20px 0; font-size: 14px; line-height: 1.4;">
                ${ratingMessage2}
            </p>
        </div>
        <div style="display: flex; gap: 10px; justify-content: center;">
            <a href="https://chromewebstore.google.com/detail/nnmghknojpihdnofejbocdcnmhibkfdc?utm_source=item-share-cb" 
               target="_blank" 
               style="
                   background: #1a73e8;
                   color: white;
                   padding: 10px 20px;
                   border-radius: 4px;
                   text-decoration: none;
                   font-weight: 500;
                   font-size: 14px;
               ">
                ${rateExtensionButton}
            </a>
            <button onclick="dismissRatingOverlay()"
                    style="
                        background: #f1f3f4;
                        color: #5f6368;
                        padding: 10px 20px;
                        border: none;
                        border-radius: 4px;
                        font-weight: 500;
                        cursor: pointer;
                        font-size: 14px;
                    ">
                ${maybeLaterButton}
            </button>
        </div>
    `;

    // Add message to overlay
    overlay.appendChild(messageContainer);

    // Add overlay to page
    document.body.appendChild(overlay);

    // Close overlay when clicking outside
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            dismissRatingOverlay();
        }
    });

    // Auto-dismiss after 30 seconds
    setTimeout(dismissRatingOverlay, 30000);
}

// Function to dismiss rating overlay
function dismissRatingOverlay() {
    const overlay = document.getElementById('stylish-cursor-rating-overlay');
    if (overlay) {
        overlay.remove();
        localStorage.setItem('stylishCursorRatingShown', 'true');
    }
}

// Function to track time spent in Google Docs and schedule rating overlay
function scheduleRatingOverlay() {
    // Check if rating overlay has already been shown
    if (localStorage.getItem('stylishCursorRatingShown')) {
        return;
    }

    // Get current time spent in Google Docs
    let timeSpent = parseInt(localStorage.getItem('stylishCursorTimeSpent') || '0');
    
    // Clear any existing timer
    if (cache.timeTracker) {
        clearInterval(cache.timeTracker);
    }
    
    // Update time spent every minute
    cache.timeTracker = setInterval(() => {
        // Only track time if we're still in Google Docs
        if (window.location.href.includes('docs.google.com/document')) {
            timeSpent += 60000; // Add 1 minute (60,000 ms)
            localStorage.setItem('stylishCursorTimeSpent', timeSpent.toString());
            
            // Check if we've reached 5 minutes (300,000 ms)
            if (timeSpent >= 300000) {
                clearInterval(cache.timeTracker);
                cache.timeTracker = null;
                showRatingOverlay();
            }
        } else {
            // If we're not in Google Docs, pause tracking
            clearInterval(cache.timeTracker);
            cache.timeTracker = null;
        }
    }, 60000); // Check every minute

    // Remove existing visibility handler to prevent duplicates
    if (cache.visibilityHandler) {
        document.removeEventListener('visibilitychange', cache.visibilityHandler);
    }
    
    // Also check when the page becomes visible again (user returns to tab)
    cache.visibilityHandler = () => {
        if (document.visibilityState === 'visible' && 
            window.location.href.includes('docs.google.com/document')) {
            // Resume tracking when user returns to Google Docs
            scheduleRatingOverlay();
        }
    };
    
    document.addEventListener('visibilitychange', cache.visibilityHandler);
}