const form = document.getElementById('proxyForm');
const input = document.getElementById('urlInput');
const errorMessage = document.getElementById('errorMessage');
const bookmarkCount = document.getElementById('bookmarkCount');
const historyCount = document.getElementById('historyCount');
const bookmarkList = document.getElementById('bookmarkList');
const historyList = document.getElementById('historyList');
const settingsOverlay = document.getElementById('settingsOverlay');
const bookmarkStar = document.getElementById('bookmarkStar');

const read = (key, fallback = []) => {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch (_) { return fallback; }
};
const write = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
};

let bookmarks = read('pp_bookmarks');
let history = read('pp_history');
let saveHistory = localStorage.getItem('pp_save_history') !== 'false';
let lastSubmit = 0;

const showError = (message) => {
    if (!errorMessage) return;
    errorMessage.textContent = message;
    errorMessage.hidden = !message;
};

const currentAddress = () => {
    const value = input?.value.trim() || '';
    if (!value) return '';
    return normalizeUrl(value);
};

const updateBookmarkStar = () => {
    const url = currentAddress();
    const saved = !!url && bookmarks.includes(url);
    if (bookmarkStar) {
        bookmarkStar.textContent = saved ? '★' : '☆';
        bookmarkStar.setAttribute('aria-label', saved ? 'Remove bookmark' : 'Bookmark current address');
        bookmarkStar.title = saved ? 'Remove bookmark' : 'Bookmark';
        bookmarkStar.classList.toggle('bookmarked', saved);
    }
};

const renderSaved = () => {
    if (bookmarkCount) bookmarkCount.textContent = bookmarks.length;
    if (historyCount) historyCount.textContent = history.length;

    if (bookmarkList) {
        bookmarkList.innerHTML = bookmarks.length
            ? bookmarks.map((url, i) => `<div class="saved-item"><button type="button" data-bookmark="${i}">${url}</button><span>★</span></div>`).join('')
            : '<p class="empty-note">No bookmarks yet.</p>';
    }

    if (historyList) {
        historyList.innerHTML = history.length
            ? history.map((url, i) => `<div class="saved-item"><button type="button" data-history="${i}">${url}</button><span>${i + 1}</span></div>`).join('')
            : '<p class="empty-note">No history yet.</p>';
    }

    updateBookmarkStar();
};

const normalizeUrl = (value) => {
    let url = value.trim();
    if (!url.includes('.') || url.includes(' ')) {
        url = 'https://www.bing.com/search?q=' + encodeURIComponent(url);
    } else if (!/^https?:\\/\\//i.test(url)) {
        url = 'https://' + url;
    }
    return url;
};

const addHistory = (url) => {
    if (!saveHistory) return;
    history = [url, ...history.filter(x => x !== url)].slice(0, 30);
    write('pp_history', history);
    renderSaved();
};

const toggleBookmark = () => {
    const url = currentAddress();
    if (!url) {
        showError('Enter a URL or search first, then press the star.');
        return;
    }

    if (bookmarks.includes(url)) {
        bookmarks = bookmarks.filter(x => x !== url);
        showError('Bookmark removed.');
    } else {
        bookmarks = [url, ...bookmarks.filter(x => x !== url)].slice(0, 50);
        showError('Bookmark added.');
    }

    write('pp_bookmarks', bookmarks);
    renderSaved();
    setTimeout(() => showError(''), 1400);
};

bookmarkStar?.addEventListener('click', toggleBookmark);
input?.addEventListener('input', updateBookmarkStar);

document.getElementById('backButton')?.addEventListener('click', () => {
    if (history.length > 1) window.history.back();
    else showError('Nothing to go back to yet.');
});
document.getElementById('refreshButton')?.addEventListener('click', () => window.location.reload());

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        if (window.__uv$config) {
            navigator.serviceWorker.register(__uv$config.sw, { scope: __uv$config.prefix })
                .catch(() => showError('Proxy service worker could not be registered.'));
        }
    });
}

