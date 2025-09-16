import { initializeApp } from "../vendor/firebase/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "../vendor/firebase/firebase-auth.js";
import { getFirestore, doc, getDoc, addDoc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, query, where, getDocs } from "../vendor/firebase/firebase-firestore.js";

// --- GLOBAL STATE ---
let db, auth, userId, userPromptsUnsubscribe, appId;
let userLibrary = []; // Local cache of user's prompts
let currentScenarioCategory = null;
let currentScenarioIndex = 0;
let currentDayEventIndex = 0;

// --- STATIC DATA ---
const prompts = [
    { id: 'prebuilt-1', category: 'Email', title: 'Summarize Email Thread', content: "Act as a GBS project manager. Below is a long email thread about the 'Q3 Financial Reporting' project. Please summarize the key decisions made, the outstanding questions, and the action items for my team. [Paste email thread here]" },
    { id: 'prebuilt-2', category: 'Email', title: 'Draft Professional Email', content: "Draft a professional but friendly email to a stakeholder, [Stakeholder Name], informing them that the 'Project Alpha' deliverable will be delayed by 2 days due to unforeseen data validation issues. Reassure them that the core timeline is not at risk and that we will provide the final report by EOD on [New Date]. Offer a brief call to answer any questions." },
    { id: 'prebuilt-3', category: 'Email', title: 'Change Email Tone', content: "Make the following email draft more concise and assertive, while remaining professional. [Paste your draft email here]" },
    { id: 'prebuilt-4', category: 'Meetings', title: 'Generate Meeting Agenda', content: "Generate a 30-minute meeting agenda for a kickoff call with the marketing team for a new 'Competitor Analysis' project. The goals are to align on scope, define deliverables, and agree on a timeline. Include time for introductions and Q&A." },
    { id: 'prebuilt-5', category: 'Meetings', title: 'Summarize Meeting Notes', content: "Act as an executive assistant. Review the following raw meeting notes and transform them into a clean summary. The summary should have three sections: 'Key Discussion Points', 'Decisions Made', and a table of 'Action Items' with columns for 'Task', 'Owner', and 'Due Date'. [Paste raw meeting notes here]" },
    { id: 'prebuilt-6', category: 'Analysis', title: 'Extract Structured Data', content: "I've pasted a project request email below. Please extract the key information and format it as a JSON object with the following keys: 'projectName', 'stakeholderName', 'requestedDueDate', 'keyDeliverables'. [Paste project request email here]" },
    { id: 'prebuilt-7', category: 'Analysis', title: 'Brainstorm Report Content', content: "I need to create a 5-slide PowerPoint presentation summarizing our team's Q2 performance. Our key achievements were: completed Project Phoenix on time, reduced ticket response time by 15%, and onboarded two new team members. Our main challenge was a data outage in May. Please generate a slide-by-slide outline for this presentation, including a title and 3-4 bullet points for each slide." },
    { id: 'prebuilt-8', category: 'Team', title: 'Create Process Checklist', content: "Our team needs to create a standard process for onboarding a new client into our system. The key steps involve: receiving the initial request, validating the data, creating the client profile in Salesforce, sending a welcome packet, and scheduling a kickoff call. Please turn this into a detailed checklist that a team member can follow." },
    { id: 'prebuilt-9', category: 'Team', title: 'Explain a Complex Topic', content: "Explain the concept of 'data integrity' as you would to a new team member who has no technical background. Use an analogy to make it easy to understand." },
];

const scenarios = {
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
    title: "Explaining a New Policy",
    problem: "Your department is rolling out a new, mandatory multi-factor authentication (MFA) policy. You need to draft a clear, concise email to all GBS employees, many of whom are not technical, explaining what MFA is, why it's important, and what they need to do.",
    prompts: [
        { text: "Explain MFA.", isCorrect: false, feedback: "This will give you a technical definition of MFA, which is likely too complex for a non-technical audience and won't include the 'call to action' part of your task." },
        { text: "Write an email about the new security policy.", isCorrect: false, feedback: "This is better, but it lacks the crucial context of the audience. The tone might be too technical or the explanation not simple enough." },
        { text: "Act as a helpful IT support specialist. Draft an email to all non-technical employees about a new MFA policy. Use a simple analogy to explain what MFA is and why it's important for security. Clearly state the deadline and provide a link to the setup instructions.", isCorrect: true, feedback: "Perfect. This prompt defines the persona, the audience (non-technical), the specific content to include (analogy, deadline, link), and the goal (to inform and guide action)." }
    ]
}
    ]
};

