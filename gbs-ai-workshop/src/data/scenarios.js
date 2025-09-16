export const scenarios = {
    "General": [
        {
            id: 1,
            title: "The Angry Stakeholder",
            problem: "You receive an email from a senior VP who is unhappy with a recent report from your team. The email is curt and demands an immediate explanation for perceived inaccuracies. You need to de-escalate the situation and provide a clear, professional response quickly.",
            prompts: [
                { text: "Write an email to an angry VP.", isCorrect: false, feedback: "This prompt is too vague. It lacks the context and desired tone needed for such a sensitive task. The result will likely be generic and unhelpful." },
                { text: "Summarize the attached email thread and draft a polite, professional, and non-defensive response. Explain that we are investigating the data and will provide a full report within 24 hours. Acknowledge their frustration.", isCorrect: true, feedback: "Correct! This prompt is excellent. It provides context (the email), specifies the persona and tone ('polite, professional, non-defensive'), and gives a clear action plan ('investigating... provide a report')." },
                { text: "Tell me why the VP is wrong.", isCorrect: false, feedback: "This prompt is confrontational and assumes the stakeholder is incorrect without investigation. It will not help de-escalate the situation." }
            ]
        },
        {
            id: 2,
            title: "The 50-Page Document",
            problem: "You've just been handed a 50-page process document for a new system your team must adopt. You have a meeting about it in one hour and need to understand the key steps, requirements, and potential impacts on your team's workflow.",
            prompts: [
                { text: "Act as a GBS process expert. Read the following document and provide a summary of the top 5 most critical changes for a team of data analysts. Format the output as bullet points. Then, list 3 potential risks or challenges for implementation.", isCorrect: true, feedback: "Perfect! This prompt uses persona crafting ('GBS process expert'), is highly specific about the desired output (top 5 changes, 3 risks), and specifies the format (bullet points), ensuring a concise and relevant summary." },
                { text: "Read this and tell me what it says.", isCorrect: false, feedback: "This is a very low-effort prompt. While Gemini will provide a summary, it will be generic and may not focus on the aspects most critical to you as a leader (workflow changes, risks, etc.)." },
                { text: "Make this document shorter.", isCorrect: false, feedback: "This is slightly better but still lacks specificity. 'Shorter' is subjective. The result will be a condensed version, but it might miss the key details you need for your meeting." }
            ]
        }
    ],
    "Sales Ops": [
        {
            id: 3,
            title: "Cleaning Lead Data",
            problem: "You have a list of 100 new leads from a conference, but the data is messy. It's in a single block of text with inconsistent formatting. You need to extract the Name, Company, and Email for each lead and format it as a clean CSV for import into Salesforce.",
            prompts: [
                { text: "Format this text.", isCorrect: false, feedback: "Too vague. 'Format' could mean anything. You need to specify the input, the desired output structure (CSV), and the specific data to extract." },
                { text: "Below is a block of text containing lead data. Extract the Name, Company, and Email for each person. Format the output as a CSV with headers: 'Name', 'Company', 'Email'.", isCorrect: true, feedback: "Excellent! This prompt clearly defines the task, specifies the exact data points to find, and dictates the precise output format (CSV with headers), making it ready for system import." },
                { text: "Find the emails in this text.", isCorrect: false, feedback: "This only solves part of the problem. You'll get the emails, but you'll miss the names and companies, requiring more manual work." }
            ]
        }
    ],
    "HR Support": [
        {
            id: 4,
            title: "New Hire Onboarding",
            problem: "A new Financial Analyst is starting on your team next Monday. You need to create a comprehensive 30-day onboarding plan to get them up to speed quickly.",
            prompts: [
                { text: "Act as an experienced HR onboarding specialist. Create a detailed 30-day onboarding plan for a new Financial Analyst. The plan should be broken down by week and include sections for company policies, system training (Excel, SAP), key introductions to team members, and initial project assignments.", isCorrect: true, feedback: "This is a great prompt. It uses a specific persona, clearly defines the role being onboarded, and outlines the key components and structure (weekly breakdown, specific sections) for the plan." },
                { text: "Make an onboarding plan.", isCorrect: false, feedback: "This is too generic. It doesn't specify the role, the duration, or what topics the plan should cover, leading to a very high-level and likely unusable output." },
                { text: "What should a new hire learn?", isCorrect: false, feedback: "This will give you a list of topics, but not a structured, actionable plan. It creates more work for you to organize the ideas." }
            ]
        }
    ],
    "IT Admin": [
        {
            id: 5,
            title: "License Optimization",
            problem: "Your IT director has asked for a plan to reduce software license waste across your organization.",
            prompts: [
                { text: "Create a plan to reduce license waste.", isCorrect: false, feedback: "Too vague. It doesn't specify what data to analyze or how to measure success." },
                { text: "Act as an IT asset manager. Using the software usage report below, identify licenses that have not been used in the last 60 days. Provide a plan to reassign or retire these licenses, including a communication template to affected users and a projected cost savings model.", isCorrect: true, feedback: "Strong prompt. It defines the persona, specifies the data (software usage report), includes a clear action (identify unused licenses), and outlines expected outputs (plan, communication template, cost savings)." },
                { text: "Make me a better process.", isCorrect: false, feedback: "This doesn't provide the context needed for Gemini to produce a meaningful result." }
            ]
        }
    ]
};
