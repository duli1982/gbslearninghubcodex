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

        const metaPrompt = `You are an expert in prompt engineering. Analyze the following text and generate a high-quality, effective prompt that could have been used to create it. Break down your reasoning, explaining why the prompt you created is effective. The prompt should be structured to include: 1. A clear persona (e.g., 'Act as a...'). 2. A specific task or goal. 3. Instructions on tone and format if they can be inferred from the text. Return your response as a JSON object with two keys: "generated_prompt" and "explanation".\n\nText to analyze:\n---\n${inputText}\n---`;

        try {
            const apiKey = '';
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            const payload = { contents: [{ role: 'user', parts: [{ text: metaPrompt }] }] };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const result = await response.json();
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
                errorContainer.textContent = 'Sorry, something went wrong while generating the prompt. Please try again.';
                errorContainer.classList.remove('hidden');
            }
        } finally {
            spinner?.classList.add('hidden');
        }
    });
}