form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    showError('');

    const now = Date.now();
    if (now - lastSubmit < 3000) {
        showError('Please wait a moment before sending another request.');
        return;
    }

    lastSubmit = now;
    const value = input.value.trim();
    if (!value) {
        showError('Enter a URL or search query first.');
        return;
    }

    const url = normalizeUrl(value);
    addHistory(url);

    if (!window.__uv$config) {
        showError('Proxy configuration is not loaded yet.');
        return;
    }

    const destination = __uv$config.prefix + __uv$config.encodeUrl(url);
    try {
        if ('serviceWorker' in navigator && __uv$config.sw) {
            const registration = await navigator.serviceWorker.getRegistration(__uv$config.prefix)
                || await navigator.serviceWorker.register(__uv$config.sw, { scope: __uv$config.prefix });
            await registration.update();
        }
    } catch (_) {}
    window.location.href = destination;
});

document.getElementById('whyBing')?.addEventListener('click', () => {
    const panel = document.getElementById('whyBingPanel');
    if (!panel) return;
    panel.hidden = !panel.hidden;
    const button = document.getElementById('whyBing');
    if (button) button.setAttribute('aria-expanded', String(!panel.hidden));
});

document.getElementById('bookmarksButton')?.addEventListener('click', () => {
    document.getElementById('bookmarkPanel').hidden = false;
    document.getElementById('historyPanel').hidden = true;
});
document.getElementById('historyButton')?.addEventListener('click', () => {
    document.getElementById('historyPanel').hidden = false;
    document.getElementById('bookmarkPanel').hidden = true;
});
document.getElementById('clearHistoryButton')?.addEventListener('click', () => {
    history = [];
    write('pp_history', history);
    renderSaved();
});
document.querySelectorAll('.close-panel').forEach(button => button.addEventListener('click', () => {
    const id = button.dataset.close;
    if (id) document.getElementById(id).hidden = true;
}));

bookmarkList?.addEventListener('click', (e) => {
    const button = e.target.closest('[data-bookmark]');
    if (!button) return;
    input.value = bookmarks[Number(button.dataset.bookmark)] || '';
    input.focus();
    updateBookmarkStar();
});
historyList?.addEventListener('click', (e) => {
    const button = e.target.closest('[data-history]');
    if (!button) return;
    input.value = history[Number(button.dataset.history)] || '';
    input.focus();
    updateBookmarkStar();
});

const closeSettings = () => {
    if (!settingsOverlay) return;
    settingsOverlay.hidden = true;
    settingsOverlay.setAttribute('aria-hidden', 'true');
};
const openSettings = () => {
    if (!settingsOverlay) return;
    settingsOverlay.hidden = false;
    settingsOverlay.setAttribute('aria-hidden', 'false');
};
document.getElementById('settingsButton')?.addEventListener('click', openSettings);
document.getElementById('closeSettings')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeSettings();
});
settingsOverlay?.addEventListener('click', (e) => {
    if (e.target === settingsOverlay) closeSettings();
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && settingsOverlay && !settingsOverlay.hidden) closeSettings();
});

document.getElementById('saveSettings')?.addEventListener('click', () => {
    const theme = document.getElementById('themeSelect').value;
    saveHistory = document.getElementById('historyToggle').checked;
    const reduceMotion = document.getElementById('animationToggle').checked;

    document.body.dataset.theme = theme;
    document.body.classList.toggle('reduce-motion', reduceMotion);
    localStorage.setItem('pp_theme', theme);
    localStorage.setItem('pp_save_history', String(saveHistory));
    localStorage.setItem('pp_reduce_motion', String(reduceMotion));
    closeSettings();
});

const savedTheme = localStorage.getItem('pp_theme') || 'plaza';
const savedReduce = localStorage.getItem('pp_reduce_motion') === 'true';
document.body.dataset.theme = savedTheme;
document.body.classList.toggle('reduce-motion', savedReduce);

if (document.getElementById('themeSelect')) document.getElementById('themeSelect').value = savedTheme;
if (document.getElementById('historyToggle')) document.getElementById('historyToggle').checked = saveHistory;
if (document.getElementById('animationToggle')) document.getElementById('animationToggle').checked = savedReduce;

if (settingsOverlay) {
    settingsOverlay.hidden = true;
    settingsOverlay.setAttribute('aria-hidden', 'true');
}

renderSaved();