const caseStudies = {
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

const myDayEvents = [
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

const opportunityData = {
    labels: ['Repetitive', 'Research-heavy', 'Reactive', 'Reporting'],
    datasets: [{
label: 'Team Task Distribution',
data: [35, 25, 20, 20], // Initial values
backgroundColor: [
    'rgba(74, 144, 226, 0.7)',
    'rgba(80, 227, 194, 0.7)',
    'rgba(245, 166, 35, 0.7)',
    'rgba(126, 211, 33, 0.7)'
],
borderColor: [
    '#4A90E2',
    '#50E3C2',
    '#F5A623',
    '#7ED321'
],
borderWidth: 2,
hoverOffset: 8
    }]
};

const opportunityDetailsData = {
    'Repetitive': {
title: 'Tackling Repetitive Tasks',
description: 'These are the routine, low-variability tasks that consume significant time but offer little strategic value. Gemini excels at automating these, freeing up your team for more complex problem-solving.',
examples: [
    'Drafting standard weekly status reports.',
    'Compiling data from multiple sources into a single sheet.',
    'Responding to common internal or external queries with a consistent message.'
]
    },
    'Research-heavy': {
title: 'Accelerating Research & Synthesis',
description: 'Tasks that require gathering, reading, and synthesizing large amounts of information are prime candidates for AI. Gemini can act as a research assistant, providing summaries and key insights in seconds.',
examples: [
    'Summarizing long documents or articles to prepare for a meeting.',
    'Conducting initial market or competitor analysis.',
    'Getting up to speed on a new internal process or project history.'
]
    },
    'Reactive': {
title: 'Improving Reactive Workflows',
description: 'This involves responding to ad-hoc requests and questions. Gemini can provide instant, accurate answers based on existing knowledge, reducing interruptions for your subject matter experts.',
examples: [
    'Answering team questions about a specific company policy or process.',
    'Providing quick status updates to stakeholders based on project notes.',
    'Drafting initial responses to stakeholder requests for information.'
]
    },
    'Reporting': {
title: 'Streamlining Reporting & Summarization',
description: 'The process of creating summaries, presentations, and reports is often time-consuming. Gemini can create first drafts, outlines, and summaries from raw data or notes, drastically cutting down preparation time.',
examples: [
    'Creating a PowerPoint outline from a long report.',
    'Writing a summary paragraph of project progress from bullet points.',
    'Transforming meeting notes into a formal summary for distribution.'
]
    }
};

// --- FIREBASE INITIALIZATION ---
function displayFirebaseError(message) {
    console.error(message);
    const container = document.getElementById('firebase-error');
    if (container) {
container.textContent = message;
container.classList.remove('hidden');
    }
}

function clearFirebaseError() {
    const container = document.getElementById('firebase-error');
    if (container) {
container.textContent = '';
container.classList.add('hidden');
    }
}

async function initFirebase() {
    appId = typeof __app_id !== 'undefined' ? __app_id : 'gbs-gemini-training';
    let firebaseConfig = null;

    if (typeof __firebase_config !== 'undefined' && __firebase_config) {
try {
    firebaseConfig = JSON.parse(__firebase_config);
} catch (parseError) {
    console.error("Failed to parse Firebase config:", parseError);
    displayFirebaseError("We couldn't connect to your workspace because the configuration provided is invalid. Please contact your administrator.");
    return;
}
    }

    if (!firebaseConfig) {
displayFirebaseError("We couldn't connect to your workspace because the training configuration was not provided. Please refresh the page or contact your administrator.");
return;
    }

    const requiredFields = ['apiKey', 'authDomain', 'projectId'];
    const missingFields = requiredFields.filter((field) => !firebaseConfig[field]);

    if (missingFields.length > 0) {
displayFirebaseError(`We couldn't connect to your workspace because the Firebase configuration is missing: ${missingFields.join(', ')}. Please contact your administrator.`);
return;
    }

    let app;
    try {
app = initializeApp(firebaseConfig);
    } catch (initializationError) {
console.error("Firebase initialization failed:", initializationError);
displayFirebaseError("We couldn't connect to your workspace because the Firebase configuration is invalid. Please contact your administrator.");
return;
    }

    clearFirebaseError();
    db = getFirestore(app);
    auth = getAuth(app);

    onAuthStateChanged(auth, user => {
if (user) {
    userId = user.uid;
    console.log("User is signed in with UID:", userId);
    loadUserLibrary();
} else {
    console.log("User is signed out.");
    if (userPromptsUnsubscribe) userPromptsUnsubscribe();
}
    });

    try {
if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
    await signInWithCustomToken(auth, __initial_auth_token);
} else {
    await signInAnonymously(auth);
}
    } catch (error) {
console.error("Authentication failed:", error);
    }
}

// --- DATA HANDLING (FIRESTORE) ---
function loadUserLibrary() {
    if (!userId) return;
    const promptsCollectionPath = `/artifacts/${appId}/users/${userId}/prompts`;
    const q = query(collection(db, promptsCollectionPath));

    userPromptsUnsubscribe = onSnapshot(q, (querySnapshot) => {
userLibrary = [];
querySnapshot.forEach((doc) => {
    userLibrary.push({ id: doc.id, ...doc.data() });
});
console.log("User library loaded/updated:", userLibrary);
renderMyLibrary();
displayPrompts('All'); // Re-render main library to update favorite statuses
    });
}

async function addPromptToLibrary(promptData) {
    if (!userId) return;
    const promptsCollectionPath = `/artifacts/${appId}/users/${userId}/prompts`;
    try {
await addDoc(collection(db, promptsCollectionPath), promptData);
console.log("Prompt added to library");
    } catch (e) {
console.error("Error adding document: ", e);
    }
}

async function removePromptFromLibrary(promptId) {
    if (!userId) return;
    const docPath = `/artifacts/${appId}/users/${userId}/prompts/${promptId}`;
    try {
await deleteDoc(doc(db, docPath));
console.log("Prompt removed from library");
    } catch(e) {
console.error("Error removing document: ", e);
    }
}

// --- RENDER FUNCTIONS ---
function renderMyLibrary() {
    const customList = document.getElementById('my-custom-prompts-list');
    const favoriteList = document.getElementById('my-favorite-prompts-list');
    const noCustomMsg = document.getElementById('no-custom-prompts');
    const noFavoriteMsg = document.getElementById('no-favorite-prompts');

    if (!customList) return; // Exit if not on the right page

    customList.innerHTML = '';
    favoriteList.innerHTML = '';

    const customPrompts = userLibrary.filter(p => p.type === 'custom');
    const favoritePrompts = userLibrary.filter(p => p.type === 'favorite');

    // Render Custom Prompts
    if (customPrompts.length > 0) {
noCustomMsg.classList.add('hidden');
customList.classList.remove('hidden');
customPrompts.forEach(prompt => {
    const card = createPromptCard(prompt, true);
    customList.appendChild(card);
});
    } else {
noCustomMsg.classList.remove('hidden');
customList.classList.add('hidden');
    }

    // Render Favorite Prompts
    if (favoritePrompts.length > 0) {
noFavoriteMsg.classList.add('hidden');
favoriteList.classList.remove('hidden');
favoritePrompts.forEach(prompt => {
    const originalPrompt = prompts.find(p => p.id === prompt.originalId);
    if (originalPrompt) {
       const card = createPromptCard({ ...originalPrompt, libraryId: prompt.id }, true);
       favoriteList.appendChild(card);
    }
});
    } else {
noFavoriteMsg.classList.remove('hidden');
favoriteList.classList.add('hidden');
    }
}

const promptLibraryEl = document.getElementById('prompt-library');
function displayPrompts(filter) {
    if (!promptLibraryEl) return;
    promptLibraryEl.innerHTML = '';
    const filteredPrompts = (filter === 'All') ? prompts : prompts.filter(p => p.category === filter);

    filteredPrompts.forEach(prompt => {
const card = createPromptCard(prompt, false);
promptLibraryEl.appendChild(card);
    });
}

function createPromptCard(prompt, isMyLibrary) {
    const card = document.createElement('div');
    card.className = 'prompt-card bg-white p-6 rounded-lg shadow-sm';

    const isFavorited = userLibrary.some(p => p.type === 'favorite' && p.originalId === prompt.id);

    let buttonsHtml = '';
    if (isMyLibrary) {
if (prompt.type === 'custom') { // It's a custom prompt in the library
    buttonsHtml = `<button data-id="${prompt.id}" class="remove-custom-btn text-red-500 hover:text-red-700 text-xs font-semibold">Remove</button>`;
} else { // It's a favorited prompt in the library
    buttonsHtml = `<button data-id="${prompt.libraryId}" class="unfavorite-btn text-red-500 hover:text-red-700 text-xs font-semibold">Unfavorite</button>`;
}
    } else { // It's in the main library
buttonsHtml = `
    <svg data-id="${prompt.id}" class="favorite-btn h-6 w-6 ${isFavorited ? 'favorited' : ''}" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
    </svg>
`;
    }

    card.innerHTML = `
<div>
    <h4 class="font-bold text-lg mb-2 text-[#4A90E2]">${prompt.title}</h4>
    <p class="text-gray-600 text-sm">${prompt.content}</p>
</div>
<div class="mt-4 pt-4 border-t border-gray-100 flex justify-end items-center">
    ${buttonsHtml}
</div>
    `;
    return card;
}


// --- EVENT LISTENERS ---
document.addEventListener('click', (e) => {
    // Favorite button in main library
    if (e.target.closest('.favorite-btn')) {
const btn = e.target.closest('.favorite-btn');
const promptId = btn.dataset.id;
const existingFavorite = userLibrary.find(p => p.type === 'favorite' && p.originalId === promptId);

if (existingFavorite) {
    removePromptFromLibrary(existingFavorite.id);
} else {
    addPromptToLibrary({ type: 'favorite', originalId: promptId });
}
    }
    // Unfavorite button in my library
    if (e.target.matches('.unfavorite-btn')) {
removePromptFromLibrary(e.target.dataset.id);
    }
    // Remove custom button in my library
    if (e.target.matches('.remove-custom-btn')) {
removePromptFromLibrary(e.target.dataset.id);
    }
});

const promptFilterBtns = document.querySelectorAll('.prompt-filter-btn');
promptFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
promptFilterBtns.forEach(b => {
    b.classList.remove('active', 'bg-[#4A90E2]', 'text-white');
    b.classList.add('bg-white', 'text-gray-700');
});
btn.classList.add('active', 'bg-[#4A90E2]', 'text-white');
btn.classList.remove('bg-white', 'text-gray-700');
displayPrompts(btn.textContent);
    });
});

