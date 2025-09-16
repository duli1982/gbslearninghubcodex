import { initializeApp } from "../../../shared/scripts/vendor/firebase/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "../../../shared/scripts/vendor/firebase/firebase-auth.js";
import { getFirestore, addDoc, deleteDoc, collection, query, onSnapshot, doc } from "../../../shared/scripts/vendor/firebase/firebase-firestore.js";

const state = {
    db: null,
    auth: null,
    userId: null,
    appId: null,
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

function subscribeToUserLibrary() {
    if (!state.db || !state.userId) return;

    resetLibrarySubscription();

    const collectionPath = `/artifacts/${state.appId}/users/${state.userId}/prompts`;
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

    state.appId = typeof window !== 'undefined' && typeof window.__app_id !== 'undefined'
        ? window.__app_id
        : 'gbs-gemini-training';

    let firebaseConfig = null;
    if (typeof window !== 'undefined' && typeof window.__firebase_config !== 'undefined' && window.__firebase_config) {
        try {
            firebaseConfig = JSON.parse(window.__firebase_config);
        } catch (parseError) {
            setError("We couldn't connect to your workspace because the configuration provided is invalid. Please contact your administrator.");
            return;
        }
    }

    if (!firebaseConfig) {
        setError("We couldn't connect to your workspace because the training configuration was not provided. Please refresh the page or contact your administrator.");
        return;
    }

    const requiredFields = ['apiKey', 'authDomain', 'projectId'];
    const missingFields = requiredFields.filter((field) => !firebaseConfig[field]);
    if (missingFields.length > 0) {
        setError(`We couldn't connect to your workspace because the Firebase configuration is missing: ${missingFields.join(', ')}. Please contact your administrator.`);
        return;
    }

    let app;
    try {
        app = initializeApp(firebaseConfig);
    } catch (initializationError) {
        console.error("Firebase initialization failed:", initializationError);
        setError("We couldn't connect to your workspace because the Firebase configuration is invalid. Please contact your administrator.");
        return;
    }

    clearError();

    state.db = getFirestore(app);
    state.auth = getAuth(app);

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

    try {
        if (typeof window !== 'undefined' && typeof window.__initial_auth_token !== 'undefined' && window.__initial_auth_token) {
            await signInWithCustomToken(state.auth, window.__initial_auth_token);
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
    const collectionPath = `/artifacts/${state.appId}/users/${state.userId}/prompts`;
    try {
        await addDoc(collection(state.db, collectionPath), promptData);
    } catch (error) {
        console.error("Error adding prompt to library", error);
    }
}

export async function removePromptFromLibrary(promptId) {
    if (!state.db || !state.userId || !promptId) return;
    const docPath = `/artifacts/${state.appId}/users/${state.userId}/prompts/${promptId}`;
    try {
        await deleteDoc(doc(state.db, docPath));
    } catch (error) {
        console.error("Error removing prompt from library", error);
    }
}

export function getUserLibrary() {
    return state.userLibrary.map(entry => ({ ...entry }));
}
