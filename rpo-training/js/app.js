import { BackToTop } from '../../shared/scripts/gbs-core.js';
import StorageManager from '../../shared/scripts/utils/storage-manager.js';

document.addEventListener('DOMContentLoaded', () => {
    const mainPage = document.getElementById('main-page');
    const sessionContainer = document.getElementById('session-container');
    const headerTitle = document.getElementById('header-title');
    const copyrightYear = document.getElementById('copyright-year');

    const moduleTitles = {
        'module-1': 'Module 1: Prompting & Writing — The C.R.E.A.T.E. Framework',
        'module-2': 'Module 2: Sourcing & Research',
        'module-3': 'Module 3: Data & Knowledge',
        'module-4': 'Module 4: Automation',
        'module-5': 'Module 5: Train the Trainer',
        'module-6': 'Module 6: Strategy & Governance',
        'module-7': 'Module 7: Measuring Impact'
    };

    const pageTitles = {
        'main-page': 'RPO AI Acceleration Program',
        'session-1-1-page': 'Session 1.1: Prompt Engineering 101',
        'session-1-2-page': 'Session 1.2: AI-Powered Email Lab',
        'session-1-3-page': 'Session 1.3: Success Spotlight & Clinic',
        'session-2-1-page': 'Session 2.1: AI for Advanced Sourcing',
        'session-2-2-page': 'Session 2.2: The Randstad AI Toolkit',
        'session-2-3-page': 'Session 2.3: Responsible AI & Showcase',
        'session-3-1-page': 'Session 3.1: Data Insights in Sheets',
        'session-3-2-page': 'Session 3.2: Building a Knowledge Base',
        'session-4-1-page': 'Session 4.1: Intro to Automation',
        'session-5-1-page': 'Session 5.1: Becoming an AI Champion',
        'session-5-2-page': 'Session 5.2: Capstone Project Showcase',
        'session-6-1-page': 'Session 6.1: Developing an AI Roadmap',
        'session-7-1-page': 'Session 7.1: The ROI of AI in Recruiting'
    };

    function sanitizeSessionContent(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        doc.querySelectorAll('script, iframe, object, embed').forEach(element => element.remove());

        doc.querySelectorAll('*').forEach(element => {
            Array.from(element.attributes).forEach(attr => {
                const attrName = attr.name.toLowerCase();

                if (attrName.startsWith('on') || attrName === 'srcdoc') {
                    element.removeAttribute(attr.name);
                    return;
                }

                if ((attrName === 'href' || attrName === 'xlink:href' || attrName === 'src') && /^javascript:/i.test(attr.value)) {
                    element.removeAttribute(attr.name);
                }
            });
        });

        const fragment = document.createDocumentFragment();
        Array.from(doc.body.childNodes).forEach(node => fragment.appendChild(node));
        return fragment;
    }

    function showSessionMenu(moduleId) {
        const moduleNum = moduleId.split('-')[1];
        const sessions = Object.keys(pageTitles)
            .filter(key => key.startsWith(`session-${moduleNum}-`))
            .map(key => ({
                id: key,
                title: pageTitles[key]
            }));

        const moduleTitle = moduleTitles[moduleId] || 'Select a Session';

        const container = document.createElement('div');
        container.className = 'content-section';

        const backButton = document.createElement('button');
        backButton.type = 'button';
        backButton.className = 'mb-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500';
        backButton.textContent = '← Back to All Modules';
        backButton.addEventListener('click', () => navigateTo('main-page'));
        container.appendChild(backButton);

        const heading = document.createElement('h2');
        heading.className = 'google-sans text-3xl font-bold text-gray-800';
        heading.textContent = moduleTitle;
        container.appendChild(heading);

        const description = document.createElement('p');
        description.className = 'mt-2 text-lg text-gray-600';
        description.textContent = 'Select a session to begin.';
        container.appendChild(description);

        const list = document.createElement('ul');
        list.className = 'mt-6 space-y-4';

        sessions.forEach(session => {
            const listItem = document.createElement('li');

            const link = document.createElement('a');
            link.href = '#';
            link.className = 'block bg-white p-6 rounded-lg shadow-md hover:bg-gray-50 transition';
            link.addEventListener('click', event => {
                event.preventDefault();
                navigateTo(session.id);
            });

            const title = document.createElement('h3');
            title.className = 'google-sans text-xl font-bold text-blue-700';
            title.textContent = session.title;

            link.appendChild(title);
            listItem.appendChild(link);
            list.appendChild(listItem);
        });

        container.appendChild(list);

        sessionContainer.textContent = '';
        sessionContainer.appendChild(container);
        sessionContainer.classList.add('active');
        mainPage.classList.remove('active');
        headerTitle.textContent = moduleTitle;
        window.scrollTo(0, 0);
    }

    function navigateTo(pageId) {
        // Store the scroll position if leaving the main page
        if (document.getElementById('main-page').classList.contains('active') && pageId !== 'main-page') {
            StorageManager.scroll.save();
        }

        // Hide all pages by default
        mainPage.classList.remove('active');
        sessionContainer.classList.remove('active');

        if (pageId === 'main-page') {
            mainPage.classList.add('active');
            sessionContainer.textContent = '';
            // Restore scroll position if returning to the main page
            StorageManager.scroll.restore();
            StorageManager.module.clear();
        } else if (pageId.startsWith('module-')) {
            showSessionMenu(pageId);
        } else {
            const sessionPath = pageId.replace('session-', '').replace('-page', '');
            const filePath = `sessions/${sessionPath}.html`;

            fetch(filePath)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Network response was not ok: ${response.status}`);
                    }
                    return response.text();
                })
                .then(html => {
                    const sanitizedContent = sanitizeSessionContent(html);
                    sessionContainer.textContent = '';
                    sessionContainer.appendChild(sanitizedContent);
                    sessionContainer.classList.add('active');
                    // Re-attach event listeners for any new buttons in the loaded content if necessary
                    const backButton = sessionContainer.querySelector('button');
                    // Store the current module ID before navigating to a session
                    const currentModuleId = StorageManager.module.getCurrent();

                    if (backButton) {
                        backButton.addEventListener('click', () => {
                            if (currentModuleId) {
                                navigateTo(currentModuleId);
                            } else {
                                navigateTo('main-page');
                            }
                        });
                    }
                })
                .catch(error => {
                    console.error('Error fetching session content:', error);
                    sessionContainer.textContent = '';
                    const errorMessage = document.createElement('p');
                    errorMessage.className = 'text-red-500';
                    errorMessage.textContent = 'Error loading content. Please try again later.';
                    sessionContainer.appendChild(errorMessage);
                    sessionContainer.classList.add('active');
                });
        }

        headerTitle.textContent = pageTitles[pageId] || pageTitles['main-page'];
        if (pageId !== 'main-page') {
            window.scrollTo(0, 0);
        }

        // Store the current module ID when navigating to a module session menu
        if (pageId.startsWith('module-')) {
            StorageManager.module.setCurrent(pageId);
        }

    }

    // Make navigateTo globally accessible
    window.navigateTo = navigateTo;

    // Set copyright year
    if (copyrightYear) {
        copyrightYear.textContent = new Date().getFullYear();
    }

    // Set up initial page view - check for URL anchor first
    const hash = window.location.hash.substring(1); // Remove the # symbol
    if (hash && Object.keys(pageTitles).includes(hash)) {
        navigateTo(hash);
    } else {
        navigateTo('main-page');
    }

    new BackToTop();
});
