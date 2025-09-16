const STORAGE_KEY = '__offline_firebase_auth__';
const authState = {
    user: null,
    listeners: new Set(),
    authInstances: new Set()
};

function getStorage() {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            return window.localStorage;
        }
    } catch (error) {
        console.warn('Local auth storage unavailable:', error);
    }
    return null;
}

function loadUser() {
    const storage = getStorage();
    if (!storage) return authState.user;
    try {
        const raw = storage.getItem(STORAGE_KEY);
        if (raw) {
            return JSON.parse(raw);
        }
    } catch (error) {
        console.warn('Failed to read cached auth user:', error);
    }
    return authState.user;
}

function persistUser(user) {
    authState.user = user;
    const storage = getStorage();
    if (storage) {
        try {
            if (user) {
                storage.setItem(STORAGE_KEY, JSON.stringify(user));
            } else {
                storage.removeItem(STORAGE_KEY);
            }
        } catch (error) {
            console.warn('Failed to persist auth user:', error);
        }
    }
    for (const instance of authState.authInstances) {
        instance.currentUser = user;
    }
    for (const listener of authState.listeners) {
        try {
            listener(user);
        } catch (error) {
            console.error('Auth listener error:', error);
        }
    }
}

function ensureUser() {
    if (authState.user == null) {
        authState.user = loadUser();
    }
    return authState.user;
}

function createAuthObject(app) {
    const auth = { app, currentUser: ensureUser() };
    authState.authInstances.add(auth);
    return auth;
}

function randomId(prefix) {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function tokenHash(token) {
    let hash = 0;
    for (let i = 0; i < token.length; i += 1) {
        hash = (hash * 31 + token.charCodeAt(i)) >>> 0;
    }
    return hash.toString(16);
}

export function getAuth(app) {
    return createAuthObject(app);
}

export function onAuthStateChanged(auth, callback) {
    if (typeof callback !== 'function') {
        throw new Error('onAuthStateChanged requires a callback function.');
    }
    authState.listeners.add(callback);
    const current = ensureUser();
    setTimeout(() => callback(current), 0);
    return () => {
        authState.listeners.delete(callback);
    };
}

export async function signInAnonymously(auth) {
    if (!auth) {
        throw new Error('Auth instance is required.');
    }
    const existing = loadUser();
    const user = existing || { uid: randomId('anon'), isAnonymous: true };
    persistUser(user);
    return { user };
}

export async function signInWithCustomToken(auth, token) {
    if (!auth) {
        throw new Error('Auth instance is required.');
    }
    if (!token) {
        throw new Error('A custom token must be provided.');
    }
    const user = { uid: `custom-${tokenHash(String(token))}`, isAnonymous: false };
    persistUser(user);
    return { user };
}
