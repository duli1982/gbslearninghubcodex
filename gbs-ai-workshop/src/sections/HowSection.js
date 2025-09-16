import { opportunityData, opportunityDetailsData } from '../data/opportunityData.js';
import { initOpportunityChart } from '../components/charts/OpportunityChart.js';

export function initHowSection() {
    const canvas = document.getElementById('opportunityChart');
    if (!canvas) return;

    const chartContainer = document.getElementById('opportunity-details');
    const introElement = document.getElementById('opportunity-intro');

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
}
