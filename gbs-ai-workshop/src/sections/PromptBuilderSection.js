import { PromptBuilder } from '../components/PromptBuilder.js';
import { addPromptToLibrary } from '../services/firebaseService.js';

let promptBuilder;

export function initPromptBuilderSection() {
    if (!promptBuilder) {
        promptBuilder = new PromptBuilder({
            fieldIds: {
                goal: 'promptGoal',
                audience: 'promptAudience',
                tone: 'promptTone',
                format: 'promptFormat',
                context: 'promptContext'
            },
            outputId: 'generatedPromptOutput',
            outputContainerId: 'generatedPromptContainer',
            buttons: {
                generate: 'generatePromptBtn',
                save: 'saveToLibraryBtn',
                copy: 'copyPromptBtn'
            },
            onSave: async ({ title, content }) => {
                await addPromptToLibrary({
                    type: 'custom',
                    title,
                    content,
                    createdAt: new Date().toISOString()
                });
            }
        });
    }

    promptBuilder.init();
}
