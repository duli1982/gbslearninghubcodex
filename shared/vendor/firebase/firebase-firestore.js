const STORAGE_KEY = '__offline_firestore_store__';
const listeners = new Map();
let memoryStore = {};

function getStorage() {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            return window.localStorage;
        }
    } catch (error) {
        console.warn('Local Firestore storage unavailable:', error);
    }
    return null;
}

function readStore() {
    const storage = getStorage();
    if (!storage) {
        return { ...memoryStore };
    }
    try {
        const raw = storage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            memoryStore = parsed;
            return { ...parsed };
        }
    } catch (error) {
        console.warn('Failed to parse cached Firestore data:', error);
    }
    return { ...memoryStore };
}

function writeStore(store) {
    memoryStore = store;
    const storage = getStorage();
    if (storage) {
        try {
            storage.setItem(STORAGE_KEY, JSON.stringify(store));
        } catch (error) {
            console.warn('Failed to persist Firestore data:', error);
        }
    }
}

function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
}

function ensureLeadingSlash(path) {
    return path.startsWith('/') ? path : `/${path}`;
}

function normalizeCollectionPath(path) {
    const cleaned = ensureLeadingSlash(String(path || '')).replace(/\/+/g, '/');
    return cleaned.endsWith('/') ? cleaned.slice(0, -1) : cleaned;
}

function normalizeDocPath(path) {
    return normalizeCollectionPath(path);
}

function splitDocPath(path) {
    const normalized = normalizeDocPath(path);
    const segments = normalized.split('/').filter(Boolean);
    const docId = segments.pop();
    if (!docId) {
        throw new Error(`Invalid document path: ${path}`);
    }
    const collectionPath = `/${segments.join('/')}`;
    return { collectionPath, docId };
}

function getCollectionStore(path) {
    const store = readStore();
    const collectionPath = normalizeCollectionPath(path);
    return { store, collectionPath, docs: store[collectionPath] || {} };
}

function saveCollection(store, collectionPath, docs) {
    store[collectionPath] = docs;
    writeStore(store);
    notify(collectionPath);
}

function notify(path) {
    const callbacks = listeners.get(path);
    if (!callbacks) return;
    const snapshot = createSnapshot(path);
    callbacks.forEach((cb) => {
        try {
            cb(snapshot);
        } catch (error) {
            console.error('Firestore listener error:', error);
        }
    });
}

function createSnapshot(path) {
    const { docs } = getCollectionStore(path);
    const entries = Object.entries(docs).map(([id, value]) => new QueryDocumentSnapshot(id, clone(value)));
    return new QuerySnapshot(entries);
}

class QueryDocumentSnapshot {
    constructor(id, data) {
        this.id = id;
        this._data = data;
    }

    data() {
        return clone(this._data);
    }
}

class QuerySnapshot {
    constructor(docs) {
        this.docs = docs;
    }

    forEach(callback) {
        this.docs.forEach((doc) => callback(doc));
    }
}

function generateId() {
    return `doc-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export function getFirestore(app) {
    return { app };
}

export function collection(db, path) {
    return { type: 'collection', path: normalizeCollectionPath(path) };
}

export function doc(db, path) {
    return { type: 'doc', path: normalizeDocPath(path) };
}

export function query(collectionRef, ...constraints) {
    if (constraints.length) {
        console.warn('Query constraints are not supported in the offline Firestore shim.');
    }
    return { type: 'query', path: collectionRef.path };
}

export function where() {
    console.warn('where() constraints are not supported in the offline Firestore shim.');
    return { unsupported: true };
}

export async function getDoc(docRef) {
    const { collectionPath, docId } = splitDocPath(docRef.path || docRef);
    const { docs } = getCollectionStore(collectionPath);
    const record = docs[docId];
    return {
        exists: () => Boolean(record),
        id: docId,
        data: () => (record ? clone(record) : undefined)
    };
}

export async function getDocs(queryRef) {
    return createSnapshot(queryRef.path || queryRef);
}

export async function addDoc(collectionRef, data) {
    const { store, collectionPath, docs } = getCollectionStore(collectionRef.path || collectionRef);
    const id = generateId();
    docs[id] = clone(data);
    saveCollection(store, collectionPath, docs);
    return { id };
}

export async function setDoc(docRef, data) {
    const { store, collectionPath, docs } = getCollectionStore(docRef.path || docRef);
    const { docId } = splitDocPath(docRef.path || docRef);
    docs[docId] = clone(data);
    saveCollection(store, collectionPath, docs);
}

export async function updateDoc(docRef, data) {
    const { store, collectionPath, docs } = getCollectionStore(docRef.path || docRef);
    const { docId } = splitDocPath(docRef.path || docRef);
    if (!docs[docId]) {
        throw new Error(`Document at ${docRef.path || docRef} does not exist.`);
    }
    docs[docId] = { ...docs[docId], ...clone(data) };
    saveCollection(store, collectionPath, docs);
}

export async function deleteDoc(docRef) {
    const { store, collectionPath, docs } = getCollectionStore(docRef.path || docRef);
    const { docId } = splitDocPath(docRef.path || docRef);
    if (docs[docId]) {
        delete docs[docId];
        saveCollection(store, collectionPath, docs);
    }
}

export function onSnapshot(queryRef, callback) {
    if (typeof callback !== 'function') {
        throw new Error('onSnapshot requires a callback function.');
    }
    const path = queryRef.path || queryRef;
    const normalized = normalizeCollectionPath(path);
    if (!listeners.has(normalized)) {
        listeners.set(normalized, new Set());
    }
    const set = listeners.get(normalized);
    set.add(callback);
    setTimeout(() => callback(createSnapshot(normalized)), 0);
    return () => {
        const callbacks = listeners.get(normalized);
        if (!callbacks) return;
        callbacks.delete(callback);
        if (callbacks.size === 0) {
            listeners.delete(normalized);
        }
    };
}

export function collectionGroup() {
    throw new Error('collectionGroup queries are not supported in the offline Firestore shim.');
}
