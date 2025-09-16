export const myDayEvents = [
    {
        time: "9:00 AM",
        task: "You arrive at your desk to find 50 unread emails. You need to quickly identify what's urgent and what can wait.",
        options: [
            { text: "Read all my emails.", outcome: "This is inefficient. You'll spend an hour just reading, losing valuable time." },
            { text: "Summarize my unread emails. Create a table with columns for Sender, Subject, a 1-sentence summary, and a priority rating (High, Medium, Low).", outcome: "Excellent choice! In seconds, you have a prioritized list. You see 3 high-priority items to tackle first and can ignore the rest for now." }
        ]
    },
    {
        time: "10:30 AM",
        task: "A stakeholder sends a last-minute request: 'Can you get me the key takeaways from the attached 20-page Q2 performance report? I have a meeting in 30 minutes.'",
        options: [
            { text: "Summarize the attached document into 5 key bullet points, focusing on financial performance and project milestones. The audience is a senior executive.", outcome: "Perfect! You provide a concise, relevant summary in minutes, making your stakeholder look prepared for their meeting." },
            { text: "Tell me what this document is about.", outcome: "This will give you a general summary, but it might not be focused enough for a senior executive who needs specific, high-level takeaways." }
        ]
    },
    {
        time: "2:00 PM",
        task: "You need to prepare for your 1-on-1 with a team member. You want to have a productive conversation about their recent project work and career goals.",
        options: [
            { text: "Brainstorm questions for a 1-on-1 meeting.", outcome: "This is a good start, but it's generic. The questions might not be tailored to this specific situation." },
            { text: "Act as a supportive manager. Generate 3 open-ended questions for a 1-on-1 with a team member to discuss their recent work on 'Project Alpha' and their long-term career aspirations.", outcome: "Great choice! This gives you specific, thoughtful questions that show you're engaged with their work and invested in their growth, leading to a much more productive conversation." }
        ]
    }
];
