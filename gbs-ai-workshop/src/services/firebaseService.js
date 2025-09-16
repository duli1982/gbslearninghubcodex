import { ensureFirebase, getAppIdentifier, getCollectionRoot, getFirebaseEnvironment } from "./firebase.js";
import { ErrorBoundary } from "../components/common/ErrorBoundary.js";
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

const DEFAULT_FIREBASE_MESSAGE = "We couldn't connect to your workspace right now. Please try again later.";

let firebaseBoundary = new ErrorBoundary({
    id: 'firebase-service',
    fallbackMessage: DEFAULT_FIREBASE_MESSAGE
});

function notifyLibraryListeners() {
    const snapshot = state.userLibrary.map(entry => ({ ...entry }));
    libraryListeners.forEach((callback) => {
        if (typeof callback !== 'function') return;
        try {
            callback(snapshot);
        } catch (error) {
            firebaseBoundary.capture(error, {
                message: 'We hit a snag while updating your prompt library. Refresh the page to sync your changes.',
                context: { scope: 'firebase.library.listener' }
            });
        }
    });
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

    state.unsubscribe = onSnapshot(
        promptsQuery,
        (querySnapshot) => {
            const entries = [];
            querySnapshot.forEach((docSnapshot) => {
                entries.push({ id: docSnapshot.id, ...docSnapshot.data() });
            });
            state.userLibrary = entries;
            notifyLibraryListeners();
        },
        (error) => {
            firebaseBoundary.capture(error, {
                message: 'We lost connection to your prompt library. Please refresh to reload your saved items.',
                context: { scope: 'firebase.library.snapshot' }
            });
        }
    );
}

export async function initFirebase({ boundary } = {}) {
    if (boundary && typeof boundary.capture === 'function') {
        firebaseBoundary = boundary;
    }

    state.appId = getAppIdentifier() || 'gbs-gemini-training';
    state.collectionRoot = getCollectionRoot() || 'artifacts';

    let firebaseInstances;
    try {
        firebaseInstances = ensureFirebase();
    } catch (initializationError) {
        if (initializationError?.code === 'firebase/missing-config' && Array.isArray(initializationError.missing)) {
            firebaseBoundary.capture(initializationError, {
                message: `We couldn't connect to your workspace because the Firebase configuration is missing: ${initializationError.missing.join(', ')}. Please contact your administrator.`,
                context: { scope: 'firebase.init', reason: 'missing-config' }
            });
        } else {
            firebaseBoundary.capture(initializationError, {
                message: "We couldn't connect to your workspace because the Firebase configuration is invalid. Please contact your administrator.",
                context: { scope: 'firebase.init', reason: 'invalid-config' }
            });
        }
        return null;
    }

    firebaseBoundary.clear();

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
        firebaseBoundary.capture(authError, {
            message: "We couldn't verify your workspace access right now. Please refresh and try again.",
            context: { scope: 'firebase.auth' }
        });
        return null;
    }

    return firebaseInstances;
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
    await firebaseBoundary.guardAsync(
        async () => {
            await addDoc(collection(state.db, collectionPath), promptData);
        },
        {
            message: "We couldn't save that prompt to your library. Please try again.",
            rethrow: false,
            context: {
                scope: 'firebase.library.add',
                path: collectionPath,
                promptId: promptData?.id ?? promptData?.originalId ?? null
            },
            clearOnSuccess: false
        }
    );
}

export async function removePromptFromLibrary(promptId) {
    if (!state.db || !state.userId || !promptId) return;
    const collectionPath = getPromptsCollectionPath();
    if (!collectionPath) return;
    const docPath = `${collectionPath}/${promptId}`;
    await firebaseBoundary.guardAsync(
        async () => {
            await deleteDoc(doc(state.db, docPath));
        },
        {
            message: "We couldn't remove that prompt from your library. Please refresh and try again.",
            rethrow: false,
            context: { scope: 'firebase.library.remove', path: docPath, promptId },
            clearOnSuccess: false
        }
    );
}

export function getUserLibrary() {
    return state.userLibrary.map(entry => ({ ...entry }));
}
