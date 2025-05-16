if (typeof browser === "undefined") {
  var browser = browser;
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
            browser.storage.sync.get(['gradientStyle'], (result) => {
                const gradientStyle = result.gradientStyle || 'dynamic';
                applyGradientAnimation(cursor, gradientStyle);
            });
        }
    });

    observer.observe(cursor, { attributes: true, attributeFilter: ['style'] });
}

// Function to apply blink removal from storage
function applyBlinkRemoval() {
    browser.storage.sync.get(['removeBlink'], (result) => {
        const removeBlink = result.removeBlink || false;
        const cursorElements = document.querySelectorAll('.docs-text-ui-cursor-blink, .kix-cursor, .CodeMirror-cursor, .monaco-editor .cursors-layer .cursor');

        if (removeBlink) {
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
browser.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes.removeBlink) {
        applyBlinkRemoval();
    }
});

// Function to apply caret width from storage
function applyCaretWidth(cursor) {
    browser.storage.sync.get(['caretWidth'], (result) => {
        const width = result.caretWidth || '2';  // Default to 2 pixels if unset
        cursor.style.width = `${width}px`;
    });
}

// Updated initialize function to retrieve and apply gradient style on load
function initialize() {
    const cursorElements = document.getElementsByClassName("kix-cursor-caret");
    if (cursorElements.length > 0) {
        // Retrieve the stored gradient style and apply it to all cursor elements
        browser.storage.sync.get(['gradientStyle'], (result) => {
            const gradientStyle = result.gradientStyle || 'dynamic';
            Array.from(cursorElements).forEach(cursor => {
                applyGradientAnimation(cursor, gradientStyle);
            });
        });

        // Apply caret width from storage
        applyCaretWidth(cursorElements[0]);

        // Monitor for any color changes or mutations in the cursor element
        monitorColorChange(cursorElements[0]);

        // Apply blink removal if needed
        applyBlinkRemoval();

        // Listen for storage changes and apply new settings live
        browser.storage.onChanged.addListener((changes, area) => {
            if (area === 'sync') {
                if (changes.caretWidth) {
                    const newWidth = changes.caretWidth.newValue || '2';
                    Array.from(cursorElements).forEach(cursor => {
                        cursor.style.width = `${newWidth}px`;
                    });
                }
                if (changes.removeBlink) {
                    applyBlinkRemoval();
                }
                if (changes.gradientStyle) {
                    const gradientStyle = changes.gradientStyle.newValue || 'dynamic';
                    Array.from(cursorElements).forEach(cursor => {
                        applyGradientAnimation(cursor, gradientStyle);
                    });
                }
            }
        });
    } else {
        setTimeout(initialize, 500);     // Retry if cursor element is not found
    }
}

// Start the initialization process
initialize();

function applyCaretStyling() {
  browser.storage.sync.get(['caretWidth', 'removeBlink', 'gradientStyle'], (result) => {

    const caretWidth = result.caretWidth || '2';
    const removeBlink = result.removeBlink !== undefined ? result.removeBlink : false;
    const gradientStyle = result.gradientStyle || 'dynamic';

    // Apply caret width
    document.documentElement.style.setProperty('--caret-width', `${caretWidth}px`);

    // Apply remove blink setting
    const caretBlinkStyle = removeBlink ? 'blink-off-class' : 'blink-on-class';
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