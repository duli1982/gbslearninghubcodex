export function initOpportunityChart({
    canvas,
    data,
    detailsData,
    introElement,
    detailsElement,
    titleElement,
    descriptionElement,
    examplesList,
    sliders = {},
    valueDisplays = {},
    totalDisplay
}) {
    if (!canvas || typeof Chart === 'undefined') {
        return null;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        return null;
    }

    const chart = new Chart(ctx, {
        type: 'doughnut',
        data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: { size: 14 }
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: '#4A4A4A',
                    titleFont: { size: 16, weight: 'bold' },
                    bodyFont: { size: 14 },
                    padding: 12
                }
            },
            onClick: (_event, elements) => {
                if (!elements.length) return;
                const index = elements[0].index;
                const category = data.labels[index];
                const details = detailsData[category];
                if (!details) return;

                if (introElement) {
                    introElement.classList.add('hidden');
                }
                if (detailsElement) {
                    detailsElement.classList.remove('hidden');
                    detailsElement.classList.add('fade-in');
                }
                if (titleElement) {
                    titleElement.textContent = details.title;
                }
                if (descriptionElement) {
                    descriptionElement.textContent = details.description;
                }
                if (examplesList) {
                    examplesList.innerHTML = '';
                    details.examples.forEach((example) => {
                        const li = document.createElement('li');
                        li.textContent = example;
                        examplesList.appendChild(li);
                    });
                }
            }
        }
    });

    const sliderEntries = Object.entries(sliders);

    function updateChartFromSliders() {
        if (!sliderEntries.length) return;
        const values = sliderEntries.map(([_, slider]) => parseInt(slider?.value ?? '0', 10));
        chart.data.datasets[0].data = values;
        chart.update();

        sliderEntries.forEach(([key, slider], index) => {
            const display = valueDisplays[key];
            if (slider && display) {
                display.textContent = `${values[index]}%`;
            }
        });

        if (totalDisplay) {
            const total = values.reduce((sum, value) => sum + value, 0);
            totalDisplay.textContent = `${total}%`;
            totalDisplay.classList.toggle('text-red-500', total !== 100);
            totalDisplay.classList.toggle('text-green-600', total === 100);
        }
    }

    sliderEntries.forEach(([_, slider]) => {
        if (slider) {
            slider.addEventListener('input', updateChartFromSliders);
        }
    });

    updateChartFromSliders();

    return chart;
}
