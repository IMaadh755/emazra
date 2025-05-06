import { db } from "./admin-app.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.0.2/firebase-firestore.js";

const defaultTheme = {
    textColor: '#f8fafc',
    subTextColor: '#94a3b8',
    tableHeadingColor: '#7c3aed',
    tableColor: '#1e293b',
    buttonColor: '#7c3aed',
    backgroundColor: '#0f172a',
    sidePanelColor: '#1e293b',
    fontFamily: "'Poppins', sans-serif"
};

// Initialize theme
export async function initTheme() {
    const theme = await loadTheme();
    applyTheme(theme);
    setupThemeListeners();
    updateInputValues(theme);
}

async function loadTheme() {
    try {
        const docRef = doc(db, "settings", "theme");
        const docSnap = await getDoc(docRef);
        return { ...defaultTheme, ...(docSnap.exists() ? docSnap.data() : {}) };
    } catch (error) {
        console.error("Error loading theme:", error);
        return defaultTheme;
    }
}

async function saveTheme(theme) {
    try {
        await setDoc(doc(db, "settings", "theme"), theme);
        showToast('Theme saved successfully!');
    } catch (error) {
        console.error("Error saving theme:", error);
        showToast('Error saving theme', true);
    }
}

function applyTheme(theme) {
    console.log('Applying theme font:', theme.fontFamily);
    const root = document.documentElement;
    root.style.setProperty('--text-primary', theme.textColor);
    root.style.setProperty('--text-secondary', theme.subTextColor);
    root.style.setProperty('--bg-primary', theme.backgroundColor);
    root.style.setProperty('--bg-secondary', theme.sidePanelColor);
    root.style.setProperty('--accent-primary', theme.buttonColor);
    root.style.setProperty('--table-heading', theme.tableHeadingColor);
    root.style.setProperty('--table-color', theme.tableColor);
    document.body.style.fontFamily = theme.fontFamily;

    document.body.style.fontFamily = theme.fontFamily;
    document.querySelectorAll('.font-sample').forEach(el => {
        el.style.fontFamily = theme.fontFamily;
    });
    
    // Update live preview
    updateLivePreview(theme);
}

function updateInputValues(theme) {
    document.getElementById('textColor').value = theme.textColor;
    document.getElementById('subTextColor').value = theme.subTextColor;
    document.getElementById('buttonColor').value = theme.buttonColor;
    document.getElementById('backgroundColor').value = theme.backgroundColor;
    document.getElementById('sidePanelColor').value = theme.sidePanelColor;
    document.getElementById('tableHeadingColor').value = theme.tableHeadingColor;
    document.getElementById('fontSelect').value = theme.fontFamily;
}

function updateLivePreview(theme) {
    // Update preview elements
    const preview = document.querySelector('.theme-preview');
    if (preview) {
        preview.style.setProperty('--text-primary', theme.textColor);
        preview.style.setProperty('--text-secondary', theme.subTextColor);
        preview.style.setProperty('--bg-primary', theme.backgroundColor);
        preview.style.setProperty('--bg-secondary', theme.sidePanelColor);
        preview.style.setProperty('--accent-primary', theme.buttonColor);
        preview.style.setProperty('--table-heading', theme.tableHeadingColor);
        preview.style.setProperty('--table-color', theme.tableColor);
        
        // Update font family in preview
        preview.style.fontFamily = theme.fontFamily;
    }
}

function setupThemeListeners() {
    const inputs = {
        textColor: document.getElementById('textColor'),
        subTextColor: document.getElementById('subTextColor'),
        tableHeadingColor: document.getElementById('tableHeadingColor'),
        buttonColor: document.getElementById('buttonColor'),
        backgroundColor: document.getElementById('backgroundColor'),
        sidePanelColor: document.getElementById('sidePanelColor'),
        fontSelect: document.getElementById('fontSelect')
    };

    // Load current values when tab is shown
    document.querySelector('[href="#theme-settings"]')?.addEventListener('shown.bs.tab', async () => {
        const theme = await loadTheme();
        updateInputValues(theme);
    });

    // Save button
    document.getElementById('saveThemeBtn')?.addEventListener('click', async () => {
        const theme = {
            textColor: inputs.textColor.value,
            subTextColor: inputs.subTextColor.value,
            tableHeadingColor: inputs.tableHeadingColor.value,
            buttonColor: inputs.buttonColor.value,
            backgroundColor: inputs.backgroundColor.value,
            sidePanelColor: inputs.sidePanelColor.value,
            fontFamily: inputs.fontSelect.value
        };
        
        await saveTheme(theme);
        applyTheme(theme);
    });

    // Reset button
    document.getElementById('resetTheme')?.addEventListener('click', async () => {
        if (confirm('Reset to default theme?')) {
            await saveTheme(defaultTheme);
            applyTheme(defaultTheme);
            updateInputValues(defaultTheme);
        }
    });

    // Live preview for colors
    Object.entries(inputs).forEach(([key, input]) => {
        if (input && input.type === 'color') {
            input.addEventListener('input', (e) => {
                document.documentElement.style.setProperty(
                    `--${key.replace('Color', '').replace('Heading', '-heading')}`,
                    e.target.value
                );
                updateLivePreview(getCurrentTheme());
            });
        }
    });

    // Live preview for font
    inputs.fontSelect?.addEventListener('change', (e) => {
        console.log('Font selected:', e.target.value);
        const fontValue = e.target.value;
        console.log('Applying font to body:', fontValue);
        document.body.style.fontFamily = fontValue;
        console.log('Current body font:', getComputedStyle(document.body).fontFamily);
        
        document.querySelectorAll('.font-sample').forEach(el => {
            el.style.fontFamily = fontValue;
            console.log('Applied to sample:', el, 'New font:', getComputedStyle(el).fontFamily);
        });
        updateLivePreview(getCurrentTheme());
    });
}


function getCurrentTheme() {
    return {
        textColor: document.getElementById('textColor').value,
        subTextColor: document.getElementById('subTextColor').value,
        tableHeadingColor: document.getElementById('tableHeadingColor').value,
        buttonColor: document.getElementById('buttonColor').value,
        backgroundColor: document.getElementById('backgroundColor').value,
        sidePanelColor: document.getElementById('sidePanelColor').value,
        fontFamily: document.getElementById('fontSelect').value
    };
}

function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = `theme-toast ${isError ? 'error' : ''}`;
    toast.innerHTML = `<i class="bi ${isError ? 'bi-exclamation-triangle' : 'bi-check-circle'}"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}