const sections = document.querySelectorAll('.page-section');
const navLinks = document.querySelectorAll('.nav-link');

function updateSectionVisibility() {
    const hash = window.location.hash;
    const path = window.location.pathname.split('/').pop().replace('.html', '');
    let targetId;

    if (hash) {
targetId = hash;
    } else if (path && path !== 'index' && path !== '') {
targetId = '#' + path;
    } else {
targetId = '#why';
    }

    const toolHashes = ['#what', '#builder', '#my-library', '#simulator', '#reverse-prompt', '#my-day'];
    const toolsDropdownBtn = document.getElementById('tools-dropdown-btn');

    sections.forEach(section => {
const isVisible = '#' + section.id === targetId;
section.classList.toggle('hidden', !isVisible);
if (isVisible) {
    section.classList.add('fade-in');
    // Initialize content for the visible section
    if (section.id === 'case-studies' && !section.dataset.initialized) {
        initializeCaseStudies();
        section.dataset.initialized = 'true';
    }
    if (section.id === 'simulator' && !section.dataset.initialized) {
         displaySimulatorCategoryMenu();
        section.dataset.initialized = 'true';
    }
     if (section.id === 'my-day' && !section.dataset.initialized) {
        loadDayEvent(0);
        section.dataset.initialized = 'true';
    }
}
    });

    navLinks.forEach(link => {
link.classList.toggle('active', link.getAttribute('href') === targetId);
    });

    if (toolsDropdownBtn) {
toolsDropdownBtn.classList.toggle('active', toolHashes.includes(targetId));
    }
}

