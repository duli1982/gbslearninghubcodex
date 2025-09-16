export function initializeApp(config = {}) {
    if (typeof config !== 'object' || config === null) {
        throw new Error('Firebase configuration must be an object.');
    }
    return { config };
}
