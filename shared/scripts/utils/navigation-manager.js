import StorageManager from './storage-manager.js';

const DEFAULT_OPTIONS = {
    mainPage: null,
    sessionContainer: null,
    headerTitle: null,
    pageTitles: {},
    moduleTitles: {},
    sessionBasePath: 'sessions/',
    defaultModuleTitle: 'Select a Session',
    sessionErrorMessage: 'Error loading content. Please try again later.'
};

const isBrowserEnvironment = typeof window !== 'undefined';

let configuredOptions = { ...DEFAULT_OPTIONS };

const mergeOptions = (overrides = {}) => ({
    ...configuredOptions,
    ...overrides,
    pageTitles: {
        ...configuredOptions.pageTitles,
        ...overrides.pageTitles
    },
    moduleTitles: {
        ...configuredOptions.moduleTitles,
        ...overrides.moduleTitles
    }
});

const isMainPage = pageId => pageId === 'main-page';
const isModulePage = pageId => typeof pageId === 'string' && pageId.startsWith('module-');
const isSessionPage = pageId => typeof pageId === 'string' && pageId.startsWith('session-');

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

function showMainPage(options) {
    const { mainPage, sessionContainer, headerTitle, pageTitles } = options;

    if (mainPage) {
        mainPage.classList.add('active');
    }

    if (sessionContainer) {
        sessionContainer.classList.remove('active');
        sessionContainer.textContent = '';
    }

    StorageManager.scroll.restore();
    StorageManager.module.clear();

    if (headerTitle) {
        headerTitle.textContent = pageTitles['main-page'] || '';
    }
}

function showModuleMenu(moduleId, options) {
    const { mainPage, sessionContainer, headerTitle, moduleTitles, pageTitles, defaultModuleTitle } = options;

    if (!sessionContainer) {
        return;
    }

    const moduleNumber = moduleId.split('-')[1];
    const sessions = Object.keys(pageTitles || {})
        .filter(key => key.startsWith(`session-${moduleNumber}-`))
        .map(key => ({
            id: key,
            title: pageTitles[key]
        }));

    const moduleTitle = moduleTitles[moduleId] || defaultModuleTitle;

    const container = document.createElement('div');
    container.className = 'content-section';

    const backButton = document.createElement('button');
    backButton.type = 'button';
    backButton.className = 'mb-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500';
    backButton.textContent = '← Back to All Modules';
    backButton.addEventListener('click', () => NavigationManager.navigate('main-page'));
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
            NavigationManager.navigate(session.id);
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

    if (mainPage) {
        mainPage.classList.remove('active');
    }

    if (headerTitle) {
        headerTitle.textContent = moduleTitle;
    }

    if (isBrowserEnvironment && typeof window.scrollTo === 'function') {
        window.scrollTo(0, 0);
    }

    StorageManager.module.setCurrent(moduleId);
}

function getSessionFilePath(pageId, sessionBasePath) {
    const sanitizedBase = sessionBasePath.endsWith('/') ? sessionBasePath : `${sessionBasePath}/`;
    const sessionPath = pageId.replace('session-', '').replace('-page', '');
    return `${sanitizedBase}${sessionPath}.html`;
}

function loadSession(pageId, options) {
    const { sessionContainer, headerTitle, pageTitles, sessionBasePath, sessionErrorMessage } = options;

    if (!sessionContainer) {
        return;
    }

    const filePath = getSessionFilePath(pageId, sessionBasePath);

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

            if (headerTitle) {
                headerTitle.textContent = pageTitles[pageId] || pageTitles['main-page'] || '';
            }

            if (isBrowserEnvironment && typeof window.scrollTo === 'function') {
                window.scrollTo(0, 0);
            }

            const backButton = sessionContainer.querySelector('button');
            if (backButton) {
                backButton.addEventListener('click', () => {
                    const currentModuleId = StorageManager.module.getCurrent();
                    if (currentModuleId) {
                        NavigationManager.navigate(currentModuleId);
                    } else {
                        NavigationManager.navigate('main-page');
                    }
                });
            }
        })
        .catch(error => {
            console.error('Error fetching session content:', error);
            sessionContainer.textContent = '';
            const errorMessage = document.createElement('p');
            errorMessage.className = 'text-red-500';
            errorMessage.textContent = sessionErrorMessage;
            sessionContainer.appendChild(errorMessage);
            sessionContainer.classList.add('active');
        });
}

function navigate(pageId, options = {}) {
    if (typeof pageId !== 'string' || !pageId.trim()) {
        return;
    }

    const normalizedPageId = pageId.trim();
    const mergedOptions = mergeOptions(options);

    const { mainPage, sessionContainer } = mergedOptions;

    if (mainPage && mainPage.classList.contains('active') && !isMainPage(normalizedPageId)) {
        StorageManager.scroll.save();
    }

    if (mainPage) {
        mainPage.classList.remove('active');
    }

    if (sessionContainer) {
        sessionContainer.classList.remove('active');
        sessionContainer.textContent = '';
    }

    if (isMainPage(normalizedPageId)) {
        showMainPage(mergedOptions);
        return;
    }

    if (isModulePage(normalizedPageId)) {
        showModuleMenu(normalizedPageId, mergedOptions);
        return;
    }

    if (isSessionPage(normalizedPageId)) {
        loadSession(normalizedPageId, mergedOptions);
        return;
    }

    showMainPage(mergedOptions);
}

function configure(options = {}) {
    configuredOptions = mergeOptions(options);
    return configuredOptions;
}

const NavigationManager = {
    configure,
    navigate
};

if (isBrowserEnvironment) {
    window.NavigationManager = NavigationManager;
}

export default NavigationManager;
