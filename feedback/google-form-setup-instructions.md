\# Google Form Setup Instructions



\## Step 1: Create Google Form

1\. Go to \[forms.google.com](https://forms.google.com)

2\. Create new form: "Randstad GBS Learning Hub - Feedback"

3\. Add these questions in exact order:



\### Question 1: Feedback Type (Multiple choice, Required)

Options:

\- General Feedback

\- Bug Report

\- Feature Request

\- Content Suggestion

\- Training Program Feedback

\- Other



\### Question 2: Related Page/Section (Multiple choice, Optional)

Options:

\- RPO AI Acceleration Program

\- Guide for GBS Leaders

\- Daily Sourcing Focus

\- GBS Prompt Library

\- Knowledge Content

\- AI SME

\- Sourcing Workshop

\- General Site



\### Question 3: Your Name (Short answer, Required)



\### Question 4: Email Address (Short answer, Required)



\### Question 5: Department/Role (Short answer, Optional)



\### Question 6: Overall Experience Rating (Multiple choice, Optional)

Options:

\- Excellent

\- Good

\- Average

\- Poor

\- Very Poor



\### Question 7: Your Feedback (Paragraph, Required)



\### Question 8: Suggestions for Improvement (Paragraph, Optional)



\## Step 2: Get Form Action URL

1\. Click "Send" button in your form

2\. Click the link icon (<>)

3\. Copy the form URL (looks like: https://docs.google.com/forms/d/e/FORM\_ID/viewform)

4\. Replace `/viewform` with `/formResponse` to get action URL



\## Step 3: Get Entry IDs

1\. Go to your form's preview/live version

2\. Right-click and select "View Page Source"

3\. Search for "entry." to find field names like:

&nbsp;  - entry.123456789 (for feedback type)

&nbsp;  - entry.987654321 (for related section)

&nbsp;  - etc.



\## Step 4: Update HTML Form

Replace these placeholders in feedback/index.html:



\- `YOUR\_GOOGLE\_FORM\_ACTION\_URL` → Your form's /formResponse URL

\- `FEEDBACK\_TYPE\_ENTRY\_ID` → entry ID for feedback type question

\- `RELATED\_SECTION\_ENTRY\_ID` → entry ID for related section question

\- `NAME\_ENTRY\_ID` → entry ID for name question

\- `EMAIL\_ENTRY\_ID` → entry ID for email question

\- `DEPARTMENT\_ENTRY\_ID` → entry ID for department question

\- `RATING\_ENTRY\_ID` → entry ID for rating question

\- `MESSAGE\_ENTRY\_ID` → entry ID for feedback message question

\- `SUGGESTIONS\_ENTRY\_ID` → entry ID for suggestions question



\## Step 5: Connect to Google Sheets

1\. In your Google Form, click "Responses" tab

2\. Click the Google Sheets icon to create a connected spreadsheet

3\. All form submissions will automatically appear in this sheet



\## Example Entry IDs (yours will be different):

```

entry.1234567890 - Feedback Type

entry.0987654321 - Related Section

entry.1122334455 - Name

entry.5544332211 - Email

entry.9988776655 - Department

entry.1357924680 - Rating

entry.0864213579 - Message

entry.2468135790 - Suggestions

```

