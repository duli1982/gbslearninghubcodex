import { prompts } from '../data/prompts.js';
import { addPromptToLibrary, removePromptFromLibrary, onLibraryChange } from '../services/firebaseService.js';

let currentFilter = 'All';
let promptLibraryElement;
let libraryState = [];
let filterButtons = [];

export function initPromptLibrarySection() {
    promptLibraryElement = document.getElementById('prompt-library');
    if (!promptLibraryElement) return;

    filterButtons = Array.from(document.querySelectorAll('.prompt-filter-btn'));
    filterButtons.forEach((button) => {
        button.addEventListener('click', () => {
            filterButtons.forEach((btn) => {
                btn.classList.remove('active', 'bg-[#4A90E2]', 'text-white');
                btn.classList.add('bg-white', 'text-gray-700');
            });
            button.classList.add('active', 'bg-[#4A90E2]', 'text-white');
            button.classList.remove('bg-white', 'text-gray-700');
            currentFilter = button.textContent.trim();
            renderPromptLibrary();
        });
    });

    promptLibraryElement.addEventListener('click', (event) => {
        const favoriteButton = event.target.closest('[data-favorite-id]');
        if (!favoriteButton) return;
        const promptId = favoriteButton.getAttribute('data-favorite-id');
        const existing = libraryState.find((entry) => entry.type === 'favorite' && entry.originalId === promptId);
        if (existing) {
            removePromptFromLibrary(existing.id);
        } else {
            addPromptToLibrary({ type: 'favorite', originalId: promptId });
        }
    });

    onLibraryChange((library) => {
        libraryState = library;
        renderPromptLibrary();
    });

    renderPromptLibrary();
}

function renderPromptLibrary() {
    if (!promptLibraryElement) return;

    promptLibraryElement.innerHTML = '';
    const filteredPrompts = currentFilter === 'All'
        ? prompts
        : prompts.filter((prompt) => prompt.category === currentFilter);

    filteredPrompts.forEach((prompt) => {
        const isFavorited = libraryState.some((entry) => entry.type === 'favorite' && entry.originalId === prompt.id);
        const card = createPromptCard(prompt, isFavorited);
        promptLibraryElement.appendChild(card);
    });
}

function createPromptCard(prompt, isFavorited) {
    const card = document.createElement('div');
    card.className = 'prompt-card bg-white p-6 rounded-lg shadow-sm';
    card.innerHTML = `
        <div>
            <h4 class="font-bold text-lg mb-2 text-[#4A90E2]">${prompt.title}</h4>
            <p class="text-gray-600 text-sm">${prompt.content}</p>
        </div>
        <div class="mt-4 pt-4 border-t border-gray-100 flex justify-end items-center">
            <svg data-favorite-id="${prompt.id}" class="favorite-btn h-6 w-6 ${isFavorited ? 'favorited' : ''}" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
            </svg>
        </div>
    `;
    return card;
}
