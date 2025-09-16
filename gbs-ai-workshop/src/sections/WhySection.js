let subtitleIntervalId;

export function initWhySection() {
    const subtitleElement = document.getElementById('animated-subtitle');
    if (!subtitleElement || subtitleIntervalId) return;

    const subtitles = [
        'Automate Tedious Reports...',
        'Summarize Long Meetings...',
        'Draft Professional Emails...'
    ];
    let subtitleIndex = 0;

    const cycleSubtitles = () => {
        subtitleElement.classList.remove('subtitle-animate-in');
        subtitleElement.classList.add('subtitle-animate-out');

        setTimeout(() => {
            subtitleIndex = (subtitleIndex + 1) % subtitles.length;
            subtitleElement.textContent = subtitles[subtitleIndex];
            subtitleElement.classList.remove('subtitle-animate-out');
            subtitleElement.classList.add('subtitle-animate-in');
        }, 500);
    };

    subtitleElement.textContent = subtitles[0];
    subtitleElement.classList.add('subtitle-animate-in');

    subtitleIntervalId = window.setInterval(cycleSubtitles, 4000);
}
