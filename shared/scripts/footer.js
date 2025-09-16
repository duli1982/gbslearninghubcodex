const FOOTER_TEMPLATE_URL = new URL('../footer.html', import.meta.url);

const getRelativeRootPrefix = () => {
    const { pathname } = window.location;
    const segments = pathname.split('/').filter(Boolean);

    if (!pathname.endsWith('/')) {
        segments.pop();
    }

    if (segments.length === 0) {
        return '';
    }

    return '../'.repeat(segments.length);
};

document.addEventListener('DOMContentLoaded', async () => {
    const placeholder = document.getElementById('footer-placeholder');
    if (!placeholder) {
        return;
    }

    try {
        const response = await fetch(FOOTER_TEMPLATE_URL);
        if (!response.ok) {
            throw new Error(`Failed to load footer template: ${response.status}`);
        }

        const footerMarkup = await response.text();
        placeholder.innerHTML = footerMarkup;

        const rootPrefix = getRelativeRootPrefix();
        if (!rootPrefix) {
            return;
        }

        const links = placeholder.querySelectorAll('a[href^="/"]');
        links.forEach(link => {
            const originalHref = link.getAttribute('href');
            if (!originalHref) {
                return;
            }

            link.setAttribute('href', `${rootPrefix}${originalHref.slice(1)}`);
        });
    } catch (error) {
        console.error('Error loading footer:', error);
    }
});
