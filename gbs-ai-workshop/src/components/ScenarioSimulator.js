import { ErrorBoundary } from './common/ErrorBoundary.js';

const DEFAULT_MESSAGES = {
    loading: 'Loading scenarios...',
    error: "We couldn't load scenarios right now. Please try again later.",
    empty: 'No simulator scenarios available yet.',
    completed: "You've completed all scenarios in this category!"
};

const scenarioSimulatorBoundary = new ErrorBoundary({
    id: 'scenario-simulator',
    fallbackMessage: "We couldn't load scenarios right now. Please try again later.",
    renderer: () => {}
});

export class ScenarioSimulator {
    constructor({
        containerId,
        loadScenarios,
        messages = {}
    } = {}) {
        this.containerId = containerId;
        this.loadScenariosFn = typeof loadScenarios === 'function' ? loadScenarios : null;
        this.messages = { ...DEFAULT_MESSAGES, ...messages };

        this.state = {
            scenarios: {},
            currentCategory: null,
            currentIndex: 0,
            loading: false,
            loaded: false,
            error: null,
            errorMessage: ''
        };

        this.container = null;
        this.initialized = false;
        this.handleClick = this.handleClick.bind(this);
    }

    async init() {
        if (!this.initialized) {
            this.container = this.containerId ? document.getElementById(this.containerId) : null;
            if (!this.container) {
                return;
            }

            this.container.addEventListener('click', this.handleClick);
            this.initialized = true;
        }

        if (!this.container) return;

        if (this.state.loaded) {
            this.render();
            return;
        }

        if (this.state.loading) {
            return;
        }

        this.renderLoading();
        await this.fetchScenarios();
    }

    async fetchScenarios() {
        if (!this.loadScenariosFn) return;

        this.state.loading = true;
        this.state.error = null;
        this.state.errorMessage = '';
        scenarioSimulatorBoundary.clear();

        try {
            const scenarios = await this.loadScenariosFn();
            this.state.scenarios = scenarios && typeof scenarios === 'object' ? scenarios : {};
            this.state.loaded = true;
            this.state.currentCategory = null;
            this.state.currentIndex = 0;
            this.render();
        } catch (error) {
            const friendlyMessage = scenarioSimulatorBoundary.capture(error, {
                message: "We couldn't load scenarios right now. Please try again later.",
                context: { scope: 'scenario-simulator.load' }
            });
            this.state.error = error;
            this.state.errorMessage = error?.friendlyMessage || friendlyMessage;
            this.renderError();
        } finally {
            this.state.loading = false;
        }
    }

    render() {
        if (!this.container) return;

        if (this.state.error) {
            this.renderError();
            return;
        }

        if (!this.state.loaded) {
            this.renderLoading();
            return;
        }

        if (!this.state.currentCategory) {
            this.renderCategoryMenu();
        } else {
            this.renderScenario();
        }
    }

    renderLoading() {
        if (!this.container) return;
        this.container.innerHTML = `<div class="text-center text-gray-500 py-8 animate-pulse">${this.messages.loading}</div>`;
    }

    renderError() {
        if (!this.container) return;
        const message = this.state.errorMessage || this.messages.error;
        this.container.innerHTML = `<div class="text-center text-red-500 py-8">${message}</div>`;
    }

    renderCategoryMenu() {
        if (!this.container) return;

        const categories = Object.keys(this.state.scenarios ?? {});
        if (!categories.length) {
            this.container.innerHTML = `<div class="text-center text-gray-500 py-8">${this.messages.empty}</div>`;
            return;
        }

        const categoryHtml = categories.map((category) => `
            <div class="category-option p-6 rounded-lg cursor-pointer text-center" data-category="${category}">
                <h3 class="font-bold text-xl text-[#4A90E2]">${category}</h3>
            </div>
        `).join('');

        this.container.innerHTML = `
            <h3 class="text-2xl font-bold text-center mb-6">Choose a Scenario Category</h3>
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">${categoryHtml}</div>
        `;
    }

    renderScenario() {
        if (!this.container || !this.state.currentCategory) return;

        const scenarios = this.state.scenarios[this.state.currentCategory] ?? [];
        const scenario = scenarios[this.state.currentIndex];

        if (!scenario) {
            this.container.innerHTML = `
                <p class="text-center text-gray-600 text-xl">${this.messages.completed}</p>
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

        this.container.innerHTML = `
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

    handleClick(event) {
        const categoryCard = event.target.closest('.category-option');
        if (categoryCard) {
            const category = categoryCard.getAttribute('data-category');
            this.state.currentCategory = category ?? null;
            this.state.currentIndex = 0;
            this.render();
            return;
        }

        const backButton = event.target.closest('#backToCategoriesBtn');
        if (backButton) {
            this.state.currentCategory = null;
            this.state.currentIndex = 0;
            this.render();
            return;
        }

        const optionElement = event.target.closest('.scenario-option');
        if (optionElement) {
            this.handleScenarioSelection(optionElement);
            return;
        }

        if (event.target.id === 'nextScenarioBtn') {
            this.state.currentIndex += 1;
            this.renderScenario();
        }
    }

    handleScenarioSelection(optionElement) {
        if (!this.container || optionElement.classList.contains('selected')) return;

        const selectedIndex = Number.parseInt(optionElement.getAttribute('data-index') ?? '0', 10);
        const scenario = this.getCurrentScenario();
        const prompts = scenario?.prompts ?? [];
        const selectedPrompt = prompts[selectedIndex];
        if (!selectedPrompt) return;

        const allOptions = this.container.querySelectorAll('.scenario-option');
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
            const correctIndex = prompts.findIndex((prompt) => prompt.isCorrect);
            if (correctIndex !== -1) {
                const correctOption = this.container.querySelector(`.scenario-option[data-index='${correctIndex}']`);
                correctOption?.classList.add('correct');
            }
        }

        const nextButton = this.container.querySelector('#nextScenarioBtn');
        nextButton?.classList.remove('hidden');
    }

    getCurrentScenario() {
        if (!this.state.currentCategory) return null;
        const scenarios = this.state.scenarios[this.state.currentCategory] ?? [];
        return scenarios[this.state.currentIndex] ?? null;
    }
}
