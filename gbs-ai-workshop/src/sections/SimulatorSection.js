import { loadScenarios } from '../data/loaders.js';

let simulatorContainer;
let currentScenarioCategory = null;
let currentScenarioIndex = 0;
let scenariosData = {};
let scenariosLoaded = false;
let scenariosLoading = false;
let hasSetup = false;

export async function initSimulatorSection() {
    simulatorContainer = document.getElementById('simulator-container');
    if (!simulatorContainer) return;

    if (!hasSetup) {
        simulatorContainer.addEventListener('click', handleSimulatorClick);
        hasSetup = true;
    }

    if (scenariosLoaded) {
        displayCategoryMenu();
        return;
    }

    if (scenariosLoading) return;

    scenariosLoading = true;
    simulatorContainer.innerHTML = `<div class="text-center text-gray-500 py-8 animate-pulse">Loading scenarios...</div>`;

    try {
        scenariosData = await loadScenarios();
        scenariosLoaded = true;
        displayCategoryMenu();
    } catch (error) {
        console.error('Failed to load simulator scenarios', error);
        simulatorContainer.innerHTML = `<div class="text-center text-red-500 py-8">We couldn't load scenarios right now. Please try again later.</div>`;
    } finally {
        scenariosLoading = false;
    }
}

function displayCategoryMenu() {
    if (!simulatorContainer) return;
    currentScenarioCategory = null;
    currentScenarioIndex = 0;
    const categories = Object.keys(scenariosData ?? {});

    if (!categories.length) {
        simulatorContainer.innerHTML = `<div class="text-center text-gray-500 py-8">No simulator scenarios available yet.</div>`;
        return;
    }

    const categoryHtml = categories.map((category) => `
        <div class="category-option p-6 rounded-lg cursor-pointer text-center" data-category="${category}">
            <h3 class="font-bold text-xl text-[#4A90E2]">${category}</h3>
        </div>
    `).join('');

    simulatorContainer.innerHTML = `
        <h3 class="text-2xl font-bold text-center mb-6">Choose a Scenario Category</h3>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">${categoryHtml}</div>
    `;
}

function loadScenario() {
    if (!simulatorContainer || !currentScenarioCategory) return;
    const scenarioList = scenariosData[currentScenarioCategory];
    const scenario = scenarioList?.[currentScenarioIndex];

    if (!scenario) {
        simulatorContainer.innerHTML = `
            <p class="text-center text-gray-600 text-xl">You've completed all scenarios in this category!</p>
            <div class="mt-6 text-center">
                <button id="backToCategoriesBtn" class="bg-gray-600 text-white font-bold py-2 px-6 rounded-full hover:bg-gray-700 transition-colors">Back to Categories</button>
            </div>
        `;
        return;
    }

    const optionsHtml = scenario.prompts.map((prompt, index) => `
        <div class="scenario-option p-4 rounded-lg cursor-pointer" data-index="${index}">
            <p class="font-semibold">${prompt.text}</p>
            <div class="feedback mt-2 text-sm hidden"></div>
        </div>
    `).join('');

    simulatorContainer.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-2xl font-bold text-[#4A90E2]">${scenario.title}</h3>
            <button id="backToCategoriesBtn" class="text-sm text-gray-500 hover:text-gray-800">&larr; Back to Categories</button>
        </div>
        <p class="text-gray-600 mb-6">${scenario.problem}</p>
        <div class="space-y-4">${optionsHtml}</div>
        <div class="mt-6 text-right">
            <button id="nextScenarioBtn" class="hidden bg-[#4A90E2] text-white font-bold py-2 px-6 rounded-full hover:bg-blue-600 transition-colors">Next Scenario</button>
        </div>
    `;
}

function handleSimulatorClick(event) {
    const categoryCard = event.target.closest('.category-option');
    if (categoryCard) {
        currentScenarioCategory = categoryCard.getAttribute('data-category');
        currentScenarioIndex = 0;
        loadScenario();
        return;
    }

    const backButton = event.target.closest('#backToCategoriesBtn');
    if (backButton) {
        currentScenarioCategory = null;
        currentScenarioIndex = 0;
        displayCategoryMenu();
        return;
    }

    const optionElement = event.target.closest('.scenario-option');
    if (optionElement && !optionElement.classList.contains('selected')) {
        const selectedIndex = parseInt(optionElement.getAttribute('data-index') || '0', 10);
        const scenario = scenariosData[currentScenarioCategory]?.[currentScenarioIndex];
        if (!scenario) return;

        const selectedPrompt = scenario.prompts[selectedIndex];
        const allOptions = simulatorContainer.querySelectorAll('.scenario-option');
        allOptions.forEach((option) => option.classList.add('selected'));

        const feedbackEl = optionElement.querySelector('.feedback');
        if (feedbackEl) {
            feedbackEl.textContent = selectedPrompt.feedback;
            feedbackEl.classList.remove('hidden');
        }

        if (selectedPrompt.isCorrect) {
            optionElement.classList.add('correct');
        } else {
            optionElement.classList.add('incorrect');
            const correctIndex = scenario.prompts.findIndex((prompt) => prompt.isCorrect);
            const correctOption = simulatorContainer.querySelector(`.scenario-option[data-index='${correctIndex}']`);
            correctOption?.classList.add('correct');
        }

        document.getElementById('nextScenarioBtn')?.classList.remove('hidden');
        return;
    }

    if (event.target.id === 'nextScenarioBtn') {
        currentScenarioIndex += 1;
        loadScenario();
    }
}
