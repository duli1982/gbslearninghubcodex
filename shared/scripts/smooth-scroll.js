/**
 * Smoothly scrolls to an anchor on the page if one is present in the URL.
 * This script is designed to be included in pages that have content sections with IDs.
 */
document.addEventListener('DOMContentLoaded', () => {
  // Check if there is a hash in the URL (e.g., #section-id)
  if (window.location.hash) {
    try {
      const id = decodeURIComponent(window.location.hash.substring(1));
      const element = document.getElementById(id);

      if (element) {
        // A small timeout is used to ensure that the browser's default instant jump
        // behavior is overridden by our smooth scroll.
        setTimeout(() => {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
          });
        }, 100); // 100ms delay is usually sufficient
      }
    } catch (e) {
      console.error('Error trying to scroll to anchor:', e);
    }
  }
});
