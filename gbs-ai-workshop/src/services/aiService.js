const DEFAULT_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_MODEL = "gemini-2.0-flash";

let cachedEnvironment = null;

function resolveEnvironment() {
    if (cachedEnvironment) {
        return cachedEnvironment;
    }

    const env = {};

    if (typeof process !== "undefined" && process?.env) {
        for (const [key, value] of Object.entries(process.env)) {
            if (typeof value !== "undefined") {
                env[key] = value;
            }
        }
    }

    const globalEnv = typeof globalThis !== "undefined" && typeof globalThis.__ENV__ === "object"
        ? globalThis.__ENV__
        : null;

    if (globalEnv) {
        Object.assign(env, globalEnv);
    }

    cachedEnvironment = env;
    return cachedEnvironment;
}

export function getAiEnvironment() {
    return { ...resolveEnvironment() };
}

export function getAiConfig() {
    const env = resolveEnvironment();
    return {
        apiKey: env.GOOGLE_AI_API_KEY || env.AI_API_KEY || "",
        apiBaseUrl: env.GOOGLE_AI_API_URL || env.AI_API_URL || DEFAULT_API_BASE_URL,
        model: env.GOOGLE_AI_MODEL || env.AI_MODEL || DEFAULT_MODEL
    };
}

function buildRequestUrl(config) {
    if (!config.apiKey) {
        const error = new Error("Missing Google AI API key");
        error.code = "ai/missing-api-key";
        throw error;
    }

    const normalizedBaseUrl = config.apiBaseUrl.replace(/\/+$/, "");
    const normalizedModel = config.model.replace(/^models\//, "");

    return `${normalizedBaseUrl}/models/${normalizedModel}:generateContent?key=${encodeURIComponent(config.apiKey)}`;
}

export async function generateContent(promptOrPayload, options = {}) {
    const config = getAiConfig();
    const url = buildRequestUrl(config);

    const fetchImpl = options.fetchImpl || (typeof fetch === "function" ? fetch : null);
    if (typeof fetchImpl !== "function") {
        throw new Error("A fetch implementation is required to call the AI service.");
    }

    const payload = typeof promptOrPayload === "string"
        ? { contents: [{ role: "user", parts: [{ text: promptOrPayload }]}] }
        : promptOrPayload;

    if (!payload || typeof payload !== "object") {
        throw new Error("A valid payload must be provided to the AI service.");
    }

    const response = await fetchImpl(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        },
        body: JSON.stringify(payload),
        signal: options.signal
    });

    if (!response.ok) {
        let errorBody = null;
        try {
            errorBody = await response.text();
        } catch (readError) {
            // Ignore body read errors and fall back to status message only.
        }

        const error = new Error(`AI request failed with status ${response.status}`);
        error.status = response.status;
        error.statusText = response.statusText;
        if (errorBody) {
            error.body = errorBody;
        }
        throw error;
    }

    return response.json();
}

export function buildReversePromptPayload(inputText) {
    const metaPrompt = `You are an expert in prompt engineering. Analyze the following text and generate a high-quality, effective prompt that could have been used to create it. Break down your reasoning, explaining why the prompt you created is effective. The prompt should be structured to include: 1. A clear persona (e.g., 'Act as a...'). 2. A specific task or goal. 3. Instructions on tone and format if they can be inferred from the text. Return your response as a JSON object with two keys: "generated_prompt" and "explanation".\n\nText to analyze:\n---\n${inputText}\n---`;

    return {
        contents: [
            {
                role: "user",
                parts: [{ text: metaPrompt }]
            }
        ]
    };
}
