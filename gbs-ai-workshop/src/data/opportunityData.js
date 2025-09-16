export const opportunityData = {
    labels: ['Repetitive', 'Research-heavy', 'Reactive', 'Reporting'],
    datasets: [
        {
            label: 'Team Task Distribution',
            data: [35, 25, 20, 20],
            backgroundColor: [
                'rgba(74, 144, 226, 0.7)',
                'rgba(80, 227, 194, 0.7)',
                'rgba(245, 166, 35, 0.7)',
                'rgba(126, 211, 33, 0.7)'
            ],
            borderColor: ['#4A90E2', '#50E3C2', '#F5A623', '#7ED321'],
            borderWidth: 2,
            hoverOffset: 8
        }
    ]
};

export const opportunityDetailsData = {
    Repetitive: {
        title: 'Tackling Repetitive Tasks',
        description: "These are the routine, low-variability tasks that consume significant time but offer little strategic value. Gemini excels at automating these, freeing up your team for more complex problem-solving.",
        examples: [
            'Drafting standard weekly status reports.',
            'Compiling data from multiple sources into a single sheet.',
            'Responding to common internal or external queries with a consistent message.'
        ]
    },
    'Research-heavy': {
        title: 'Accelerating Research & Synthesis',
        description: "Tasks that require gathering, reading, and synthesizing large amounts of information are prime candidates for AI. Gemini can act as a research assistant, providing summaries and key insights in seconds.",
        examples: [
            'Summarizing long documents or articles to prepare for a meeting.',
            'Conducting initial market or competitor analysis.',
            'Getting up to speed on a new internal process or project history.'
        ]
    },
    Reactive: {
        title: 'Improving Reactive Workflows',
        description: "This involves responding to ad-hoc requests and questions. Gemini can provide instant, accurate answers based on existing knowledge, reducing interruptions for your subject matter experts.",
        examples: [
            'Answering team questions about a specific company policy or process.',
            'Providing quick status updates to stakeholders based on project notes.',
            'Drafting initial responses to stakeholder requests for information.'
        ]
    },
    Reporting: {
        title: 'Streamlining Reporting & Summarization',
        description: "The process of creating summaries, presentations, and reports is often time-consuming. Gemini can create first drafts, outlines, and summaries from raw data or notes, drastically cutting down preparation time.",
        examples: [
            'Creating a PowerPoint outline from a long report.',
            'Writing a summary paragraph of project progress from bullet points.',
            'Transforming meeting notes into a formal summary for distribution.'
        ]
    }
};
