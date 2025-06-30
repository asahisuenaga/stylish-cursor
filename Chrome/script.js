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
        vintage: ['#eacda3', '#d6ae7b'],
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
    // Only get the current user's caret by id
    const currentUserCaret = document.getElementById('kix-current-user-cursor-caret');
    cache.cursorElements = currentUserCaret ? [currentUserCaret] : [];

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

// Listen for Google Docs tab switches
window.addEventListener('googleDocsTabSwitch', (event) => {
    console.log('Google Docs tab switch detected:', event.detail.url);
    // Clear cache and reinitialize after a short delay to allow DOM to update
    cache.cursorElements = null;
    cache.storageCache = {};
    setTimeout(() => {
        initialize();
    }, 100);
});

// Also listen for URL changes within the same page (for tab switches)
let lastUrl = window.location.href;
const urlObserver = new MutationObserver(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl && currentUrl.includes('docs.google.com/document')) {
        lastUrl = currentUrl;
        console.log('URL change detected in Google Docs:', currentUrl);
        // Clear cache and reinitialize after a short delay
        cache.cursorElements = null;
        cache.storageCache = {};
        setTimeout(() => {
            initialize();
        }, 100);
    }
});

// Start observing URL changes
urlObserver.observe(document, { subtree: true, childList: true });

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

// Apply caret styling when the script runs
applyCaretStyling();

// Overlay utility for thank you and rating overlays
function createOverlay({ id, title, message1, message2, actions }) {
    // Remove any existing overlay with the same id
    const old = document.getElementById(id);
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = id;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.tabIndex = -1;
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center;
        z-index: 2147483647; font-family: 'Inter', sans-serif;
    `;

    // Inject popup CSS for consistent styling
    if (!document.getElementById('stylish-cursor-popup-css')) {
        const style = document.createElement('style');
        style.id = 'stylish-cursor-popup-css';
        style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
        .stylish-cursor-overlay-box {
            background: linear-gradient(145deg, #f0f2f5, #ffffff);
            color: #333;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.18);
            max-width: 350px;
            width: 90vw;
            padding: 32px 24px;
            text-align: center;
            position: relative;
            font-family: 'Inter', sans-serif;
        }
        .stylish-cursor-overlay-box h2 {
            margin: 0 0 12px 0;
            font-size: 14px;
            font-weight: 600;
            color: #333;
        }
        .stylish-cursor-overlay-box p {
            margin: 0 0 12px 0;
            font-size: 14px;
            color: #333;
        }
        .stylish-cursor-overlay-actions {
            display: flex;
            gap: 10px;
            justify-content: center;
            margin-top: 10px;
        }
        .stylish-cursor-overlay-box button, .stylish-cursor-overlay-box a {
            appearance: none;
            background: linear-gradient(145deg, #e8e8e8, #ffffff);
            border: 1px solid #d0d0d0;
            padding: 10px 18px;
            border-radius: 12px;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            color: #333;
            cursor: pointer;
            font-weight: 500;
            text-decoration: none;
            box-shadow: inset 1px 1px 3px rgba(255,255,255,0.6),
                        inset -1px -1px 3px rgba(0,0,0,0.05);
            transition: all 0.3s ease;
        }
        .stylish-cursor-overlay-box button.primary, .stylish-cursor-overlay-box a.primary {
            background: linear-gradient(to top, #4A90E2, #6AB0F3);
            color: #fff;
            border: none;
        }
        .stylish-cursor-overlay-box button:hover, .stylish-cursor-overlay-box a:hover {
            background: #f7f7f7;
            filter: brightness(1.05);
        }
        .stylish-cursor-overlay-box button.primary:hover, .stylish-cursor-overlay-box a.primary:hover {
            box-shadow: 0 0 8px rgba(74, 144, 226, 0.4);
            background: linear-gradient(to top, #4285F4, #5f9df7);
        }
        @media (prefers-color-scheme: dark) {
            .stylish-cursor-overlay-box {
                background: linear-gradient(145deg, #1b1b1b, #232323);
                color: #f5f5f5;
            }
            .stylish-cursor-overlay-box h2, .stylish-cursor-overlay-box p {
                color: #f5f5f5;
            }
            .stylish-cursor-overlay-box button, .stylish-cursor-overlay-box a {
                background: linear-gradient(145deg, #2c2c2c, #1a1a1a);
                border: 1px solid #444;
                color: #f5f5f5;
            }
            .stylish-cursor-overlay-box button.primary, .stylish-cursor-overlay-box a.primary {
                background: linear-gradient(to top, #4285F4, #5f9df7);
                color: #fff;
            }
        }
        `;
        document.head.appendChild(style);
    }

    const box = document.createElement('div');
    box.className = 'stylish-cursor-overlay-box';
    box.innerHTML = `
        <h2>${title}</h2>
        <p>${message1}</p>
        <p>${message2 || ''}</p>
    `;

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'stylish-cursor-overlay-actions';
    actions.forEach(({ label, onClick, href, primary }) => {
        const btn = href
            ? document.createElement('a')
            : document.createElement('button');
        btn.textContent = label;
        btn.className = primary ? 'primary' : '';
        if (href) {
            btn.href = href;
            btn.target = '_blank';
            btn.rel = 'noopener noreferrer';
        } else {
            btn.onclick = onClick;
        }
        actionsDiv.appendChild(btn);
    });
    box.appendChild(actionsDiv);
    overlay.appendChild(box);

    // Focus trap and ESC to close
    overlay.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            overlay.remove();
        }
    });
    setTimeout(() => overlay.focus(), 0);

    document.body.appendChild(overlay);
}

function showThankYouOverlay() {
    if (localStorage.getItem('stylishCursorOverlayShown')) return;
    createOverlay({
        id: 'stylish-cursor-overlay',
        title: chrome.i18n.getMessage('thankYouTitle'),
        message1: chrome.i18n.getMessage('thankYouMessage1'),
        message2: chrome.i18n.getMessage('thankYouMessage2'),
        actions: [
            {
                label: chrome.i18n.getMessage('visitGitHubButton'),
                href: 'https://github.com/asahisuenaga/stylish-cursor',
                primary: true
            },
            {
                label: chrome.i18n.getMessage('gotItButton'),
                onClick: () => {
                    localStorage.setItem('stylishCursorOverlayShown', 'true');
                    document.getElementById('stylish-cursor-overlay').remove();
                }
            }
        ]
    });
}

function showRatingOverlay() {
    if (localStorage.getItem('stylishCursorRatingShown')) return;
    if (!window.location.href.includes('docs.google.com/document')) return;
    createOverlay({
        id: 'stylish-cursor-rating-overlay',
        title: chrome.i18n.getMessage('ratingTitle'),
        message1: chrome.i18n.getMessage('ratingMessage1'),
        message2: chrome.i18n.getMessage('ratingMessage2'),
        actions: [
            {
                label: chrome.i18n.getMessage('rateExtensionButton'),
                href: 'https://chromewebstore.google.com/detail/nnmghknojpihdnofejbocdcnmhibkfdc?utm_source=item-share-cb',
                primary: true
            },
            {
                label: chrome.i18n.getMessage('maybeLaterButton'),
                onClick: () => {
                    localStorage.setItem('stylishCursorRatingShown', 'true');
                    document.getElementById('stylish-cursor-rating-overlay').remove();
                }
            }
        ]
    });
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