import { qs, qsa } from '../utils/dom-helpers.js';

/**
 * A reusable mobile navigation component.
 * It expects elements with the following data-attributes:
 * - `data-mobile-menu-button`: The button to open the menu.
 * - `data-mobile-menu`: The menu container.
 * - `data-mobile-menu-overlay`: The screen overlay.
 * - `data-mobile-menu-close`: The button to close the menu.
 * - `data-mobile-menu-item`: Links inside the menu that should close it on click.
 *
 * @example
 * // JS initialization
 * import { initializeNavigation } from './components/navigation.js';
 * initializeNavigation();
 */
export function initializeNavigation() {
  try {
    const openBtn = qs('[data-mobile-menu-button]', { required: true });
    const menu = qs('[data-mobile-menu]', { required: true });
    const overlay = qs('[data-mobile-menu-overlay]', { required: true });
    const closeBtn = qs('[data-mobile-menu-close]', { required: true });
    const menuItems = qsa('[data-mobile-menu-item]', menu);

    /**
     * Opens the mobile menu and overlay.
     */
    const openMenu = () => {
      menu.classList.add('active');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    };

    /**
     * Closes the mobile menu and overlay.
     */
    const closeMenu = () => {
      menu.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = ''; // Restore background scrolling
    };

    // Event listeners
    openBtn.addEventListener('click', openMenu);
    closeBtn.addEventListener('click', closeMenu);
    overlay.addEventListener('click', closeMenu);

    // Close menu when a link inside is clicked
    menuItems.forEach(item => {
      item.addEventListener('click', closeMenu);
    });

    // Close menu on 'Escape' key press
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('active')) {
        closeMenu();
      }
    });

    // Close menu if window is resized to a desktop width
    window.addEventListener('resize', () => {
      if (window.innerWidth >= 768 && menu.classList.contains('active')) {
        closeMenu();
      }
    });

  } catch (error) {
    // Log error but don't break the entire site if the mobile menu fails to initialize
    console.error(`[Navigation] Failed to initialize mobile menu: ${error.message}`);
  }
}
