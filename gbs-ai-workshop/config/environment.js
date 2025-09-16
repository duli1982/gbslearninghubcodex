// This file exposes build-time environment variables to the browser. It is
// populated during the deployment/build step so that client-side code can read
// configuration without hard-coding secrets.
(function exposeEnvironment(global) {
    const processEnv = (typeof process !== 'undefined' && process?.env) || {};
    const existingEnv = (typeof global !== 'undefined' && typeof global.__ENV__ === 'object' && global.__ENV__) || {};

    const resolvedEnv = {
        FIREBASE_API_KEY: processEnv.FIREBASE_API_KEY ?? existingEnv.FIREBASE_API_KEY ?? '',
        FIREBASE_AUTH_DOMAIN: processEnv.FIREBASE_AUTH_DOMAIN ?? existingEnv.FIREBASE_AUTH_DOMAIN ?? '',
        FIREBASE_PROJECT_ID: processEnv.FIREBASE_PROJECT_ID ?? existingEnv.FIREBASE_PROJECT_ID ?? '',
        FIREBASE_APP_ID: processEnv.FIREBASE_APP_ID ?? existingEnv.FIREBASE_APP_ID ?? '',
        FIREBASE_DATABASE_URL: processEnv.FIREBASE_DATABASE_URL ?? existingEnv.FIREBASE_DATABASE_URL ?? '',
        FIREBASE_STORAGE_BUCKET: processEnv.FIREBASE_STORAGE_BUCKET ?? existingEnv.FIREBASE_STORAGE_BUCKET ?? '',
        FIREBASE_MESSAGING_SENDER_ID: processEnv.FIREBASE_MESSAGING_SENDER_ID ?? existingEnv.FIREBASE_MESSAGING_SENDER_ID ?? '',
        FIREBASE_MEASUREMENT_ID: processEnv.FIREBASE_MEASUREMENT_ID ?? existingEnv.FIREBASE_MEASUREMENT_ID ?? '',
        FIREBASE_COLLECTION_ROOT: processEnv.FIREBASE_COLLECTION_ROOT ?? existingEnv.FIREBASE_COLLECTION_ROOT ?? 'artifacts',
        APP_ID: processEnv.APP_ID ?? existingEnv.APP_ID ?? existingEnv.FIREBASE_APP_IDENTIFIER ?? '',
        GOOGLE_AI_API_KEY: processEnv.GOOGLE_AI_API_KEY ?? processEnv.AI_API_KEY ?? existingEnv.GOOGLE_AI_API_KEY ?? '',
        GOOGLE_AI_API_URL: processEnv.GOOGLE_AI_API_URL ?? processEnv.AI_API_URL ?? existingEnv.GOOGLE_AI_API_URL ?? '',
        GOOGLE_AI_MODEL: processEnv.GOOGLE_AI_MODEL ?? processEnv.AI_MODEL ?? existingEnv.GOOGLE_AI_MODEL ?? 'gemini-2.0-flash'
    };

    global.__ENV__ = resolvedEnv;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
