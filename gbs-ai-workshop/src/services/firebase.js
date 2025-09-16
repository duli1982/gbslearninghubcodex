import { initializeApp } from "../../../shared/vendor/firebase/firebase-app.js";
import { getAuth } from "../../../shared/vendor/firebase/firebase-auth.js";
import { getFirestore } from "../../../shared/vendor/firebase/firebase-firestore.js";

const REQUIRED_CONFIG_FIELDS = ["apiKey", "authDomain", "projectId"];

let cachedEnvironment = null;
let cachedConfig = null;
let firebaseAppInstance = null;
let firebaseAuthInstance = null;
let firebaseDbInstance = null;
let initializationError = null;

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

function sanitizeConfig(rawEnv) {
    const config = {
        apiKey: rawEnv.FIREBASE_API_KEY,
        authDomain: rawEnv.FIREBASE_AUTH_DOMAIN,
        projectId: rawEnv.FIREBASE_PROJECT_ID,
        appId: rawEnv.FIREBASE_APP_ID,
        databaseURL: rawEnv.FIREBASE_DATABASE_URL,
        storageBucket: rawEnv.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: rawEnv.FIREBASE_MESSAGING_SENDER_ID,
        measurementId: rawEnv.FIREBASE_MEASUREMENT_ID
    };

    return Object.fromEntries(
        Object.entries(config).filter(([, value]) => value !== undefined && value !== null && String(value).length > 0)
    );
}

function resolveConfig() {
    if (!cachedConfig) {
        cachedConfig = sanitizeConfig(resolveEnvironment());
    }
    return cachedConfig;
}

function validateConfig(config) {
    const missing = REQUIRED_CONFIG_FIELDS.filter((field) => !config[field]);
    if (missing.length > 0) {
        const error = new Error(`Missing Firebase configuration values: ${missing.join(", ")}`);
        error.code = "firebase/missing-config";
        error.missing = missing;
        throw error;
    }
}

export function getFirebaseEnvironment() {
    return { ...resolveEnvironment() };
}

export function getFirebaseConfig() {
    return { ...resolveConfig() };
}

export function getAppIdentifier() {
    const env = resolveEnvironment();
    return env.APP_ID || env.FIREBASE_APP_IDENTIFIER || "gbs-gemini-training";
}

export function getCollectionRoot() {
    const env = resolveEnvironment();
    return env.FIREBASE_COLLECTION_ROOT || "artifacts";
}

export function ensureFirebase() {
    if (firebaseAppInstance) {
        return {
            app: firebaseAppInstance,
            auth: firebaseAuthInstance,
            db: firebaseDbInstance,
            config: getFirebaseConfig()
        };
    }

    if (initializationError) {
        throw initializationError;
    }

    const config = resolveConfig();

    try {
        validateConfig(config);
    } catch (error) {
        initializationError = error;
        throw error;
    }

    try {
        firebaseAppInstance = initializeApp(config);
        firebaseAuthInstance = getAuth(firebaseAppInstance);
        firebaseDbInstance = getFirestore(firebaseAppInstance);
    } catch (error) {
        initializationError = error;
        throw error;
    }

    return {
        app: firebaseAppInstance,
        auth: firebaseAuthInstance,
        db: firebaseDbInstance,
        config: getFirebaseConfig()
    };
}

export function getFirebaseApp() {
    return ensureFirebase().app;
}

export function getFirebaseAuth() {
    return ensureFirebase().auth;
}

export function getFirebaseDb() {
    return ensureFirebase().db;
}
