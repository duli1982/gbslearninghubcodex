export const $ = (sel, parent = document) => parent.querySelector(sel);
export const $$ = (sel, parent = document) => [...parent.querySelectorAll(sel)];
export const qs = $;
export const qsa = (sel, parent = document) => $$(sel, parent);

export const requireElement = (sel, parent = document) => {
  const element = $(sel, parent);
  if (!element) {
    const scope = parent === document ? 'document' : 'parent element';
    throw new Error(`Required element with selector "${sel}" not found in ${scope}.`);
  }
  return element;
};
