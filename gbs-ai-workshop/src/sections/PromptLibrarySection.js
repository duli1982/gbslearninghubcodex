import { PromptExplorer } from '../components/PromptExplorer.js';
import { loadPromptsData } from '../data/loaders.js';
import { addPromptToLibrary, removePromptFromLibrary, onLibraryChange } from '../services/firebaseService.js';

let promptExplorer;
let unsubscribeLibrary = null;

export function initPromptLibrarySection() {
    if (!promptExplorer) {
        promptExplorer = new PromptExplorer({
            containerId: 'prompt-library',
            filterButtonSelector: '.prompt-filter-btn',
            loadPrompts: loadPromptsData,
            onAddFavorite: (promptId) => {
                addPromptToLibrary({ type: 'favorite', originalId: promptId });
            },
            onRemoveFavorite: (libraryId) => {
                removePromptFromLibrary(libraryId);
            }
        });
    }

    void promptExplorer.init();

    if (!unsubscribeLibrary) {
        unsubscribeLibrary = onLibraryChange((library) => {
            promptExplorer?.setLibrary(library);
        });
    }
}
