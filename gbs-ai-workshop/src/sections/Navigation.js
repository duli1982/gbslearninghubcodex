const toolHashes = ['#what', '#builder', '#my-library', '#simulator', '#reverse-prompt', '#my-day'];

export function initNavigation({ sectionInitializers = {} } = {}) {
    const sections = Array.from(document.querySelectorAll('.page-section'));
    const navLinks = Array.from(document.querySelectorAll('.nav-link'));
    const toolsDropdown = document.getElementById('tools-dropdown');
    const toolsDropdownBtn = document.getElementById('tools-dropdown-btn');
    const toolsDropdownMenu = document.getElementById('tools-dropdown-menu');
    const initializedSections = new Set();

    const updateSectionVisibility = () => {
        const hash = window.location.hash;
        const path = window.location.pathname.split('/').pop()?.replace('.html', '') ?? '';
        let targetId;

        if (hash) {
            targetId = hash;
        } else if (path && path !== 'index' && path !== '') {
            targetId = `#${path}`;
        } else {
            targetId = '#why';
        }

        sections.forEach((section) => {
            const sectionHash = `#${section.id}`;
            const isVisible = sectionHash === targetId;
            section.classList.toggle('hidden', !isVisible);
            if (isVisible) {
                section.classList.add('fade-in');
                if (!initializedSections.has(section.id) && typeof sectionInitializers[section.id] === 'function') {
                    sectionInitializers[section.id]();
                    initializedSections.add(section.id);
                }
            }
        });

        navLinks.forEach((link) => {
            link.classList.toggle('active', link.getAttribute('href') === targetId);
        });

        if (toolsDropdownBtn) {
            toolsDropdownBtn.classList.toggle('active', toolHashes.includes(targetId));
        }
    };

    window.addEventListener('hashchange', updateSectionVisibility);
    updateSectionVisibility();

    if (toolsDropdown && toolsDropdownBtn && toolsDropdownMenu) {
        toolsDropdownBtn.addEventListener('click', () => {
            const isHidden = toolsDropdownMenu.classList.contains('hidden');
            if (isHidden) {
                toolsDropdownMenu.classList.remove('hidden', 'opacity-0', 'scale-95');
                toolsDropdownMenu.classList.add('opacity-100', 'scale-100');
            } else {
                toolsDropdownMenu.classList.add('opacity-0', 'scale-95');
                window.setTimeout(() => toolsDropdownMenu.classList.add('hidden'), 100);
            }
        });

        toolsDropdownMenu.addEventListener('click', () => {
            toolsDropdownMenu.classList.add('opacity-0', 'scale-95');
            window.setTimeout(() => toolsDropdownMenu.classList.add('hidden'), 100);
        });

        window.addEventListener('click', (event) => {
            if (!toolsDropdown.contains(event.target)) {
                toolsDropdownMenu.classList.add('opacity-0', 'scale-95');
                window.setTimeout(() => toolsDropdownMenu.classList.add('hidden'), 100);
            }
        });
    }

    return {
        refresh: updateSectionVisibility
    };
}
