import { ErrorBoundary } from '../components/common/ErrorBoundary.js';

const dataCache = new Map();

const FRIENDLY_MESSAGES = {
    prompts: "We couldn't load the prompt library right now. Please try again later.",
    scenarios: "We couldn't load the simulator scenarios right now. Please try again later.",
    myDayEvents: "We couldn't load the My Day experience right now. Please try again later.",
    caseStudies: "We couldn't load the case studies right now. Please refresh the page.",
    opportunityData: "We couldn't load the opportunity framework right now. Please refresh the page.",
    whySubtitles: "We couldn't load new inspiration right now. Please try again later."
};

const dataBoundary = new ErrorBoundary({
    id: 'data-loaders',
    fallbackMessage: "We couldn't load the workshop content. Please refresh and try again.",
    renderer: () => {}
});

function loadData(key, importer) {
    if (!dataCache.has(key)) {
        const promise = importer().catch((error) => {
            dataCache.delete(key);
            const message = FRIENDLY_MESSAGES[key] || dataBoundary.fallbackMessage;
            dataBoundary.capture(error, {
                message,
                context: { scope: `data.${key}` }
            });
            throw error;
        });
        dataCache.set(key, promise);
    }
    return dataCache.get(key);
}

export function loadPromptsData() {
    return loadData('prompts', async () => {
        const module = await import('./prompts.js');
        return Array.isArray(module.prompts) ? module.prompts : [];
    });
}

export function loadScenarios() {
    return loadData('scenarios', async () => {
        const module = await import('./scenarios.js');
        return module.scenarios ?? {};
    });
}

export function loadMyDayEvents() {
    return loadData('myDayEvents', async () => {
        const module = await import('./myDayEvents.js');
        return Array.isArray(module.myDayEvents) ? module.myDayEvents : [];
    });
}

export function loadCaseStudies() {
    return loadData('caseStudies', async () => {
        const module = await import('./caseStudies.js');
        return module.caseStudies ?? {};
    });
}

export function loadOpportunityData() {
    return loadData('opportunityData', async () => {
        const module = await import('./opportunityData.js');
        return {
            opportunityData: module.opportunityData,
            opportunityDetailsData: module.opportunityDetailsData
        };
    });
}

export function loadWhySubtitles() {
    return loadData('whySubtitles', async () => {
        const module = await import('./whySubtitles.js');
        return Array.isArray(module.whySubtitles) ? module.whySubtitles : [];
    });
}
