/**
 * StorageManager centralizes access to sessionStorage and normalizes the
 * configuration used across learning hub experiences.
 *
 * Default keys:
 * - MAIN_PAGE_SCROLL: stores the scroll position of the landing page ("mainPageScrollPosition").
 * - GENERAL_SCROLL: legacy scroll position key retained for compatibility ("scrollPosition").
 * - CURRENT_MODULE: keeps track of the active module in the RPO training experience ("currentModuleId").
 *
 * Default offsets:
 * - SCROLL_RESTORE: 100 pixels are subtracted when restoring the main page scroll position to provide visual context above the target.
 */

const DEFAULT_KEYS = Object.freeze({
    MAIN_PAGE_SCROLL: 'mainPageScrollPosition',
    GENERAL_SCROLL: 'scrollPosition',
    CURRENT_MODULE: 'currentModuleId'
});

const DEFAULT_OFFSETS = Object.freeze({
    SCROLL_RESTORE: 100
});

const isBrowserEnvironment = typeof window !== 'undefined';

const storage = (() => {
    if (!isBrowserEnvironment) {
        return null;
    }

    try {
        const { sessionStorage } = window;
        const testKey = '__storage_test__';
        sessionStorage.setItem(testKey, testKey);
        sessionStorage.removeItem(testKey);
        return sessionStorage;
    } catch (error) {
        return null;
    }
})();

const safeSetItem = (key, value) => {
    if (!storage) {
        return;
    }

    try {
        storage.setItem(key, String(value));
    } catch (error) {
        // Ignore storage errors to avoid breaking navigation in private browsing modes.
    }
};

const safeGetItem = key => {
    if (!storage) {
        return null;
    }

    try {
        return storage.getItem(key);
    } catch (error) {
        return null;
    }
};

const safeRemoveItem = key => {
    if (!storage) {
        return;
    }

    try {
        storage.removeItem(key);
    } catch (error) {
        // Ignore removal issues for consistency with set operations.
    }
};

const StorageManager = {
    keys: DEFAULT_KEYS,
    offsets: DEFAULT_OFFSETS,
    scroll: {
        save(position = isBrowserEnvironment ? window.scrollY : 0) {
            const normalizedPosition = Number.isFinite(position) ? position : parseInt(position, 10);
            const value = Number.isFinite(normalizedPosition) ? Math.max(normalizedPosition, 0) : 0;

            safeSetItem(DEFAULT_KEYS.MAIN_PAGE_SCROLL, value);
            safeSetItem(DEFAULT_KEYS.GENERAL_SCROLL, value);
        },
        restore({ apply = true, offset = DEFAULT_OFFSETS.SCROLL_RESTORE } = {}) {
            const storedValue = safeGetItem(DEFAULT_KEYS.MAIN_PAGE_SCROLL);
            if (storedValue === null) {
                return null;
            }

            const parsed = parseInt(storedValue, 10);
            if (!Number.isFinite(parsed)) {
                return null;
            }

            const targetPosition = Math.max(parsed - offset, 0);

            safeRemoveItem(DEFAULT_KEYS.GENERAL_SCROLL);

            if (apply && isBrowserEnvironment && typeof window.scrollTo === 'function') {
                window.scrollTo(0, targetPosition);
            }

            return targetPosition;
        }
    },
    module: {
        setCurrent(moduleId) {
            if (typeof moduleId !== 'string' || !moduleId) {
                return;
            }

            safeSetItem(DEFAULT_KEYS.CURRENT_MODULE, moduleId);
        },
        getCurrent() {
            return safeGetItem(DEFAULT_KEYS.CURRENT_MODULE);
        },
        clear() {
            safeRemoveItem(DEFAULT_KEYS.CURRENT_MODULE);
        }
    }
};

export default StorageManager;
