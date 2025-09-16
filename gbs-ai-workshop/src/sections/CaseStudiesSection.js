import { ErrorBoundary } from '../components/common/ErrorBoundary.js';
import { loadCaseStudies } from '../data/loaders.js';

let initialized = false;
let isLoading = false;
let caseStudiesData = {};
let containerElement = null;

const caseStudiesBoundary = new ErrorBoundary({
    id: 'case-studies-section',
    fallbackMessage: "We couldn't load case studies right now. Please try again later.",
    renderer: ({ message }) => {
        if (containerElement) {
            containerElement.innerHTML = `<div class="text-center text-red-500 py-8">${message}</div>`;
        } else if (typeof window !== 'undefined' && typeof window.alert === 'function') {
            window.alert(message);
        }
    }
});

export async function initCaseStudiesSection() {
    if (initialized || isLoading) return;
    const container = document.getElementById('case-study-container');
    if (!container) return;

    containerElement = container;

    isLoading = true;
    container.innerHTML = `<div class="text-center text-gray-500 py-8 animate-pulse">Loading case studies...</div>`;

    try {
        caseStudiesData = await loadCaseStudies();
        const categories = Object.keys(caseStudiesData ?? {});

        if (!categories.length) {
            container.innerHTML = `<div class="text-center text-gray-500 py-8">No case studies available yet.</div>`;
            initialized = true;
            return;
        }

        const tabs = document.createElement('nav');
        tabs.id = 'case-study-tabs';
        tabs.className = '-mb-px flex space-x-8';
        tabs.setAttribute('aria-label', 'Tabs');

        const content = document.createElement('div');
        content.id = 'case-study-content';
        content.className = 'mt-8';

        container.innerHTML = '';
        container.appendChild(tabs);
        container.appendChild(content);

        tabs.innerHTML = categories.map((category, index) => `
            <button class="case-study-tab ${index === 0 ? 'active' : ''}" data-category="${category}">${category}</button>
        `).join('');

        loadCaseStudy(categories[0]);

        tabs.addEventListener('click', (event) => {
            const tab = event.target.closest('.case-study-tab');
            if (!tab) return;

            document.querySelectorAll('.case-study-tab').forEach((button) => button.classList.remove('active'));
            tab.classList.add('active');
            loadCaseStudy(tab.getAttribute('data-category'));
        });

        initialized = true;
    } catch (error) {
        caseStudiesBoundary.capture(error, {
            message: "We couldn't load case studies right now. Please try again later.",
            context: { scope: 'case-studies.load' }
        });
    } finally {
        isLoading = false;
    }
}

function loadCaseStudy(category) {
    const content = document.getElementById('case-study-content');
    if (!content) return;

    const steps = caseStudiesData?.[category] ?? [];
    const stepsHtml = steps.map((step, index) => `
        <div class="timeline-step bg-white p-6 rounded-lg shadow-sm">
            <h4 class="font-bold text-lg text-[#4A90E2] mb-2">Step ${index + 1}: ${step.title}</h4>
            <p class="text-sm text-gray-500 italic mb-4">${step.description}</p>
            <div class="code-block text-xs">${step.prompt}</div>
        </div>
        ${index < steps.length - 1 ? '<div class="timeline-connector"></div>' : ''}
    `).join('');

    if (steps.length === 0) {
        content.innerHTML = `<div class="text-center text-gray-500 py-8">No case studies available for this category.</div>`;
        return;
    }

    content.innerHTML = `<div class="timeline-container">${stepsHtml}</div>`;
}
