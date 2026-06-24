const form = document.getElementById('proxyForm');
const input = document.getElementById('urlInput');

// Register the proxy's active background worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/uv/sw.js', { scope: __uv$config.prefix });
    });
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let url = input.value.trim();

    // Check if the input is a search query or a direct URL address
    if (!url.includes('.') || url.includes(' ')) {
        // FIXED: Added the proper Google search query path
        url = 'https://google.com' + encodeURIComponent(url);
    } else if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
    }

    // Encrypt the URL using UV config and redirect the page context
    window.location.href = __uv$config.prefix + __uv$config.encodeUrl(url);
});

const form = document.getElementById('proxyForm');
const input = document.getElementById('urlInput');

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/uv/sw.js', { scope: __uv$config.prefix });
    });
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let url = input.value.trim();

    // Check if the input is a search query or a direct URL address
    if (!url.includes('.') || url.includes(' ')) {
        // CHANGED: DuckDuckGo URL query structure 
        url = '
