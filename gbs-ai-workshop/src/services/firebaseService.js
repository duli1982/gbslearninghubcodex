import { ensureFirebase, getAppIdentifier, getCollectionRoot, getFirebaseEnvironment } from "./firebase.js";
import { signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "../../../shared/vendor/firebase/firebase-auth.js";
import { addDoc, deleteDoc, collection, query, onSnapshot, doc } from "../../../shared/vendor/firebase/firebase-firestore.js";

const state = {
    db: null,
    auth: null,
    userId: null,
    appId: null,
    collectionRoot: 'artifacts',
    unsubscribe: null,
    userLibrary: []
};

const libraryListeners = new Set();
let errorHandlers = {
    onError: () => {},
    onClear: () => {}
};

function notifyLibraryListeners() {
    const snapshot = state.userLibrary.map(entry => ({ ...entry }));
    libraryListeners.forEach((callback) => {
        try {
            callback(snapshot);
        } catch (error) {
            console.error("Library listener failed", error);
        }
    });
}

function setError(message) {
    console.error(message);
    if (typeof errorHandlers.onError === 'function') {
        errorHandlers.onError(message);
    }
}

function clearError() {
    if (typeof errorHandlers.onClear === 'function') {
        errorHandlers.onClear();
    }
}

function resetLibrarySubscription() {
    if (typeof state.unsubscribe === 'function') {
        state.unsubscribe();
        state.unsubscribe = null;
    }
}

function getPromptsCollectionPath() {
    if (!state.appId || !state.userId) return null;
    const root = state.collectionRoot || 'artifacts';
    const normalizedRoot = root.startsWith('/') ? root : `/${root}`;
    return `${normalizedRoot}/${state.appId}/users/${state.userId}/prompts`;
}

function subscribeToUserLibrary() {
    if (!state.db || !state.userId) return;

    resetLibrarySubscription();

    const collectionPath = getPromptsCollectionPath();
    if (!collectionPath) return;
    const promptsQuery = query(collection(state.db, collectionPath));

    state.unsubscribe = onSnapshot(promptsQuery, (querySnapshot) => {
        const entries = [];
        querySnapshot.forEach((docSnapshot) => {
            entries.push({ id: docSnapshot.id, ...docSnapshot.data() });
        });
        state.userLibrary = entries;
        notifyLibraryListeners();
    });
}

export async function initFirebase({ onError, onClear } = {}) {
    errorHandlers = {
        onError: onError || (() => {}),
        onClear: onClear || (() => {})
    };

    state.appId = getAppIdentifier() || 'gbs-gemini-training';
    state.collectionRoot = getCollectionRoot() || 'artifacts';

    let firebaseInstances;
    try {
        firebaseInstances = ensureFirebase();
    } catch (initializationError) {
        if (initializationError?.code === 'firebase/missing-config' && Array.isArray(initializationError.missing)) {
            setError(`We couldn't connect to your workspace because the Firebase configuration is missing: ${initializationError.missing.join(', ')}. Please contact your administrator.`);
        } else {
            console.error("Firebase initialization failed:", initializationError);
            setError("We couldn't connect to your workspace because the Firebase configuration is invalid. Please contact your administrator.");
        }
        return;
    }

    clearError();

    state.db = firebaseInstances.db;
    state.auth = firebaseInstances.auth;

    onAuthStateChanged(state.auth, (user) => {
        if (user) {
            state.userId = user.uid;
            subscribeToUserLibrary();
        } else {
            state.userId = null;
            state.userLibrary = [];
            notifyLibraryListeners();
            resetLibrarySubscription();
        }
    });

    const firebaseEnv = getFirebaseEnvironment();
    const windowToken = typeof window !== 'undefined' && typeof window.__initial_auth_token !== 'undefined'
        ? window.__initial_auth_token
        : null;
    const envToken = firebaseEnv.FIREBASE_INITIAL_AUTH_TOKEN || firebaseEnv.FIREBASE_CUSTOM_TOKEN || null;
    const initialAuthToken = windowToken || envToken;

    try {
        if (initialAuthToken) {
            await signInWithCustomToken(state.auth, initialAuthToken);
        } else {
            await signInAnonymously(state.auth);
        }
    } catch (authError) {
        console.error("Authentication failed:", authError);
    }
}

export function onLibraryChange(callback) {
    if (typeof callback !== 'function') return () => {};
    libraryListeners.add(callback);
    callback(state.userLibrary.map(entry => ({ ...entry })));
    return () => {
        libraryListeners.delete(callback);
    };
}

export async function addPromptToLibrary(promptData) {
    if (!state.db || !state.userId) return;
    const collectionPath = getPromptsCollectionPath();
    if (!collectionPath) return;
    try {
        await addDoc(collection(state.db, collectionPath), promptData);
    } catch (error) {
        console.error("Error adding prompt to library", error);
    }
}

export async function removePromptFromLibrary(promptId) {
    if (!state.db || !state.userId || !promptId) return;
    const collectionPath = getPromptsCollectionPath();
    if (!collectionPath) return;
    const docPath = `${collectionPath}/${promptId}`;
    try {
        await deleteDoc(doc(state.db, docPath));
    } catch (error) {
        console.error("Error removing prompt from library", error);
    }
}

export function getUserLibrary() {
    return state.userLibrary.map(entry => ({ ...entry }));
}
