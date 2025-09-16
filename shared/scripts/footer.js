document.addEventListener("DOMContentLoaded", function() {
    const placeholder = document.getElementById('footer-placeholder');
    if (placeholder) {
        // Determine the path to the footer file based on the current page's depth
        const path = window.location.pathname;
        const depth = path.split('/').length - 2; // -2 because of the leading and trailing slash in some cases
        const relativePath = '../'.repeat(depth > 0 ? depth : 0) + 'shared/footer.html';

        fetch(relativePath)
            .then(response => response.text())
            .then(data => {
                placeholder.innerHTML = data;

                // Adjust link paths to be relative to the root
                const links = placeholder.querySelectorAll('a');
                const isFileProtocol = window.location.protocol === 'file:';

                links.forEach(link => {
                    const originalHref = link.getAttribute('href');
                    if (originalHref && originalHref.startsWith('/')) {
                        let newHref = originalHref;
                        if (isFileProtocol) {
                            // For local file viewing, construct a relative path from the root
                            const rootPath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/shared/'));
                            newHref = `file://${rootPath}${originalHref}`;
                        } else {
                            // For server viewing, root-relative paths are fine
                             const relativePrefix = '../'.repeat(depth > 0 ? depth : 0);
                             newHref = relativePrefix.slice(0, -1) + originalHref
                        }
                        link.setAttribute('href', newHref);
                    }
                });
            })
            .catch(error => console.error('Error loading footer:', error));
    }
});
