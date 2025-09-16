const DEFAULT_SELECTOR = '[data-back-to-top], #back-to-top, #scroll-to-top';

/**
 * Handles toggling visibility and scroll behaviour for a "back to top" button.
 */
export class BackToTop {
  /**
   * @param {object} [options]
   * @param {string|Element} [options.target='[data-back-to-top], #back-to-top, #scroll-to-top'] -
   *   The selector or element for the back to top trigger.
   * @param {number} [options.threshold=300] - Scroll distance before the button becomes visible.
   * @param {string} [options.visibleClass='visible'] - Class toggled when the button should be visible.
   * @param {ScrollBehavior} [options.behavior='smooth'] - Scroll behaviour used when returning to the top.
   * @param {Window|Element} [options.scrollContainer=window] - Scroll container to observe.
   */
  constructor({
    target = DEFAULT_SELECTOR,
    threshold = 300,
    visibleClass = 'visible',
    behavior = 'smooth',
    scrollContainer = window,
  } = {}) {
    this.scrollContainer = scrollContainer;
    this.threshold = threshold;
    this.visibleClass = visibleClass;
    this.behavior = behavior;

    this.button = typeof target === 'string' ? document.querySelector(target) : target;

    if (!this.button) {
      console.warn(`[BackToTop] No trigger found for selector: ${target}`);
      return;
    }

    if (this.button.dataset.backToTopInitialized === 'true') {
      return;
    }

    this.button.dataset.backToTopInitialized = 'true';

    if (this.button instanceof HTMLButtonElement && !this.button.hasAttribute('type')) {
      this.button.type = 'button';
    }

    this.handleScroll = this.handleScroll.bind(this);
    this.handleClick = this.handleClick.bind(this);

    this.attachListeners();
    this.handleScroll();
  }

  attachListeners() {
    if (!this.button) return;

    this.scrollContainer.addEventListener('scroll', this.handleScroll, { passive: true });
    this.button.addEventListener('click', this.handleClick);
  }

  handleScroll() {
    if (!this.button) return;

    const offset = this.getScrollOffset();
    if (offset > this.threshold) {
      this.button.classList.add(this.visibleClass);
      this.button.setAttribute('aria-hidden', 'false');
    } else {
      this.button.classList.remove(this.visibleClass);
      this.button.setAttribute('aria-hidden', 'true');
    }
  }

  handleClick(event) {
    if (!this.button) return;

    event.preventDefault();
    this.scrollToTop();
  }

  getScrollOffset() {
    if (this.scrollContainer === window) {
      return window.pageYOffset || document.documentElement.scrollTop || 0;
    }
    return this.scrollContainer.scrollTop || 0;
  }

  scrollToTop() {
    const behavior = this.behavior;
    if (this.scrollContainer === window) {
      window.scrollTo({ top: 0, behavior });
    } else {
      this.scrollContainer.scrollTo({ top: 0, behavior });
    }
  }

  destroy() {
    if (!this.button) return;

    this.scrollContainer.removeEventListener('scroll', this.handleScroll);
    this.button.removeEventListener('click', this.handleClick);
    this.button.classList.remove(this.visibleClass);
    delete this.button.dataset.backToTopInitialized;
  }
}

export default BackToTop;
