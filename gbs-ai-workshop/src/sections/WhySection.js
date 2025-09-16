import { loadWhySubtitles } from '../data/loaders.js';

let subtitleIntervalId;
let isLoading = false;

export async function initWhySection() {
    const subtitleElement = document.getElementById('animated-subtitle');
    if (!subtitleElement || subtitleIntervalId || isLoading) return;

    isLoading = true;
    subtitleElement.textContent = 'Loading inspiration...';
    subtitleElement.classList.add('text-gray-400', 'animate-pulse');

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
        console.error('Failed to load Why section subtitles', error);
        subtitleElement.textContent = 'Unable to load examples right now.';
        subtitleElement.classList.remove('subtitle-animate-in', 'subtitle-animate-out');
        subtitleElement.classList.remove('animate-pulse', 'text-gray-400');
        subtitleElement.classList.add('text-gray-500');
    } finally {
        isLoading = false;
    }
}