window.addEventListener('hashchange', updateSectionVisibility);


// --- Dropdown Menu Logic ---
const toolsDropdown = document.getElementById('tools-dropdown');
if (toolsDropdown) {
    const btn = document.getElementById('tools-dropdown-btn');
    const menu = document.getElementById('tools-dropdown-menu');
    btn.addEventListener('click', () => {
const isHidden = menu.classList.contains('hidden');
if (isHidden) {
    menu.classList.remove('hidden', 'opacity-0', 'scale-95');
    menu.classList.add('opacity-100', 'scale-100');
} else {
    menu.classList.add('opacity-0', 'scale-95');
    setTimeout(() => menu.classList.add('hidden'), 100); // Wait for transition
}
    });
    // Close dropdown when clicking outside
    window.addEventListener('click', (e) => {
if (!toolsDropdown.contains(e.target)) {
    menu.classList.add('opacity-0', 'scale-95');
    setTimeout(() => menu.classList.add('hidden'), 100);
}
    });
     // Close dropdown when an item is clicked
    menu.addEventListener('click', () => {
 menu.classList.add('opacity-0', 'scale-95');
 setTimeout(() => menu.classList.add('hidden'), 100);
    });
}

// --- Chart and Slider Logic ---
const ctx = document.getElementById('opportunityChart')?.getContext('2d');
if (ctx) {
    const myChart = new Chart(ctx, {
type: 'doughnut',
data: opportunityData,
options: {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
        legend: {
            position: 'bottom',
            labels: { padding: 20, font: { size: 14 } }
        },
        tooltip: {
            enabled: true,
            backgroundColor: '#4A4A4A',
            titleFont: { size: 16, weight: 'bold' },
            bodyFont: { size: 14 },
            padding: 12
        }
    },
    onClick: (event, elements) => {
        if (elements.length > 0) {
            const i = elements[0].index;
            const category = opportunityData.labels[i];
            const details = opportunityDetailsData[category];

            document.getElementById('opportunity-intro').classList.add('hidden');
            const detailsContainer = document.getElementById('opportunity-details');
            detailsContainer.classList.remove('hidden');
            detailsContainer.classList.add('fade-in');

            document.getElementById('opportunity-title').textContent = details.title;
            document.getElementById('opportunity-description').textContent = details.description;
            const examplesList = document.getElementById('opportunity-examples');
            examplesList.innerHTML = '';
            details.examples.forEach(ex => {
                const li = document.createElement('li');
                li.textContent = ex;
                examplesList.appendChild(li);
            });
        }
    }
}
    });

    const sliders = {
repetitive: document.getElementById('repetitiveSlider'),
research: document.getElementById('researchSlider'),
reactive: document.getElementById('reactiveSlider'),
reporting: document.getElementById('reportingSlider')
    };
    const values = {
repetitive: document.getElementById('repetitiveValue'),
research: document.getElementById('researchValue'),
reactive: document.getElementById('reactiveValue'),
reporting: document.getElementById('reportingValue')
    };
    const totalPercentageEl = document.getElementById('totalPercentage');

    function updateChartAndValues() {
const newValues = [
    parseInt(sliders.repetitive.value),
    parseInt(sliders.research.value),
    parseInt(sliders.reactive.value),
    parseInt(sliders.reporting.value)
];
myChart.data.datasets[0].data = newValues;
myChart.update();
values.repetitive.textContent = `${newValues[0]}%`;
values.research.textContent = `${newValues[1]}%`;
values.reactive.textContent = `${newValues[2]}%`;
values.reporting.textContent = `${newValues[3]}%`;
const total = newValues.reduce((sum, val) => sum + val, 0);
totalPercentageEl.textContent = `${total}%`;
totalPercentageEl.classList.toggle('text-red-500', total !== 100);
totalPercentageEl.classList.toggle('text-green-600', total === 100);
    }

    for (const key in sliders) {
if(sliders[key]) sliders[key].addEventListener('input', updateChartAndValues);
    }
    updateChartAndValues();
}

