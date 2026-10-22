// One-time content updates applied to the saved site content the first time it is read after a deploy.
// Each step checks the content first, so running it again changes nothing.
const OLD_TITLE = 'Tech-Driven Growth & Operations Specialist';
const NEW_TITLE = 'Business Manager · Operations & Digital Marketing';
const ROLE_Q = 'What is your current role?';
const ROLE_A = 'I work as a Business Manager in e-commerce, where I coordinate day-to-day operations, online store and product listings, orders and customer inquiries, the product catalog and stock, and market and competitor research.';

const NEW_CAPS = [{"title": "E-commerce Operations", "text": "Daily operations from order to delivery: inventory, fulfilment, returns and customer support, run smoothly and on time.", "keywords": "Order management, Inventory, Fulfilment, Customer support"}, {"title": "Social Media & Meta Ads", "text": "Social content and paid campaigns, planned around clear goals and measured on results such as ROAS.", "keywords": "Content planning, Meta Ads, Campaign management, ROAS"}, {"title": "AI Content Creation", "text": "AI video and visual ads with clear storytelling and a consistent brand look, made for commercial use.", "keywords": "AI video, Ad creatives, Prompt design, Brand consistency"}, {"title": "Product & Market Research", "text": "Product, market and competitor research that turns data into confident business decisions.", "keywords": "Product selection, Market research, Competitor analysis, Positioning"}, {"title": "AI Workflow Integration", "text": "AI tools built into everyday workflows to save time and raise the quality of output.", "keywords": "Workflow automation, AI tools, Process improvement"}];

export function migrate(state) {
  if (!state || !state.profile) return false;
  const p = state.profile;
  let changed = false;
  if (typeof p.title === 'string' && /tech\W{0,3}driven\W+growth/i.test(p.title) && !/business manager/i.test(p.title)) { p.title = NEW_TITLE; changed = true; }
  if (Array.isArray(p.faq) && p.faq.length && !p.faq.some((f) => /business manager/i.test((f && (f.q + ' ' + f.a)) || ''))) {
    p.faq.splice(1, 0, { q: ROLE_Q, a: ROLE_A });
    changed = true;
  }
  if (Array.isArray(p.caps) && p.caps.some((c) => c && /operations management & workflow automation/i.test(c.title || ''))) {
    p.caps = NEW_CAPS.map((c) => ({ ...c }));
    changed = true;
  }
  return changed;
}
