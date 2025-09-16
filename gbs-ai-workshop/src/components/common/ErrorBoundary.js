const HANDLED_SYMBOL = Symbol.for('gbslearninghub:error-boundary:handled');
let boundaryCounter = 0;

function defaultReporter(error, context = {}) {
    if (typeof console !== 'undefined' && typeof console.error === 'function') {
        const scope = context.scope ? ` [${context.scope}]` : '';
        console.error(`Error captured${scope}:`, error);
    }
}

function defaultRenderer({ message }) {
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
        window.alert(message);
    }
}

function getHandledMap(error, createIfMissing = false) {
    if (!error || (typeof error !== 'object' && typeof error !== 'function')) {
        return null;
    }

    let handledMap = error[HANDLED_SYMBOL];
    if (!handledMap && createIfMissing) {
        handledMap = new Map();
        try {
            Object.defineProperty(error, HANDLED_SYMBOL, {
                configurable: true,
                enumerable: false,
                writable: false,
                value: handledMap
            });
        } catch (defineError) {
            // If defining the property fails (e.g., frozen object), fall back to assignment.
            error[HANDLED_SYMBOL] = handledMap;
        }
    }

    return handledMap || null;
}

function resolveBoundaryId(id, name) {
    if (id) return id;
    if (name) return name;
    boundaryCounter += 1;
    return `error-boundary-${boundaryCounter}`;
}

export class ErrorBoundary {
    constructor({
        id,
        name,
        fallbackMessage = 'Something went wrong. Please try again.',
        reporter = defaultReporter,
        renderer = defaultRenderer,
        clearRenderer = null
    } = {}) {
        this.id = resolveBoundaryId(id, name);
        this.fallbackMessage = fallbackMessage;
        this.reporter = typeof reporter === 'function' ? reporter : defaultReporter;
        this.renderer = typeof renderer === 'function' ? renderer : defaultRenderer;
        this.clearRenderer = typeof clearRenderer === 'function' ? clearRenderer : null;
        this.lastError = null;
    }

    static isHandledBy(error, boundaryId) {
        const handledMap = getHandledMap(error, false);
        if (!handledMap) return false;
        return handledMap.has(boundaryId);
    }

    hasHandled(error) {
        return ErrorBoundary.isHandledBy(error, this.id);
    }

    annotateError(error, payload) {
        if (!error || (typeof error !== 'object' && typeof error !== 'function')) {
            return;
        }

        const handledMap = getHandledMap(error, true);
        handledMap.set(this.id, payload);

        if (typeof error.friendlyMessage === 'undefined' && payload?.message) {
            error.friendlyMessage = payload.message;
        }
    }

    capture(error, { message, context = {}, forceRender = false } = {}) {
        const friendlyMessage = message || this.fallbackMessage;
        const alreadyHandled = this.hasHandled(error);
        const payload = {
            message: friendlyMessage,
            context: { ...context, boundary: this.id }
        };

        this.lastError = { error, ...payload };
        this.annotateError(error, payload);

        try {
            this.reporter?.(error, { ...payload.context, message: friendlyMessage });
        } catch (reportError) {
            // Reporter failures should never break application flow.
        }

        if (!alreadyHandled || forceRender) {
            this.render(payload);
        }

        return friendlyMessage;
    }

    render(payload) {
        const renderer = this.renderer || defaultRenderer;
        if (typeof renderer === 'function') {
            try {
                renderer({ ...payload, boundary: this });
                return;
            } catch (renderError) {
                defaultReporter(renderError, { scope: `${this.id}:renderer` });
            }
        }

        if (renderer !== defaultRenderer && typeof defaultRenderer === 'function') {
            defaultRenderer({ ...payload, boundary: this });
        }
    }

    clear() {
        this.lastError = null;
        if (typeof this.clearRenderer === 'function') {
            try {
                this.clearRenderer({ boundary: this });
            } catch (clearError) {
                defaultReporter(clearError, { scope: `${this.id}:clearRenderer` });
            }
        }
    }

    guard(operation, { message, context, rethrow = true, fallbackValue, clearOnSuccess = true } = {}) {
        try {
            const result = operation();
            if (clearOnSuccess) {
                this.clear();
            }
            return result;
        } catch (error) {
            this.capture(error, { message, context });
            if (rethrow) {
                throw error;
            }
            return fallbackValue;
        }
    }

    async guardAsync(operation, { message, context, rethrow = true, fallbackValue, clearOnSuccess = true } = {}) {
        try {
            const result = await operation();
            if (clearOnSuccess) {
                this.clear();
            }
            return result;
        } catch (error) {
            this.capture(error, { message, context });
            if (rethrow) {
                throw error;
            }
            return fallbackValue;
        }
    }

    wrap(operation, options = {}) {
        return (...args) => this.guard(() => operation(...args), { ...options, context: { ...(options.context || {}), args } });
    }

    wrapAsync(operation, options = {}) {
        return async (...args) => this.guardAsync(() => operation(...args), { ...options, context: { ...(options.context || {}), args } });
    }

    getLastError() {
        return this.lastError;
    }
}

export function hasBeenHandled(error) {
    const handledMap = getHandledMap(error, false);
    return handledMap ? handledMap.size > 0 : false;
}
