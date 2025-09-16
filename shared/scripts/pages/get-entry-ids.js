function extractEntryIds() {
    const formUrl = document.getElementById('formUrl').value;

    if (!formUrl || !formUrl.includes('docs.google.com/forms')) {
        alert('Please enter a valid Google Forms URL');
        return;
    }

    // Create action URL
    const actionUrl = formUrl.replace('/viewform', '/formResponse');
    document.getElementById('actionUrl').textContent = actionUrl;

    // Show instructions for manual extraction
    const entryIdsDiv = document.getElementById('entryIds');
    entryIdsDiv.innerHTML = `
    <p><strong>To get the entry IDs:</strong></p>
    <ol>
    <li>Open your form in a new tab: <a href="${formUrl}" target="_blank">Click here</a></li>
    <li>Right-click on the page and select "View Page Source"</li>
    <li>Press Ctrl+F (or Cmd+F) and search for "entry."</li>
    <li>Look for patterns like <code>entry.123456789</code></li>
    <li>Copy the entry IDs and replace the placeholders below:</li>
    </ol>

    <div class="code">
    <strong>Replace these in your feedback/index.html:</strong><br>
    FEEDBACK_TYPE_ENTRY_ID → entry.XXXXXXXXX (first entry ID you find)<br>
    RELATED_SECTION_ENTRY_ID → entry.XXXXXXXXX (second entry ID)<br>
    NAME_ENTRY_ID → entry.XXXXXXXXX (third entry ID)<br>
    EMAIL_ENTRY_ID → entry.XXXXXXXXX (fourth entry ID)<br>
    DEPARTMENT_ENTRY_ID → entry.XXXXXXXXX (fifth entry ID)<br>
    RATING_ENTRY_ID → entry.XXXXXXXXX (sixth entry ID)<br>
    MESSAGE_ENTRY_ID → entry.XXXXXXXXX (seventh entry ID)<br>
    SUGGESTIONS_ENTRY_ID → entry.XXXXXXXXX (eighth entry ID)
    </div>

    <p><strong>Example:</strong> If you find <code>entry.1234567890</code>, replace <code>FEEDBACK_TYPE_ENTRY_ID</code> with <code>1234567890</code></p>
    `;

    document.getElementById('results').style.display = 'block';
}