// --- Prompt Builder Logic ---
const generatePromptBtn = document.getElementById('generatePromptBtn');
const saveToLibraryBtn = document.getElementById('saveToLibraryBtn');

if (generatePromptBtn) {
    generatePromptBtn.addEventListener('click', () => {
const goal = document.getElementById('promptGoal').value;
const audience = document.getElementById('promptAudience').value;
const tone = document.getElementById('promptTone').value;
const format = document.getElementById('promptFormat').value;
const context = document.getElementById('promptContext').value.trim();

if (!context) {
    console.warn('Please provide some context for your prompt.');
    return;
}

let promptText = `Act as an expert GBS Manager. Your task is to ${goal.toLowerCase()}. The audience is ${audience.toLowerCase()}. The tone of the response should be ${tone.toLowerCase()} and the output must be in the format of ${format.toLowerCase()}.\n\nBased on these requirements, please process the following context:\n\n---\n${context}\n---`;

document.getElementById('generatedPromptOutput').textContent = promptText;
document.getElementById('generatedPromptContainer').classList.remove('hidden');
    });
}

if (saveToLibraryBtn) {
    saveToLibraryBtn.addEventListener('click', () => {
const content = document.getElementById('generatedPromptOutput').textContent;
const title = document.getElementById('promptGoal').value; // Use goal as title

if (content) {
    const newPrompt = {
        type: 'custom',
        title: `Custom: ${title}`,
        content: content,
        createdAt: new Date().toISOString()
    };
    addPromptToLibrary(newPrompt);
    saveToLibraryBtn.textContent = 'Saved!';
    setTimeout(() => { saveToLibraryBtn.textContent = 'Save'; }, 2000);
}
    });
}

