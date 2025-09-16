var submitted = false;

// Function to show success message after form submission
function showSuccessMessage() {
    if (submitted) {
        document.getElementById('feedbackForm').style.display = 'none';
        document.getElementById('successMessage').classList.remove('hidden');
        document.getElementById('successMessage').scrollIntoView({ behavior: 'smooth' });
    }
}

// Handle form submission
document.getElementById('feedbackForm').addEventListener('submit', function(e) {
    submitted = true;
    // Form will submit to Google Forms automatically
    // Success message will show when iframe loads
});
