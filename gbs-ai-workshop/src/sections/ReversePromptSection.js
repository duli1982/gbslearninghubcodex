import { generateContent, buildReversePromptPayload } from '../services/aiService.js';

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
        errorContainer?.classList.add('hidden');

        try {
            const payload = buildReversePromptPayload(inputText);
            const result = await generateContent(payload);
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
            console.error('Reverse prompt generation failed:', error);
            if (errorContainer) {
                if (error?.code === 'ai/missing-api-key') {
                    errorContainer.textContent = 'The AI service has not been configured. Please contact your administrator.';
                } else {
                    errorContainer.textContent = 'Sorry, something went wrong while generating the prompt. Please try again.';
                }
                errorContainer.classList.remove('hidden');
            }
        } finally {
            spinner?.classList.add('hidden');
        }
    });
}
