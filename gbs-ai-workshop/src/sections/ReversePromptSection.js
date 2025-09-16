import { ErrorBoundary } from '../components/common/ErrorBoundary.js';
import { generateContent, buildReversePromptPayload } from '../services/aiService.js';

const reversePromptBoundary = new ErrorBoundary({
    id: 'reverse-prompt',
    fallbackMessage: 'Sorry, something went wrong while generating the prompt. Please try again.',
    renderer: ({ message }) => {
        const errorContainer = document.getElementById('reverse-prompt-error');
        if (errorContainer) {
            errorContainer.textContent = message;
            errorContainer.classList.remove('hidden');
        } else if (typeof window !== 'undefined' && typeof window.alert === 'function') {
            window.alert(message);
        }
    },
    clearRenderer: () => {
        const errorContainer = document.getElementById('reverse-prompt-error');
        if (errorContainer) {
            errorContainer.textContent = '';
            errorContainer.classList.add('hidden');
        }
    }
});

export function initReversePromptSection() {
    const generateReversePromptBtn = document.getElementById('generateReversePromptBtn');
    if (!generateReversePromptBtn) return;

    generateReversePromptBtn.addEventListener('click', async () => {
        const inputElement = document.getElementById('reversePromptInput');
        const spinner = document.getElementById('reverse-prompt-spinner');
        const outputContainer = document.getElementById('reverse-prompt-output-container');
        const errorContainer = document.getElementById('reverse-prompt-error');

        const inputText = inputElement?.value ?? '';
        if (!inputText.trim()) {
            if (errorContainer) {
                errorContainer.textContent = 'Please paste some text to analyze.';
                errorContainer.classList.remove('hidden');
            }
            return;
        }

        spinner?.classList.remove('hidden');
        outputContainer?.classList.add('hidden');
        reversePromptBoundary.clear();
        errorContainer?.classList.add('hidden');

        try {
            const payload = buildReversePromptPayload(inputText);
            const result = await generateContent(payload, { boundary: reversePromptBoundary });
            const textOutput = result?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!textOutput) {
                throw new Error('Invalid response structure from API.');
            }

            const cleanedText = textOutput.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(cleanedText);

            const promptOutput = document.getElementById('reverse-prompt-output');
            const explanationOutput = document.getElementById('reverse-prompt-explanation');
            if (promptOutput) {
                promptOutput.textContent = parsed.generated_prompt;
            }
            if (explanationOutput) {
                explanationOutput.textContent = parsed.explanation;
            }
            outputContainer?.classList.remove('hidden');
        } catch (error) {
            if (!reversePromptBoundary.hasHandled(error)) {
                const message = error?.code === 'ai/missing-api-key'
                    ? 'The AI service has not been configured. Please contact your administrator.'
                    : 'Sorry, something went wrong while generating the prompt. Please try again.';
                reversePromptBoundary.capture(error, {
                    message,
                    context: { scope: 'reverse-prompt.generate' }
                });
            }
            outputContainer?.classList.add('hidden');
        } finally {
            spinner?.classList.add('hidden');
        }
    });
}
