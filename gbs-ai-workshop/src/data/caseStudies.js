export const caseStudies = {
    "Project Management": [
        {
            title: "The Raw Request",
            description: "It starts with a vague email from a stakeholder. It has a goal, but lacks structure and clear deliverables.",
            prompt: `<strong>From:</strong> VP of Sales<br><strong>Subject:</strong> Q3 sales data<br><br>Hi team, I need a better way to see our regional sales performance for Q3. The current reports are too dense. I want to see top performers, regional totals, and product line breakdowns. Need something for the board meeting next week.`
        },
        {
            title: "Create a Project Brief",
            description: "Your first step is to bring clarity. Use Gemini to deconstruct the email and create a structured brief. This ensures you and the stakeholder are aligned.",
            prompt: `Act as a GBS project manager. Read the email below and transform it into a structured project brief. Extract the key stakeholder, the primary objective, the required data points (deliverables), and the deadline. Format this as a clean, easy-to-read summary.<br><br><span class="text-gray-500">[Paste the email text from Step 1 here]</span>`
        },
        {
            title: "Draft a Project Plan",
            description: "Now that you have a clear brief (the output from Step 2), you can create a high-level project plan. This is another prompt chaining example.",
            prompt: `Using the project brief below, create a high-level project plan. The plan should include four phases: Data Gathering, Data Validation, Report Development, and Final Review. Suggest a 1-week timeline, assigning 2 days to each of the first three phases and 1 day to the final review.<br><br><span class="text-gray-500">[Paste the project brief from Step 2 here]</span>`
        },
        {
            title: "Write the Kickoff Meeting Agenda",
            description: "With a plan in place, you're ready to meet with your team. Use the project plan from Step 3 to create a focused meeting agenda.",
            prompt: `Based on the project plan below, create a 30-minute kickoff meeting agenda. The goals are to align the team on the project scope, deliverables, and timeline. Include agenda items for reviewing the plan, assigning roles, and a Q&A session.<br><br><span class="text-gray-500">[Paste the project plan from Step 3 here]</span>`
        }
    ],
    "Sales Ops": [
        {
            title: "Initial Request",
            description: "The Head of Sales wants a summary of Q2 performance, including key trends and a comparison to Q1, but provides no data.",
            prompt: `Hi, I need the Q2 sales performance summary for the leadership meeting. I want to see the key trends and how we did against Q1. Thanks.`
        },
        {
            title: "Data Analysis",
            description: "After gathering the raw data, you use Gemini to perform the initial analysis.",
            prompt: `Act as a senior sales operations analyst. You have been given raw sales data for Q1 and Q2. Analyze the data to identify the top 3 performing regions, the bottom 3 performing regions, and the overall percentage growth or decline from Q1 to Q2. Present your findings as a concise summary.`
        },
        {
            title: "Draft Summary Email",
            description: "Using the analysis from the previous step, draft a clear and concise email for the Head of Sales.",
            prompt: `Based on the sales analysis below, draft a professional email to the Head of Sales. Start with the overall performance summary, then list the top and bottom performing regions in bullet points. Conclude by noting that a full presentation is in progress.<br><br><span class="text-gray-500">[Paste summary from Step 2 here]</span>`
        },
        {
            title: "Create Presentation Outline",
            description: "Finally, create a presentation outline based on the email summary for the leadership meeting.",
            prompt: `Using the email summary below, create a 5-slide presentation outline. The slides should be: 1. Title Slide. 2. Q2 Performance Overview. 3. Top & Bottom Performing Regions. 4. Key Trends & Insights. 5. Next Steps.<br><br><span class="text-gray-500">[Paste email text from Step 3 here]</span>`
        }
    ],
    "HR Support": [
        {
            title: "The Problem",
            description: "The HR team has noticed a high volume of repetitive questions about the new remote work policy.",
            prompt: `Team, we are getting a lot of the same questions about the new remote work policy. We need a way to handle this more efficiently.`
        },
        {
            title: "Categorize Questions",
            description: "First, use Gemini to group the raw list of questions into logical themes.",
            prompt: `Below is a list of questions we've received about the new remote work policy. Categorize these questions into logical groups (e.g., 'Eligibility', 'Equipment', 'Expectations').<br><br><span class="text-gray-500">[Paste list of raw questions here]</span>`
        },
        {
            title: "Draft FAQ Answers",
            description: "Now, use the categories from Step 2 to draft clear answers for each group.",
            prompt: `You are an HR communications specialist. For each category of questions below, draft a clear, concise, and helpful answer. The tone should be supportive and professional.<br><br><span class="text-gray-500">[Paste categorized questions from Step 2 here]</span>`
        },
        {
            title: "Announce the New FAQ",
            description: "Finally, draft a company-wide announcement introducing the new, helpful FAQ document.",
            prompt: `Draft a company-wide email announcing a new FAQ document for the remote work policy. Explain that this resource was created to provide quick answers to common questions. Include a link to the new FAQ page and encourage employees to review it.`
        }
    ],
    "IT Admin": [
        {
            title: "The Audit Finding",
            description: "An audit reveals that several users have licenses for expensive software they rarely use, costing the company money.",
            prompt: `Audit complete for 'PowerDesign Suite'. Report shows 45 licenses are assigned to users who have not logged in for over 90 days. We need to reclaim these licenses to optimize our budget.`
        },
        {
            title: "Draft User Email",
            description: "Use Gemini to draft a polite but clear email to the users with inactive licenses.",
            prompt: `Act as a courteous IT administrator. Draft a friendly but direct email to a list of users. Inform them that a software license audit for 'PowerDesign Suite' is underway. Ask them to confirm if they still require the license for their daily work by replying within 5 business days. Explain that unconfirmed licenses will be reclaimed to optimize costs.`
        },
        {
            title: "Create a Tracking Sheet",
            description: "To manage the responses, ask Gemini to create a simple tracking table.",
            prompt: `Create a Markdown table to track the software license audit. The columns should be: 'User Name', 'Email', 'Responded (Y/N)', 'License Reclaimed (Y/N)', and 'Notes'.`
        },
        {
            title: "Report to Management",
            description: "After the 5-day period, use the tracking sheet to create a summary report for your manager.",
            prompt: `Based on the tracking sheet data below, write a brief summary report for my manager. State the total number of licenses reviewed, how many were reclaimed, and the estimated annual cost savings (assume each license costs $500/year).<br><br><span class="text-gray-500">[Paste final tracking data here]</span>`
        }
    ]
};
