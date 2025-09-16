import { qs, qsa } from '../shared/scripts/utils/dom-helpers.js';
import { initializeDropdown } from '../shared/scripts/components/dropdown.js';
import { initializeNavigation } from '../shared/scripts/components/navigation.js';

/**
 * Initializes all dropdown components on the page by finding
 * elements with the `data-dropdown` attribute.
 */
function initComponents() {
  try {
    // Initialize all dropdowns
    const dropdownElements = qsa('[data-dropdown]');
    dropdownElements.forEach(initializeDropdown);

    // Initialize mobile navigation
    initializeNavigation();

  } catch (error) {
    console.error("Error initializing core components:", error);
  }
}

/**
 * Initializes the back-to-top button functionality.
 */
function initBackToTopButton() {
  const backToTopBtn = qs('#back-to-top');
  if (!backToTopBtn) return; // Exit if the button isn't on the page

  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  backToTopBtn.addEventListener('click', scrollToTop);
  window.addEventListener('scroll', toggleVisibility);
  toggleVisibility(); // Initial check on page load
}

/**
 * Main function to set up the GBS AI Workshop page.
 * This function is the entry point for all JavaScript on the page.
 */
function main() {
  try {
    initComponents();
    initBackToTopButton();
    // NOTE: Other page-specific logic (like charts, simulators, etc.)
    // will be progressively moved from the inline script to this file or other modules.
    console.log("GBS AI Workshop page scripts initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize GBS AI Workshop page:", error);
  }
}

// Run the main function when the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', main);