const copyPromptBtn = document.getElementById('copyPromptBtn');
if(copyPromptBtn) {
    copyPromptBtn.addEventListener('click', () => {
const textToCopy = document.getElementById('generatedPromptOutput').textContent;
navigator.clipboard.writeText(textToCopy).then(() => {
    copyPromptBtn.textContent = 'Copied!';
    setTimeout(() => { copyPromptBtn.textContent = 'Copy'; }, 2000);
}).catch(err => {
    console.error('Failed to copy text: ', err);
});
    });
}

// --- Reverse Prompt Logic ---
const generateReversePromptBtn = document.getElementById('generateReversePromptBtn');
if (generateReversePromptBtn) {
    generateReversePromptBtn.addEventListener('click', async () => {
const input_text = document.getElementById('reversePromptInput').value;
const spinner = document.getElementById('reverse-prompt-spinner');
const outputContainer = document.getElementById('reverse-prompt-output-container');
const errorContainer = document.getElementById('reverse-prompt-error');

if (!input_text.trim()) {
    errorContainer.textContent = 'Please paste some text to analyze.';
    errorContainer.classList.remove('hidden');
    return;
}

spinner.classList.remove('hidden');
outputContainer.classList.add('hidden');
errorContainer.classList.add('hidden');

const meta_prompt = `You are an expert in prompt engineering. Analyze the following text and generate a high-quality, effective prompt that could have been used to create it. Break down your reasoning, explaining why the prompt you created is effective. The prompt should be structured to include: 1. A clear persona (e.g., 'Act as a...'). 2. A specific task or goal. 3. Instructions on tone and format if they can be inferred from the text. Return your response as a JSON object with two keys: "generated_prompt" and "explanation".\n\nText to analyze:\n---\n${input_text}\n---`;

try {
    const apiKey = ""; // TODO: Add your Google AI API key here
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const payload = { contents: [{ role: "user", parts: [{ text: meta_prompt }] }] };

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
    }

    const result = await response.json();

    if (result.candidates && result.candidates[0].content.parts[0].text) {
        const responseText = result.candidates[0].content.parts[0].text;
        const cleanedText = responseText.replace(/```json|```/g, '').trim();
        const parsedJson = JSON.parse(cleanedText);

        document.getElementById('reverse-prompt-output').textContent = parsedJson.generated_prompt;
        document.getElementById('reverse-prompt-explanation').textContent = parsedJson.explanation;
        outputContainer.classList.remove('hidden');
    } else {
        throw new Error("Invalid response structure from API.");
    }
} catch (error) {
    console.error("Reverse prompt generation failed:", error);
    errorContainer.textContent = "Sorry, something went wrong while generating the prompt. Please try again.";
    errorContainer.classList.remove('hidden');
} finally {
    spinner.classList.add('hidden');
}
    });
}

// --- Scenario Simulator Logic ---
const simulatorContainer = document.getElementById('simulator-container');

function displaySimulatorCategoryMenu() {
    if (!simulatorContainer) return;
    let categoryHtml = Object.keys(scenarios).map(category => `
<div class="category-option p-6 rounded-lg cursor-pointer text-center" data-category="${category}">
    <h3 class="font-bold text-xl text-[#4A90E2]">${category}</h3>
</div>
    `).join('');

    simulatorContainer.innerHTML = `
<h3 class="text-2xl font-bold text-center mb-6">Choose a Scenario Category</h3>
<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">${categoryHtml}</div>
    `;
}

