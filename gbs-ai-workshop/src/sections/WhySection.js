import { ErrorBoundary } from '../components/common/ErrorBoundary.js';
import { loadWhySubtitles } from '../data/loaders.js';

let subtitleIntervalId;
let isLoading = false;
let subtitleElementRef = null;

const whySectionBoundary = new ErrorBoundary({
    id: 'why-section',
    fallbackMessage: 'Unable to load examples right now.',
    renderer: ({ message }) => {
        if (subtitleElementRef) {
            subtitleElementRef.textContent = message;
            subtitleElementRef.classList.remove('subtitle-animate-in', 'subtitle-animate-out', 'animate-pulse');
            subtitleElementRef.classList.remove('text-gray-400');
            subtitleElementRef.classList.add('text-gray-500');
        } else if (typeof window !== 'undefined' && typeof window.alert === 'function') {
            window.alert(message);
        }
    },
    clearRenderer: () => {
        if (subtitleElementRef) {
            subtitleElementRef.classList.remove('text-gray-500');
        }
    }
});

export async function initWhySection() {
    const subtitleElement = document.getElementById('animated-subtitle');
    if (!subtitleElement || subtitleIntervalId || isLoading) return;

    subtitleElementRef = subtitleElement;

    isLoading = true;
    subtitleElement.textContent = 'Loading inspiration...';
    subtitleElement.classList.add('text-gray-400', 'animate-pulse');
    whySectionBoundary.clear();

    try {
        const subtitles = await loadWhySubtitles();
        if (!Array.isArray(subtitles) || subtitles.length === 0) {
            subtitleElement.textContent = '';
            subtitleElement.classList.remove('animate-pulse', 'text-gray-400');
            return;
        }

        let subtitleIndex = 0;

        const cycleSubtitles = () => {
            subtitleElement.classList.remove('subtitle-animate-in');
            subtitleElement.classList.add('subtitle-animate-out');

            window.setTimeout(() => {
                subtitleIndex = (subtitleIndex + 1) % subtitles.length;
                subtitleElement.textContent = subtitles[subtitleIndex];
                subtitleElement.classList.remove('subtitle-animate-out');
                subtitleElement.classList.add('subtitle-animate-in');
            }, 500);
        };

        subtitleElement.textContent = subtitles[0];
        subtitleElement.classList.remove('animate-pulse', 'text-gray-400');
        subtitleElement.classList.add('subtitle-animate-in');

        subtitleIntervalId = window.setInterval(cycleSubtitles, 4000);
    } catch (error) {
        whySectionBoundary.capture(error, {
            message: 'Unable to load examples right now.',
            context: { scope: 'why-section.load' }
        });
    } finally {
        isLoading = false;
    }
}
