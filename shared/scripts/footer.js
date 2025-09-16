const getFooterPath = () =>
    window.location.pathname.includes('/shared/')
        ? '../shared/footer.html'
        : './shared/footer.html';

document.addEventListener("DOMContentLoaded", function() {
    const placeholder = document.getElementById('footer-placeholder');
    if (placeholder) {
        const footerPath = getFooterPath();

        fetch(footerPath)
            .then(response => response.text())
            .then(data => {
                placeholder.innerHTML = data;

                const links = placeholder.querySelectorAll('a[href^="/"]');
                const prefix = footerPath.replace('shared/footer.html', '');
                const normalizedPrefix = prefix === './' ? '' : prefix;

                links.forEach(link => {
                    const originalHref = link.getAttribute('href');
                    if (!originalHref) {
                        return;
                    }

                    if (!normalizedPrefix) {
                        link.setAttribute('href', originalHref);
                        return;
                    }

                    link.setAttribute('href', `${normalizedPrefix}${originalHref.slice(1)}`);
                });
            })
            .catch(error => console.error('Error loading footer:', error));
    }
});
