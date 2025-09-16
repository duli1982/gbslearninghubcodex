import { ErrorBoundary } from '../components/common/ErrorBoundary.js';
import { loadMyDayEvents } from '../data/loaders.js';

let myDayContainer;
let currentDayEventIndex = 0;
let myDayEventsData = [];
let eventsLoaded = false;
let eventsLoading = false;
let hasSetup = false;

const myDayBoundary = new ErrorBoundary({
    id: 'my-day-section',
    fallbackMessage: "We couldn't load the day simulator right now. Please try again later.",
    renderer: ({ message }) => {
        if (myDayContainer) {
            myDayContainer.innerHTML = `<div class="text-center text-red-500 py-8">${message}</div>`;
        } else if (typeof window !== 'undefined' && typeof window.alert === 'function') {
            window.alert(message);
        }
    }
});

export async function initMyDaySection() {
    myDayContainer = document.getElementById('my-day-container');
    if (!myDayContainer) return;

    if (!hasSetup) {
        myDayContainer.addEventListener('click', handleDayClick);
        hasSetup = true;
    }

    if (eventsLoaded) {
        currentDayEventIndex = 0;
        loadDayEvent(0);
        return;
    }

    if (eventsLoading) return;

    eventsLoading = true;
    currentDayEventIndex = 0;
    myDayContainer.innerHTML = `<div class="text-center text-gray-500 py-8 animate-pulse">Loading your AI-powered day...</div>`;

    try {
        myDayEventsData = await loadMyDayEvents();
        eventsLoaded = true;

        if (!myDayEventsData.length) {
            myDayContainer.innerHTML = `<div class="text-center text-gray-500 py-8">No daily scenarios available yet.</div>`;
            return;
        }

        loadDayEvent(0);
    } catch (error) {
        myDayBoundary.capture(error, {
            message: "We couldn't load the day simulator right now. Please try again later.",
            context: { scope: 'my-day.load' }
        });
    } finally {
        eventsLoading = false;
    }
}

function loadDayEvent(index) {
    if (!myDayContainer) return;

    if (index >= myDayEventsData.length) {
        myDayContainer.innerHTML = `
            <p class="text-center text-gray-600 text-2xl font-bold">You've completed your day!</p>
            <p class="text-center text-gray-500 mt-4">You've seen how a few smart prompts can save hours of work. You're ready to start integrating AI into your real workflow.</p>
            <div class="mt-6 text-center">
                <button id="restartDayBtn" class="bg-gray-600 text-white font-bold py-2 px-6 rounded-full hover:bg-gray-700 transition-colors">Start Day Over</button>
            </div>
        `;
        return;
    }

    const event = myDayEventsData[index];
    const optionsHtml = event.options.map((option, optionIndex) => `
        <div class="scenario-option p-4 rounded-lg cursor-pointer" data-index="${optionIndex}">
            <p class="font-semibold">${option.text}</p>
            <div class="feedback mt-2 text-sm hidden p-4 bg-green-100 text-green-800 rounded-lg"></div>
        </div>
    `).join('');

    myDayContainer.innerHTML = `
        <div class="mb-4">
            <span class="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700">${event.time}</span>
        </div>
        <p class="text-gray-600 mb-6 text-lg">${event.task}</p>
        <div class="space-y-4">${optionsHtml}</div>
        <div class="mt-6 text-right">
            <button id="nextDayEventBtn" class="hidden bg-[#4A90E2] text-white font-bold py-2 px-6 rounded-full hover:bg-blue-600 transition-colors">Continue Day &rarr;</button>
        </div>
    `;
}

function handleDayClick(event) {
    const optionElement = event.target.closest('.scenario-option');
    if (optionElement && !optionElement.classList.contains('selected')) {
        const selectedIndex = parseInt(optionElement.getAttribute('data-index') || '0', 10);
        const eventData = myDayEventsData[currentDayEventIndex];
        if (!eventData) return;
        const selectedOption = eventData.options[selectedIndex];

        const allOptions = myDayContainer.querySelectorAll('.scenario-option');
        allOptions.forEach((option) => option.classList.add('selected'));

        const feedbackEl = optionElement.querySelector('.feedback');
        if (feedbackEl) {
            feedbackEl.textContent = selectedOption.outcome;
            feedbackEl.classList.remove('hidden');
        }

        optionElement.classList.add('correct');
        document.getElementById('nextDayEventBtn')?.classList.remove('hidden');
        return;
    }

    if (event.target.id === 'nextDayEventBtn') {
        currentDayEventIndex += 1;
        loadDayEvent(currentDayEventIndex);
        return;
    }

    if (event.target.id === 'restartDayBtn') {
        currentDayEventIndex = 0;
        loadDayEvent(currentDayEventIndex);
    }
}
