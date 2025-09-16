const DEFAULT_BUTTON_RESET_DELAY = 2000;

export class PromptBuilder {
    constructor({
        fieldIds = {},
        outputId,
        outputContainerId,
        buttons = {},
        onSave
    } = {}) {
        this.fieldIds = {
            goal: fieldIds.goal ?? null,
            audience: fieldIds.audience ?? null,
            tone: fieldIds.tone ?? null,
            format: fieldIds.format ?? null,
            context: fieldIds.context ?? null
        };

        this.outputId = outputId;
        this.outputContainerId = outputContainerId;
        this.buttonIds = {
            generate: buttons.generate ?? null,
            save: buttons.save ?? null,
            copy: buttons.copy ?? null
        };

        this.handlers = {
            onSave: typeof onSave === 'function' ? onSave : null
        };

        this.elements = {
            fields: {},
            output: null,
            outputContainer: null,
            buttons: {}
        };

        this.initialized = false;

        this.handleGenerate = this.handleGenerate.bind(this);
        this.handleSave = this.handleSave.bind(this);
        this.handleCopy = this.handleCopy.bind(this);
    }

    init() {
        if (this.initialized) return;

        this.captureElements();
        this.attachEventListeners();

        this.initialized = true;
    }

    captureElements() {
        Object.entries(this.fieldIds).forEach(([key, id]) => {
            if (id) {
                this.elements.fields[key] = document.getElementById(id);
            }
        });

        if (this.outputId) {
            this.elements.output = document.getElementById(this.outputId);
        }

        if (this.outputContainerId) {
            this.elements.outputContainer = document.getElementById(this.outputContainerId);
        }

        Object.entries(this.buttonIds).forEach(([key, id]) => {
            if (id) {
                this.elements.buttons[key] = document.getElementById(id);
            }
        });
    }

    attachEventListeners() {
        const { generate, save, copy } = this.elements.buttons;

        generate?.addEventListener('click', this.handleGenerate);
        save?.addEventListener('click', this.handleSave);
        copy?.addEventListener('click', this.handleCopy);
    }

    handleGenerate() {
        const goal = this.getFieldValue('goal');
        const audience = this.getFieldValue('audience');
        const tone = this.getFieldValue('tone');
        const format = this.getFieldValue('format');
        const context = this.getFieldValue('context').trim();

        if (!context) {
            console.warn('Please provide some context for your prompt.');
            return;
        }

        const promptText = this.buildPrompt({ goal, audience, tone, format, context });
        if (this.elements.output) {
            this.elements.output.textContent = promptText;
        }

        this.elements.outputContainer?.classList.remove('hidden');
    }

    async handleSave() {
        if (!this.handlers.onSave) return;

        const content = this.elements.output?.textContent?.trim();
        if (!content) return;

        const goal = this.getFieldValue('goal');
        const button = this.elements.buttons.save;
        const originalText = button?.textContent ?? '';

        try {
            await this.handlers.onSave({
                title: goal ? `Custom: ${goal}` : 'Custom Prompt',
                content
            });

            if (button) {
                button.textContent = 'Saved!';
                setTimeout(() => {
                    button.textContent = originalText || 'Save';
                }, DEFAULT_BUTTON_RESET_DELAY);
            }
        } catch (error) {
            console.error('Failed to save prompt to library', error);
            if (button) {
                button.textContent = 'Try Again';
                setTimeout(() => {
                    button.textContent = originalText || 'Save';
                }, DEFAULT_BUTTON_RESET_DELAY);
            }
        }
    }

    handleCopy() {
        const content = this.elements.output?.textContent ?? '';
        if (!content) return;

        const button = this.elements.buttons.copy;
        const originalText = button?.textContent ?? '';

        if (typeof navigator === 'undefined'
            || !navigator.clipboard
            || typeof navigator.clipboard.writeText !== 'function') {
            console.error('Clipboard API is not available in this browser.');
            return;
        }

        navigator.clipboard.writeText(content).then(() => {
            if (button) {
                button.textContent = 'Copied!';
                setTimeout(() => {
                    button.textContent = originalText || 'Copy';
                }, DEFAULT_BUTTON_RESET_DELAY);
            }
        }).catch((error) => {
            console.error('Failed to copy text:', error);
        });
    }

    getFieldValue(fieldKey) {
        const field = this.elements.fields[fieldKey];
        if (!field) return '';
        if ('value' in field) {
            return field.value ?? '';
        }
        return '';
    }

    buildPrompt({ goal = '', audience = '', tone = '', format = '', context = '' }) {
        return `Act as an expert GBS Manager. Your task is to ${goal.toLowerCase()}. The audience is ${audience.toLowerCase()}. The tone of the response should be ${tone.toLowerCase()} and the output must be in the format of ${format.toLowerCase()}.

Based on these requirements, please process the following context:

---
${context}
---`;
    }
}
