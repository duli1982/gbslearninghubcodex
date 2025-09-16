import { ErrorBoundary } from './common/ErrorBoundary.js';

const DEFAULT_MESSAGES = {
    loading: 'Loading prompts...',
    empty: 'No prompts available.',
    emptyFilter: 'No prompts found for this filter.',
    error: 'Unable to load prompts right now.'
};

const promptExplorerBoundary = new ErrorBoundary({
    id: 'prompt-explorer',
    fallbackMessage: 'We couldn\'t load prompts right now. Please try again later.',
    renderer: () => {}
});

export class PromptExplorer {
    constructor({
        containerId,
        filterButtonSelector,
        loadPrompts,
        onAddFavorite,
        onRemoveFavorite,
        messages = {}
    } = {}) {
        this.containerId = containerId;
        this.filterButtonSelector = filterButtonSelector;
        this.loadPromptsFn = typeof loadPrompts === 'function' ? loadPrompts : null;
        this.handlers = {
            onAddFavorite: typeof onAddFavorite === 'function' ? onAddFavorite : null,
            onRemoveFavorite: typeof onRemoveFavorite === 'function' ? onRemoveFavorite : null
        };
        this.messages = { ...DEFAULT_MESSAGES, ...messages };

        this.state = {
            prompts: [],
            library: [],
            filter: 'All',
            loading: false,
            loaded: false,
            error: null,
            errorMessage: ''
        };

        this.initialized = false;
        this.container = null;
        this.filterButtons = [];

        this.handleFilterClick = this.handleFilterClick.bind(this);
        this.handleContainerClick = this.handleContainerClick.bind(this);
    }

    async init() {
        if (!this.initialized) {
            this.container = this.containerId ? document.getElementById(this.containerId) : null;
            if (!this.container) {
                return;
            }

            if (this.filterButtonSelector) {
                this.filterButtons = Array.from(document.querySelectorAll(this.filterButtonSelector));
                this.filterButtons.forEach((button) => {
                    button.addEventListener('click', this.handleFilterClick);
                });
                const activeButton = this.filterButtons.find((button) => button.classList.contains('active'));
                if (activeButton) {
                    const activeFilter = activeButton.getAttribute('data-filter')?.trim()
                        || activeButton.textContent?.trim();
                    if (activeFilter) {
                        this.state.filter = activeFilter;
                    }
                } else if (this.filterButtons.length) {
                    const defaultFilter = this.filterButtons[0].getAttribute('data-filter')?.trim()
                        || this.filterButtons[0].textContent?.trim();
                    if (defaultFilter) {
                        this.state.filter = defaultFilter;
                    }
                    this.updateFilterButtonStyles(this.filterButtons[0]);
                }
            }

            this.container.addEventListener('click', this.handleContainerClick);
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
        await this.fetchPrompts();
    }

    setLibrary(libraryEntries) {
        this.state.library = Array.isArray(libraryEntries) ? libraryEntries : [];
        if (this.initialized && this.state.loaded && !this.state.loading) {
            this.render();
        }
    }

    async fetchPrompts() {
        if (!this.loadPromptsFn || this.state.loading) return;

        this.state.loading = true;
        this.state.error = null;
        this.state.errorMessage = '';
        promptExplorerBoundary.clear();

        try {
            const prompts = await this.loadPromptsFn();
            this.state.prompts = Array.isArray(prompts) ? prompts : [];
            this.state.loaded = true;
        } catch (error) {
            const friendlyMessage = promptExplorerBoundary.capture(error, {
                message: 'We couldn\'t load prompts right now. Please try again later.',
                context: { scope: 'prompt-explorer.load' }
            });
            this.state.error = error;
            this.state.errorMessage = error?.friendlyMessage || friendlyMessage;
        } finally {
            this.state.loading = false;
            this.render();
        }
    }

    handleFilterClick(event) {
        event.preventDefault();
        const button = event.currentTarget ?? event.target;
        if (!button) return;

        const filterValue = button.getAttribute('data-filter')?.trim()
            || button.textContent?.trim()
            || 'All';

        this.state.filter = filterValue;
        this.updateFilterButtonStyles(button);
        if (this.state.loaded && !this.state.loading) {
            this.renderPrompts();
        }
    }

    handleContainerClick(event) {
        if (!this.container) return;
        const favoriteButton = event.target.closest('[data-favorite-id]');
        if (!favoriteButton) return;

        const promptId = favoriteButton.getAttribute('data-favorite-id');
        if (!promptId) return;

        const favoriteEntry = this.state.library.find((entry) => entry.type === 'favorite' && entry.originalId === promptId);
        if (favoriteEntry) {
            this.handlers.onRemoveFavorite?.(favoriteEntry.id, promptId);
        } else {
            this.handlers.onAddFavorite?.(promptId);
        }
    }

    updateFilterButtonStyles(activeButton) {
        if (!Array.isArray(this.filterButtons) || !this.filterButtons.length) return;

        this.filterButtons.forEach((button) => {
            button.classList.remove('active', 'bg-[#4A90E2]', 'text-white');
            button.classList.add('bg-white', 'text-gray-700');
        });

        if (activeButton) {
            activeButton.classList.add('active', 'bg-[#4A90E2]', 'text-white');
            activeButton.classList.remove('bg-white', 'text-gray-700');
        }
    }

    render() {
        if (!this.container) return;

        if (this.state.error) {
            const message = this.state.errorMessage || this.messages.error;
            this.container.innerHTML = `<div class="col-span-full text-center text-red-500 py-8">${message}</div>`;
            return;
        }

        if (!this.state.loaded) {
            this.renderLoading();
            return;
        }

        this.renderPrompts();
    }

    renderLoading() {
        if (!this.container) return;
        this.container.innerHTML = `<div class="col-span-full text-center text-gray-500 py-8 animate-pulse">${this.messages.loading}</div>`;
    }

    renderPrompts() {
        if (!this.container) return;

        const filteredPrompts = this.getFilteredPrompts();

        if (!this.state.prompts.length) {
            this.container.innerHTML = `<div class="col-span-full text-center text-gray-500 py-8">${this.messages.empty}</div>`;
            return;
        }

        if (!filteredPrompts.length) {
            this.container.innerHTML = `<div class="col-span-full text-center text-gray-500 py-8">${this.messages.emptyFilter}</div>`;
            return;
        }

        const fragment = document.createDocumentFragment();
        filteredPrompts.forEach((prompt) => {
            const card = this.createPromptCard(prompt);
            fragment.appendChild(card);
        });

        this.container.innerHTML = '';
        this.container.appendChild(fragment);
    }

    getFilteredPrompts() {
        if (this.state.filter === 'All') {
            return this.state.prompts;
        }
        return this.state.prompts.filter((prompt) => prompt.category === this.state.filter);
    }

    createPromptCard(prompt) {
        const card = document.createElement('div');
        card.className = 'prompt-card bg-white p-6 rounded-lg shadow-sm';

        const isFavorited = this.state.library.some((entry) => entry.type === 'favorite' && entry.originalId === prompt.id);

        card.innerHTML = `
            <div>
                <h4 class="font-bold text-lg mb-2 text-[#4A90E2]">${prompt.title}</h4>
                <p class="text-gray-600 text-sm">${prompt.content}</p>
            </div>
            <div class="mt-4 pt-4 border-t border-gray-100 flex justify-end items-center">
                <svg data-favorite-id="${prompt.id}" class="favorite-btn h-6 w-6 ${isFavorited ? 'favorited' : ''}" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
            </div>
        `;

        return card;
    }
}
