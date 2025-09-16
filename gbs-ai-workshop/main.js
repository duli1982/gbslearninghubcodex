import { qs, qsa } from '../shared/scripts/utils/dom-helpers.js';
import { initializeDropdown } from '../shared/scripts/components/dropdown.js';
import { initializeNavigation } from '../shared/scripts/components/navigation.js';
import { BackToTop } from '../shared/scripts/gbs-core.js';

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
 * Main function to set up the GBS AI Workshop page.
 * This function is the entry point for all JavaScript on the page.
 */
function main() {
  try {
    initComponents();
    new BackToTop();
    // NOTE: Other page-specific logic (like charts, simulators, etc.)
    // will be progressively moved from the inline script to this file or other modules.
    console.log("GBS AI Workshop page scripts initialized successfully.");
  } catch (error) {
    console.error("Failed to initialize GBS AI Workshop page:", error);
  }
}

// Run the main function when the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', main);
