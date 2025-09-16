import { addPromptToLibrary } from '../services/firebaseService.js';

export function initPromptBuilderSection() {
    const generatePromptBtn = document.getElementById('generatePromptBtn');
    const saveToLibraryBtn = document.getElementById('saveToLibraryBtn');
    const copyPromptBtn = document.getElementById('copyPromptBtn');

    if (generatePromptBtn) {
        generatePromptBtn.addEventListener('click', () => {
            const goal = document.getElementById('promptGoal')?.value ?? '';
            const audience = document.getElementById('promptAudience')?.value ?? '';
            const tone = document.getElementById('promptTone')?.value ?? '';
            const format = document.getElementById('promptFormat')?.value ?? '';
            const context = document.getElementById('promptContext')?.value.trim() ?? '';

            if (!context) {
                console.warn('Please provide some context for your prompt.');
                return;
            }

            const promptText = `Act as an expert GBS Manager. Your task is to ${goal.toLowerCase()}. The audience is ${audience.toLowerCase()}. The tone of the response should be ${tone.toLowerCase()} and the output must be in the format of ${format.toLowerCase()}.\n\nBased on these requirements, please process the following context:\n\n---\n${context}\n---`;

            const outputElement = document.getElementById('generatedPromptOutput');
            if (outputElement) {
                outputElement.textContent = promptText;
            }

            const container = document.getElementById('generatedPromptContainer');
            container?.classList.remove('hidden');
        });
    }

    if (saveToLibraryBtn) {
        saveToLibraryBtn.addEventListener('click', () => {
            const content = document.getElementById('generatedPromptOutput')?.textContent;
            const title = document.getElementById('promptGoal')?.value ?? '';

            if (!content) return;

            addPromptToLibrary({
                type: 'custom',
                title: `Custom: ${title}`,
                content,
                createdAt: new Date().toISOString()
            });

            saveToLibraryBtn.textContent = 'Saved!';
            setTimeout(() => {
                saveToLibraryBtn.textContent = 'Save';
            }, 2000);
        });
    }

    if (copyPromptBtn) {
        copyPromptBtn.addEventListener('click', () => {
            const textToCopy = document.getElementById('generatedPromptOutput')?.textContent ?? '';
            navigator.clipboard.writeText(textToCopy).then(() => {
                copyPromptBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyPromptBtn.textContent = 'Copy';
                }, 2000);
            }).catch((error) => {
                console.error('Failed to copy text:', error);
            });
        });
    }
}
