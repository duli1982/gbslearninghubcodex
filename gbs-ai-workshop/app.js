import { initFirebase } from './src/services/firebaseService.js';
import { initNavigation } from './src/sections/Navigation.js';
import { initWhySection } from './src/sections/WhySection.js';
import { initHowSection } from './src/sections/HowSection.js';
import { initPromptLibrarySection } from './src/sections/PromptLibrarySection.js';
import { initPromptBuilderSection } from './src/sections/PromptBuilderSection.js';
import { initReversePromptSection } from './src/sections/ReversePromptSection.js';
import { initMyLibrarySection } from './src/sections/MyLibrarySection.js';
import { initSimulatorSection } from './src/sections/SimulatorSection.js';
import { initMyDaySection } from './src/sections/MyDaySection.js';
import { initCaseStudiesSection } from './src/sections/CaseStudiesSection.js';

document.addEventListener('DOMContentLoaded', async () => {
    const showFirebaseError = (message) => {
        const container = document.getElementById('firebase-error');
        if (!container) return;
        container.textContent = message;
        container.classList.remove('hidden');
    };

    const clearFirebaseError = () => {
        const container = document.getElementById('firebase-error');
        if (!container) return;
        container.textContent = '';
        container.classList.add('hidden');
    };

    const navigation = initNavigation({
        sectionInitializers: {
            why: initWhySection,
            how: initHowSection,
            what: initPromptLibrarySection,
            builder: initPromptBuilderSection,
            'reverse-prompt': initReversePromptSection,
            'my-library': initMyLibrarySection,
            'case-studies': initCaseStudiesSection,
            simulator: initSimulatorSection,
            'my-day': initMyDaySection
        }
    });

    await initFirebase({ onError: showFirebaseError, onClear: clearFirebaseError });

    navigation?.refresh();
});
