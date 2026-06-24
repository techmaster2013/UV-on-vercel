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
        // FIXED: Switched to Bing search, which does not crash inside UV Service Workers
        url = 'https://bing.com' + encodeURIComponent(url);
    } else if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
    }

    window.location.href = __uv$config.prefix + __uv$config.encodeUrl(url);
});