function loadScenario() {
    if (!simulatorContainer || !currentScenarioCategory) return;

    const scenario = scenarios[currentScenarioCategory][currentScenarioIndex];

    if (!scenario) {
simulatorContainer.innerHTML = `
    <p class="text-center text-gray-600 text-xl">You've completed all scenarios in this category!</p>
    <div class="mt-6 text-center">
        <button id="backToCategoriesBtn" class="bg-gray-600 text-white font-bold py-2 px-6 rounded-full hover:bg-gray-700 transition-colors">Back to Categories</button>
    </div>
`;
return;
    }

    let optionsHtml = scenario.prompts.map((p, i) => `
<div class="scenario-option p-4 rounded-lg cursor-pointer" data-index="${i}">
    <p class="font-semibold">${p.text}</p>
    <div class="feedback mt-2 text-sm hidden"></div>
</div>
    `).join('');

    simulatorContainer.innerHTML = `
 <div class="flex justify-between items-center mb-4">
    <h3 class="text-2xl font-bold text-[#4A90E2]">${scenario.title}</h3>
    <button id="backToCategoriesBtn" class="text-sm text-gray-500 hover:text-gray-800">&larr; Back to Categories</button>
</div>
<p class="text-gray-600 mb-6">${scenario.problem}</p>
<div class="space-y-4">${optionsHtml}</div>
<div class="mt-6 text-right">
    <button id="nextScenarioBtn" class="hidden bg-[#4A90E2] text-white font-bold py-2 px-6 rounded-full hover:bg-blue-600 transition-colors">Next Scenario</button>
</div>
    `;
}

if (simulatorContainer) {
    simulatorContainer.addEventListener('click', e => {
// Category selection
const categoryEl = e.target.closest('.category-option');
if (categoryEl) {
    currentScenarioCategory = categoryEl.dataset.category;
    currentScenarioIndex = 0;
    loadScenario();
    return;
}

// Go back to category menu
if (e.target.id === 'backToCategoriesBtn') {
    currentScenarioCategory = null;
    displaySimulatorCategoryMenu();
    return;
}

// Prompt option selection
const optionEl = e.target.closest('.scenario-option');
if (optionEl && !optionEl.classList.contains('selected')) {
    const selectedIndex = parseInt(optionEl.dataset.index);
    const scenario = scenarios[currentScenarioCategory][currentScenarioIndex];
    const selectedPrompt = scenario.prompts[selectedIndex];

    // Disable further clicks
    const allOptions = simulatorContainer.querySelectorAll('.scenario-option');
    allOptions.forEach(opt => opt.classList.add('selected')); // Mark all as selected to prevent re-clicks

    // Show feedback
    const feedbackEl = optionEl.querySelector('.feedback');
    feedbackEl.textContent = selectedPrompt.feedback;
    feedbackEl.classList.remove('hidden');

    if (selectedPrompt.isCorrect) {
        optionEl.classList.add('correct');
    } else {
        optionEl.classList.add('incorrect');
        // Highlight the correct one
        const correctIndex = scenario.prompts.findIndex(p => p.isCorrect);
        simulatorContainer.querySelector(`.scenario-option[data-index='${correctIndex}']`).classList.add('correct');
    }

    document.getElementById('nextScenarioBtn').classList.remove('hidden');
}

// Next scenario button
if (e.target.id === 'nextScenarioBtn') {
    currentScenarioIndex++;
    loadScenario();
}
    });
}

// --- Case Study Logic ---
const caseStudyContainer = document.getElementById('case-study-container');

function initializeCaseStudies() {
    if (!caseStudyContainer) return;
    const caseStudyTabs = document.createElement('nav');
    caseStudyTabs.id = 'case-study-tabs';
    caseStudyTabs.className = '-mb-px flex space-x-8';
    caseStudyTabs.setAttribute('aria-label', 'Tabs');

    const caseStudyContent = document.createElement('div');
    caseStudyContent.id = 'case-study-content';
    caseStudyContent.className = 'mt-8';

    caseStudyContainer.innerHTML = '';
    caseStudyContainer.appendChild(caseStudyTabs);
    caseStudyContainer.appendChild(caseStudyContent);

    const categories = Object.keys(caseStudies);

    caseStudyTabs.innerHTML = categories.map((category, index) => `
<button class="case-study-tab ${index === 0 ? 'active' : ''}" data-category="${category}">${category}</button>
    `).join('');

    loadCaseStudy(categories[0]);

    caseStudyTabs.addEventListener('click', e => {
if (e.target.matches('.case-study-tab')) {
    const category = e.target.dataset.category;
    document.querySelectorAll('.case-study-tab').forEach(tab => tab.classList.remove('active'));
    e.target.classList.add('active');
    loadCaseStudy(category);
}
    });
}

