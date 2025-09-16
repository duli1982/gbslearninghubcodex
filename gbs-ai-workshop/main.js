import { $, $$ } from '../shared/scripts/utils/dom-helpers.js';
import { initializeDropdown } from '../shared/scripts/components/dropdown.js';
import { initializeNavigation } from '../shared/scripts/components/navigation.js';
import { BackToTop } from '../shared/scripts/gbs-core.js';
import { ErrorBoundary } from './src/components/common/ErrorBoundary.js';

const coreErrorBoundary = new ErrorBoundary({
  id: 'gbs-ai-core',
  fallbackMessage: 'We hit a snag while initializing the page. Please refresh to try again.'
});

/**
 * Initializes all dropdown components on the page by finding
 * elements with the `data-dropdown` attribute.
 */
function initComponents() {
  coreErrorBoundary.guard(() => {
    const dropdownElements = $$('[data-dropdown]');
    dropdownElements.forEach(initializeDropdown);

    initializeNavigation();
  }, {
    message: 'We couldn\'t initialize the navigation controls. Some menus may not work until you refresh.',
    rethrow: false,
    context: { scope: 'core.initComponents' }
  });
}

/**
 * Initializes the back-to-top button functionality.
 */
function initBackToTopButton() {
  const backToTopBtn = $('#back-to-top');
  if (!backToTopBtn) return; // Exit if the button isn't on the page

  const SCROLL_THRESHOLD = 300;

  const toggleVisibility = () => {
    if (window.scrollY > SCROLL_THRESHOLD) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  backToTopBtn.addEventListener('click', scrollToTop);
  window.addEventListener('scroll', toggleVisibility, { passive: true });
  toggleVisibility(); // Initial check on page load
}

/**
 * Main function to set up the GBS AI Workshop page.
 * This function is the entry point for all JavaScript on the page.
 */
function main() {
  coreErrorBoundary.guard(() => {
    initComponents();
    new BackToTop();
    // NOTE: Other page-specific logic (like charts, simulators, etc.)
    // will be progressively moved from the inline script to this file or other modules.
    console.log("GBS AI Workshop page scripts initialized successfully.");
  }, {
    message: 'We couldn\'t initialize the workshop page. Please refresh and try again.',
    rethrow: false,
    context: { scope: 'core.main' }
  });
}

// Run the main function when the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', main);