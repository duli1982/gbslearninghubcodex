export const $ = (sel, parent = document) => parent.querySelector(sel);
export const $$ = (sel, parent = document) => [...parent.querySelectorAll(sel)];
export const qs = $;
export const qsa = (sel, parent) => $$(sel, parent);
