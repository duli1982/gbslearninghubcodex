/**
 * A utility module for DOM manipulation.
 * @module DomHelpers
 */

/**
 * Finds the first element that matches a specified CSS selector.
 * Throws an error if the element is not found and `required` is true.
 * @param {string} selector - The CSS selector to match.
 * @param {object} [options] - Optional parameters.
 * @param {Element} [options.parent=document] - The parent element to search within.
 * @param {boolean} [options.required=false] - Whether to throw an error if the element is not found.
 * @returns {Element|null} The found element, or null if not found and not required.
 */
export function qs(selector, { parent = document, required = false } = {}) {
  const element = parent.querySelector(selector);
  if (!element && required) {
    throw new Error(`Required element with selector "${selector}" not found in parent.`);
  }
  return element;
}

/**
 * Finds all elements that match a specified CSS selector.
 * @param {string} selector - The CSS selector to match.
 * @param {Element} [parent=document] - The parent element to search within.
 * @returns {NodeListOf<Element>} A static NodeList containing all found elements.
 */
export function qsa(selector, parent = document) {
  return parent.querySelectorAll(selector);
}

/**
 * A safe way to get an element, logging an error if it's not found without stopping execution.
 * This is useful for non-critical elements where a failure is not catastrophic.
 * @param {string} selector - The CSS selector for the element.
 * @param {Element} [parent=document] - The parent element to search within.
 * @returns {Element|null} The element or null if not found.
 */
export function getElement(selector, parent = document) {
    const element = parent.querySelector(selector);
    if (!element) {
        console.error(`Error: Element with selector "${selector}" was not found.`);
    }
    return element;
}
