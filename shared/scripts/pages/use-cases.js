// Helper: show/hide demo
function showDemo(demoType) {
    const demoSection = document.getElementById('demo-section');
    const demoContent = document.getElementById('demo-content');
    let content = '';

    if (demoType === 'sourcing-demo') {
        content = `
            <h3 class="text-xl font-bold mb-4">Boolean Search Generator Demo</h3>
            <div class="mb-4">
                <label class="block text-sm font-semibold mb-2">Job Title:</label>
                <input type="text" id="jobTitle" class="w-full p-3 border rounded-lg" placeholder="e.g., Senior Java Developer">
            </div>
            <div class="mb-4">
                <label class="block text-sm font-semibold mb-2">Required Skills (comma separated):</label>
                <input type="text" id="skills" class="w-full p-3 border rounded-lg" placeholder="e.g., microservices, Spring Boot, AWS">
            </div>
            <div class="flex gap-2">
                <button id="generateSearchBtn" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Generate Boolean Search</button>
                <button id="copySearchBtn" class="bg-gray-100 px-4 py-2 rounded-lg">Copy</button>
            </div>
            <div id="searchResult" class="mt-4 p-4 bg-gray-50 rounded-lg hidden">
                <h4 class="font-semibold mb-2">Generated Search String:</h4>
                <pre id="searchStringOutput" class="bg-white p-3 rounded border font-mono text-sm whitespace-pre-wrap"></pre>
            </div>
        `;
    } else if (demoType === 'content-demo') {
        content = `
            <h3 class="text-xl font-bold mb-4">Job Description Generator Demo</h3>
            <div class="mb-4">
                <label class="block text-sm font-semibold mb-2">Position:</label>
                <input type="text" id="position" class="w-full p-3 border rounded-lg" placeholder="e.g., Senior Software Engineer">
            </div>
            <div class="mb-4">
                <label class="block text-sm font-semibold mb-2">Company Type:</label>
                <select id="companyType" class="w-full p-3 border rounded-lg">
                    <option>Tech Startup</option>
                    <option>Enterprise</option>
                    <option>Consulting</option>
                    <option>Financial Services</option>
                </select>
            </div>
            <div class="flex gap-2">
                <button id="generateJDBtn" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Generate Job Description</button>
                <button id="copyJDBtn" class="bg-gray-100 px-4 py-2 rounded-lg">Copy</button>
            </div>
            <div id="jdResult" class="mt-4 p-4 bg-gray-50 rounded-lg hidden">
                <h4 class="font-semibold mb-2">Generated Job Description Preview:</h4>
                <div id="jdOutput" class="bg-white p-4 rounded border text-sm whitespace-pre-wrap"></div>
            </div>
        `;
    } else {
        content = `
            <h3 class="text-xl font-bold mb-4">Interactive Demo</h3>
            <p class="text-gray-600 mb-4">This demo shows how AI can streamline your workflow. Try the inputs above to see real-time results.</p>
            <div class="bg-blue-50 p-4 rounded-lg">
                <p class="text-blue-800">💡 <strong>Pro Tip:</strong> The more specific your input, the better the AI-generated output will be!</p>
            </div>
        `;
    }

    demoContent.innerHTML = content;
    demoSection.classList.remove('hidden');
    demoSection.scrollIntoView({ behavior: 'smooth' });

    // Attach event listeners for buttons inside demo content
    const genSearchBtn = document.getElementById('generateSearchBtn');
    if (genSearchBtn) genSearchBtn.addEventListener('click', generateSearch);

    const copySearchBtn = document.getElementById('copySearchBtn');
    if (copySearchBtn) copySearchBtn.addEventListener('click', () => {
        const out = document.getElementById('searchStringOutput').textContent;
        if (out) navigator.clipboard?.writeText(out);
    });

    const genJDBtn = document.getElementById('generateJDBtn');
    if (genJDBtn) genJDBtn.addEventListener('click', generateJD);

    const copyJDBtn = document.getElementById('copyJDBtn');
    if (copyJDBtn) copyJDBtn.addEventListener('click', () => {
        const out = document.getElementById('jdOutput').textContent;
        if (out) navigator.clipboard?.writeText(out);
    });
}

function hideDemo() {
    document.getElementById('demo-section').classList.add('hidden');
    document.getElementById('demo-content').innerHTML = '';
}

// Boolean search generator
function generateSearch() {
    const jobTitleEl = document.getElementById('jobTitle');
    if (!jobTitleEl) return;
    const jobTitle = jobTitleEl.value.trim();
    const skills = (document.getElementById('skills')?.value || '').trim();

    if (!jobTitle) return;

    // Build search: include the full phrase plus ORs for tokens
    const tokens = jobTitle.split(/\s+/).filter(Boolean);
    const phrase = `"${jobTitle}"`;
    const tokenOr = tokens.map(t => `"${t}"`).join(' OR ');
    let searchString = `(${phrase}${tokenOr ? ' OR ' + tokenOr : ''})`;

    if (skills) {
        const skillArray = skills.split(',')
            .map(s => s.trim())
            .filter(Boolean)
            .map(s => `"${s}"`);
        if (skillArray.length) {
            searchString += ` AND (${skillArray.join(' OR ')})`;
        }
    }

    searchString += ' -junior -intern';

    const result = document.getElementById('searchResult');
    const output = document.getElementById('searchStringOutput');
    if (output) output.textContent = searchString;
    if (result) result.classList.remove('hidden');
}

// Simple JD generator
function generateJD() {
    const position = (document.getElementById('position')?.value || '').trim();
    const companyType = (document.getElementById('companyType')?.value || '').trim();

    if (!position) return;

    const jdText = `
${position}

We are a leading ${companyType.toLowerCase()} looking for a talented ${position} to join our dynamic team.

Key Responsibilities:
• Lead technical initiatives and drive innovation
• Collaborate with cross-functional teams
• Mentor junior team members

Requirements:
• 5+ years of relevant experience
• Strong technical and communication skills
• Bachelor's degree in related field
    `.trim();

    const result = document.getElementById('jdResult');
    const out = document.getElementById('jdOutput');
    if (out) out.textContent = jdText;
    if (result) result.classList.remove('hidden');
}

// Filter functionality (no inline 'event' usage)
function filterCases(category, targetButton) {
    const cases = document.querySelectorAll('.case-item');
    const filters = document.querySelectorAll('.category-filter');

    // Update active filter classes
    filters.forEach(f => f.classList.remove('active'));
    if (targetButton) targetButton.classList.add('active');

    // Show/hide cases
    cases.forEach(c => {
        if (category === 'all' || c.dataset.category === category) {
            c.style.display = '';
        } else {
            c.style.display = 'none';
        }
    });
}

// DOM ready
document.addEventListener('DOMContentLoaded', function () {
    const filterButtons = document.querySelectorAll('#filters .category-filter');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const cat = btn.getAttribute('data-filter') || 'all';
            filterCases(cat, btn);
        });
    });

    const demoButtons = document.querySelectorAll('.demo-btn');
    demoButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const demoType = btn.getAttribute('data-demo');
            showDemo(demoType);
        });
    });

    const demoClose = document.getElementById('demo-close');
    if (demoClose) demoClose.addEventListener('click', hideDemo);
});