function loadCaseStudy(category) {
    const caseStudyContent = document.getElementById('case-study-content');
    if (!caseStudyContent) return;
    const studySteps = caseStudies[category];
    let stepsHtml = studySteps.map((step, index) => `
<div class="timeline-step bg-white p-6 rounded-lg shadow-sm">
    <h4 class="font-bold text-lg text-[#4A90E2] mb-2">Step ${index + 1}: ${step.title}</h4>
    <p class="text-sm text-gray-500 italic mb-4">${step.description}</p>
    <div class="code-block text-xs">${step.prompt}</div>
</div>
${index < studySteps.length - 1 ? '<div class="timeline-connector"></div>' : ''}
    `).join('');

    caseStudyContent.innerHTML = `<div class="timeline-container">${stepsHtml}</div>`;
}

// --- "My Day with AI" Logic ---
const myDayContainer = document.getElementById('my-day-container');

function loadDayEvent(index) {
    if (!myDayContainer) return;

    if (index >= myDayEvents.length) {
myDayContainer.innerHTML = `
    <p class="text-center text-gray-600 text-2xl font-bold">You've completed your day!</p>
    <p class="text-center text-gray-500 mt-4">You've seen how a few smart prompts can save hours of work. You're ready to start integrating AI into your real workflow.</p>
    <div class="mt-6 text-center">
        <button id="restartDayBtn" class="bg-gray-600 text-white font-bold py-2 px-6 rounded-full hover:bg-gray-700 transition-colors">Start Day Over</button>
    </div>
`;
return;
    }

    const event = myDayEvents[index];
    let optionsHtml = event.options.map((opt, i) => `
<div class="scenario-option p-4 rounded-lg cursor-pointer" data-index="${i}">
    <p class="font-semibold">${opt.text}</p>
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

if(myDayContainer) {
    myDayContainer.addEventListener('click', e => {
const optionEl = e.target.closest('.scenario-option');
if (optionEl && !optionEl.classList.contains('selected')) {
    const selectedIndex = parseInt(optionEl.dataset.index);
    const event = myDayEvents[currentDayEventIndex];
    const selectedOption = event.options[selectedIndex];

    const allOptions = myDayContainer.querySelectorAll('.scenario-option');
    allOptions.forEach(opt => opt.classList.add('selected'));

    const feedbackEl = optionEl.querySelector('.feedback');
    feedbackEl.textContent = selectedOption.outcome;
    feedbackEl.classList.remove('hidden');
    optionEl.classList.add('correct');

    document.getElementById('nextDayEventBtn').classList.remove('hidden');
}

if (e.target.id === 'nextDayEventBtn') {
    currentDayEventIndex++;
    loadDayEvent(currentDayEventIndex);
}

if (e.target.id === 'restartDayBtn') {
    currentDayEventIndex = 0;
    loadDayEvent(currentDayEventIndex);
}
    });
}

// --- Animated Subtitle Logic ---
const animatedSubtitleEl = document.getElementById('animated-subtitle');
if (animatedSubtitleEl) {
    const subtitles = [
"Automate Tedious Reports...",
"Summarize Long Meetings...",
"Draft Professional Emails..."
    ];
    let subtitleIndex = 0;

    function cycleSubtitles() {
// Fade out the current text
animatedSubtitleEl.classList.remove('subtitle-animate-in');
animatedSubtitleEl.classList.add('subtitle-animate-out');

// After the fade-out is done, change the text and fade it in
setTimeout(() => {
    subtitleIndex = (subtitleIndex + 1) % subtitles.length;
    animatedSubtitleEl.textContent = subtitles[subtitleIndex];
    animatedSubtitleEl.classList.remove('subtitle-animate-out');
    animatedSubtitleEl.classList.add('subtitle-animate-in');
}, 500); // Match the animation duration
    }

    // Initial setup
    animatedSubtitleEl.textContent = subtitles[0];
    animatedSubtitleEl.classList.add('subtitle-animate-in');

    // Start the cycle
    setInterval(cycleSubtitles, 4000); // Change text every 4 seconds
}


// --- INITIAL LOAD ---
document.addEventListener('DOMContentLoaded', async () => {
    await initFirebase();
    updateSectionVisibility(); // Call after Firebase to ensure auth state is considered if needed later
    displayPrompts('All');
});
