import { ErrorBoundary } from '../components/common/ErrorBoundary.js';
import { loadOpportunityData } from '../data/loaders.js';
import { initOpportunityChart } from '../components/charts/OpportunityChart.js';

let chartInitialized = false;
let chartLoading = false;
let loadingStatusIndicator = null;
let chartCanvasRef = null;

const howSectionBoundary = new ErrorBoundary({
    id: 'how-section',
    fallbackMessage: "We couldn't load the opportunity framework right now.",
    renderer: ({ message }) => {
        if (loadingStatusIndicator) {
            loadingStatusIndicator.classList.remove('animate-pulse');
            loadingStatusIndicator.classList.add('text-red-500');
            loadingStatusIndicator.textContent = message;
        } else if (typeof window !== 'undefined' && typeof window.alert === 'function') {
            window.alert(message);
        }
        if (chartCanvasRef) {
            chartCanvasRef.classList.remove('hidden');
        }
    },
    clearRenderer: () => {
        if (loadingStatusIndicator) {
            loadingStatusIndicator.classList.remove('text-red-500');
        }
    }
});

export async function initHowSection() {
    const canvas = document.getElementById('opportunityChart');
    if (!canvas || chartInitialized || chartLoading) return;

    const chartContainer = document.getElementById('opportunity-details');
    const introElement = document.getElementById('opportunity-intro');
    const chartWrapper = canvas.parentElement;
    let loadingIndicator;

    if (chartWrapper) {
        canvas.classList.add('hidden');
        loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'text-center text-gray-500 py-8 animate-pulse';
        loadingIndicator.textContent = 'Loading opportunity data...';
        chartWrapper.appendChild(loadingIndicator);
    }

    chartCanvasRef = canvas;
    loadingStatusIndicator = loadingIndicator || null;
    howSectionBoundary.clear();

    chartLoading = true;

    try {
        const { opportunityData, opportunityDetailsData } = await loadOpportunityData();

        if (!opportunityData || !opportunityDetailsData) {
            if (loadingIndicator) {
                loadingIndicator.classList.remove('animate-pulse');
                loadingIndicator.textContent = 'Opportunity data is unavailable.';
            }
            return;
        }

        const sliders = {
            repetitive: document.getElementById('repetitiveSlider'),
            research: document.getElementById('researchSlider'),
            reactive: document.getElementById('reactiveSlider'),
            reporting: document.getElementById('reportingSlider')
        };

        const valueDisplays = {
            repetitive: document.getElementById('repetitiveValue'),
            research: document.getElementById('researchValue'),
            reactive: document.getElementById('reactiveValue'),
            reporting: document.getElementById('reportingValue')
        };

        const totalDisplay = document.getElementById('totalPercentage');

        const clonedData = JSON.parse(JSON.stringify(opportunityData));

        canvas.classList.remove('hidden');
        loadingIndicator?.remove();
        if (loadingStatusIndicator === loadingIndicator) {
            loadingStatusIndicator = null;
        }

        initOpportunityChart({
            canvas,
            data: clonedData,
            detailsData: opportunityDetailsData,
            introElement,
            detailsElement: chartContainer,
            titleElement: document.getElementById('opportunity-title'),
            descriptionElement: document.getElementById('opportunity-description'),
            examplesList: document.getElementById('opportunity-examples'),
            sliders,
            valueDisplays,
            totalDisplay
        });

        chartInitialized = true;
    } catch (error) {
        howSectionBoundary.capture(error, {
            message: "We couldn't load the opportunity framework right now.",
            context: { scope: 'how-section.load' }
        });
    } finally {
        chartLoading = false;
    }
}
