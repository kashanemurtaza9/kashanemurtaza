// One-time content updates applied to the saved site content the first time it is read after a deploy.
// Each step checks the content first, so running it again changes nothing.
const OLD_TITLE = 'Tech-Driven Growth & Operations Specialist';
const NEW_TITLE = 'Business Manager · Operations & Digital Marketing';
const ROLE_Q = 'What is your current role?';
const ROLE_A = 'I work as a Business Manager in e-commerce, where I coordinate day-to-day operations, online store and product listings, orders and customer inquiries, the product catalog and stock, and market and competitor research.';

export function migrate(state) {
  if (!state || !state.profile) return false;
  const p = state.profile;
  let changed = false;
  if (p.title === OLD_TITLE || /^\s*tech-driven growth & operations( specialist)?\s*$/i.test(p.title || '')) { p.title = NEW_TITLE; changed = true; }
  if (Array.isArray(p.faq) && p.faq.length && !p.faq.some((f) => /business manager/i.test((f && (f.q + ' ' + f.a)) || ''))) {
    p.faq.splice(1, 0, { q: ROLE_Q, a: ROLE_A });
    changed = true;
  }
  return changed;
}
