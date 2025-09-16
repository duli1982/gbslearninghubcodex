import { qs } from '../utils/dom-helpers.js';

/**
 * A reusable dropdown component.
 * It expects a container element with a `data-dropdown` attribute.
 * Inside the container, it looks for a button with `data-dropdown-button`
 * and a menu with `data-dropdown-menu`.
 *
 * @example
 * <!-- HTML structure -->
 * <div data-dropdown>
 *   <button data-dropdown-button>Open</button>
 *   <div data-dropdown-menu class="hidden">
 *     <a href="#">Item 1</a>
 *     <a href="#">Item 2</a>
 *   </div>
 * </div>
 *
 * // JS initialization
 * import { initializeDropdown } from './components/dropdown.js';
 * const dropdowns = document.querySelectorAll('[data-dropdown]');
 * dropdowns.forEach(initializeDropdown);
 */

/**
 * Initializes a single dropdown component, adding event listeners for interaction.
 * @param {Element} dropdownElement The container element for the dropdown.
 */
export function initializeDropdown(dropdownElement) {
  try {
    const button = qs('[data-dropdown-button]', { parent: dropdownElement, required: true });
    const menu = qs('[data-dropdown-menu]', { parent: dropdownElement, required: true });

    /**
     * Toggles the visibility of the dropdown menu with animations.
     */
    const toggleMenu = () => {
      const isHidden = menu.classList.contains('hidden');
      if (isHidden) {
        // Show menu
        menu.classList.remove('hidden');
        // A small delay to allow the 'hidden' class to be removed before starting the transition
        setTimeout(() => {
          menu.classList.remove('opacity-0', 'scale-95');
          menu.classList.add('opacity-100', 'scale-100');
        }, 10);
      } else {
        // Hide menu
        menu.classList.remove('opacity-100', 'scale-100');
        menu.classList.add('opacity-0', 'scale-95');
        // Wait for the transition to finish before adding 'hidden'
        setTimeout(() => {
          menu.classList.add('hidden');
        }, 150); // Transition duration is 100ms, 150ms gives a buffer
      }
    };

    // Toggle dropdown when the button is clicked
    button.addEventListener('click', (event) => {
      event.stopPropagation(); // Prevents the window click listener from immediately closing the menu
      toggleMenu();
    });

    // Close dropdown when clicking anywhere else on the page
    window.addEventListener('click', (event) => {
      if (!dropdownElement.contains(event.target) && !menu.classList.contains('hidden')) {
        toggleMenu();
      }
    });

    // Close dropdown when an item inside the menu is clicked
    menu.addEventListener('click', () => {
        if (!menu.classList.contains('hidden')) {
            toggleMenu();
        }
    });

  } catch (error) {
    console.error(`[Dropdown] Failed to initialize: ${error.message}`);
  }
}
