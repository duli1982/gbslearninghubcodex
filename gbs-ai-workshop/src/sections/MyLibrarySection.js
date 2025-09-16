import { loadPromptsData } from '../data/loaders.js';
import { onLibraryChange, removePromptFromLibrary } from '../services/firebaseService.js';

let customList;
let favoriteList;
let noCustomMessage;
let noFavoriteMessage;
let libraryState = [];
let promptsData = [];
let promptsLoaded = false;
let promptsLoading = false;
let promptsLoadError = null;
let isInitialized = false;

export function initMyLibrarySection() {
    if (isInitialized) return;

    customList = document.getElementById('my-custom-prompts-list');
    favoriteList = document.getElementById('my-favorite-prompts-list');
    noCustomMessage = document.getElementById('no-custom-prompts');
    noFavoriteMessage = document.getElementById('no-favorite-prompts');

    if (!customList || !favoriteList) return;

    customList.addEventListener('click', (event) => {
        const button = event.target.closest('[data-remove-custom]');
        if (!button) return;
        removePromptFromLibrary(button.getAttribute('data-remove-custom'));
    });

    favoriteList.addEventListener('click', (event) => {
        const button = event.target.closest('[data-unfavorite-id]');
        if (!button) return;
        removePromptFromLibrary(button.getAttribute('data-unfavorite-id'));
    });

    onLibraryChange((library) => {
        libraryState = library;
        renderLibrary();
    });

    isInitialized = true;

    renderLibrary();
    void loadPrompts();
}

function renderLibrary() {
    if (!customList || !favoriteList) return;

    customList.innerHTML = '';
    favoriteList.innerHTML = '';

    const customPrompts = libraryState.filter((entry) => entry.type === 'custom');
    const favoritePrompts = libraryState.filter((entry) => entry.type === 'favorite');

    if (customPrompts.length) {
        noCustomMessage?.classList.add('hidden');
        customList.classList.remove('hidden');
        customPrompts.forEach((prompt) => {
            const card = createCustomPromptCard(prompt);
            customList.appendChild(card);
        });
    } else {
        customList.classList.add('hidden');
        noCustomMessage?.classList.remove('hidden');
    }

    if (favoritePrompts.length) {
        if (!promptsLoaded && !promptsLoading) {
            void loadPrompts();
        }

        noFavoriteMessage?.classList.add('hidden');
        favoriteList.classList.remove('hidden');

        if (promptsLoadError) {
            favoriteList.innerHTML = `<div class="col-span-full text-center text-red-500 py-4">Unable to load your saved prompts right now.</div>`;
            return;
        }

        if (!promptsLoaded) {
            favoriteList.innerHTML = `<div class="col-span-full text-center text-gray-500 py-4 animate-pulse">Loading your saved prompts...</div>`;
            return;
        }

        const promptsById = new Map(promptsData.map((prompt) => [prompt.id, prompt]));
        let renderedCount = 0;

        favoritePrompts.forEach((entry) => {
            const originalPrompt = promptsById.get(entry.originalId);
            if (!originalPrompt) return;
            const card = createFavoritePromptCard(originalPrompt, entry.id);
            favoriteList.appendChild(card);
            renderedCount += 1;
        });

        if (renderedCount === 0) {
            favoriteList.innerHTML = `<div class="col-span-full text-center text-gray-500 py-4">Saved prompts are currently unavailable.</div>`;
        }
    } else {
        favoriteList.classList.add('hidden');
        noFavoriteMessage?.classList.remove('hidden');
    }
}

function createCustomPromptCard(prompt) {
    const card = document.createElement('div');
    card.className = 'prompt-card bg-white p-6 rounded-lg shadow-sm';
    card.innerHTML = `
        <div>
            <h4 class="font-bold text-lg mb-2 text-[#4A90E2]">${prompt.title}</h4>
            <p class="text-gray-600 text-sm">${prompt.content}</p>
        </div>
        <div class="mt-4 pt-4 border-t border-gray-100 flex justify-end items-center">
            <button data-remove-custom="${prompt.id}" class="remove-custom-btn text-red-500 hover:text-red-700 text-xs font-semibold">Remove</button>
        </div>
    `;
    return card;
}

function createFavoritePromptCard(prompt, libraryId) {
    const card = document.createElement('div');
    card.className = 'prompt-card bg-white p-6 rounded-lg shadow-sm';
    card.innerHTML = `
        <div>
            <h4 class="font-bold text-lg mb-2 text-[#4A90E2]">${prompt.title}</h4>
            <p class="text-gray-600 text-sm">${prompt.content}</p>
        </div>
        <div class="mt-4 pt-4 border-t border-gray-100 flex justify-end items-center">
            <button data-unfavorite-id="${libraryId}" class="unfavorite-btn text-red-500 hover:text-red-700 text-xs font-semibold">Unfavorite</button>
        </div>
    `;
    return card;
}

async function loadPrompts() {
    if (promptsLoaded || promptsLoading) return;
    promptsLoading = true;
    promptsLoadError = null;

    try {
        promptsData = await loadPromptsData();
        promptsLoaded = true;
    } catch (error) {
        promptsLoadError = error;
        console.error('Failed to load prompts for library favorites', error);
    } finally {
        promptsLoading = false;
        renderLibrary();
    }
}
