const dataCache = new Map();

function loadData(key, importer) {
    if (!dataCache.has(key)) {
        const promise = importer().catch((error) => {
            dataCache.delete(key);
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
