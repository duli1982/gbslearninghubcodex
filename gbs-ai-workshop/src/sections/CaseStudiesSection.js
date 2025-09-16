import { caseStudies } from '../data/caseStudies.js';

let initialized = false;

export function initCaseStudiesSection() {
    if (initialized) return;
    const container = document.getElementById('case-study-container');
    if (!container) return;

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

    const categories = Object.keys(caseStudies);
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
}

function loadCaseStudy(category) {
    const content = document.getElementById('case-study-content');
    if (!content) return;

    const steps = caseStudies[category] ?? [];
    const stepsHtml = steps.map((step, index) => `
        <div class="timeline-step bg-white p-6 rounded-lg shadow-sm">
            <h4 class="font-bold text-lg text-[#4A90E2] mb-2">Step ${index + 1}: ${step.title}</h4>
            <p class="text-sm text-gray-500 italic mb-4">${step.description}</p>
            <div class="code-block text-xs">${step.prompt}</div>
        </div>
        ${index < steps.length - 1 ? '<div class="timeline-connector"></div>' : ''}
    `).join('');

    content.innerHTML = `<div class="timeline-container">${stepsHtml}</div>`;
}
