const CATEGORIES = ['Business Management', 'Marketing and Growth', 'AI Videos & Creative', 'Research'];
const MEDIA_OK = /^(https:\/\/[^\s"'<>]+|\/media\/[A-Za-z0-9._\-\/]+)$/;
const IMAGE_OK = /^(data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+\/=]+|https:\/\/[^\s"'<>]+|\/media\/[A-Za-z0-9._\-\/]+)$/;

function str(v) { return typeof v === 'string'; }

/** Light structural validation of the content document. Returns an error string or null. */
export function validateState(s) {
  if (!s || typeof s !== 'object' || Array.isArray(s)) return 'State must be an object.';
  if (!s.profile || typeof s.profile !== 'object') return 'Missing profile.';
  if (!Array.isArray(s.projects)) return 'Missing projects list.';
  if (s.projects.length > 200) return 'Too many projects.';
  const p = s.profile;
  for (const k of ['name', 'fullName', 'tagline', 'title', 'headlineA', 'headlineB', 'headlineEm', 'intro', 'about', 'location', 'email', 'linkedin', 'fiverr', 'skills', 'resumeLabel',
    'aboutHeading', 'contactEyebrow', 'contactHeadA', 'contactHeadEm', 'contactText', 'contactButton', 'scrollLabel',
    'navServices', 'navProjects', 'navAbout', 'navExperience', 'servicesHeadA', 'servicesHeadEm', 'servicesTag']) {
    if (p[k] !== undefined && !str(p[k])) return 'Profile field "' + k + '" must be text.';
  }
  if (p.heroVideo && !(str(p.heroVideo) && MEDIA_OK.test(p.heroVideo))) return 'Hero video must be an https URL or a /media path.';
  if (p.resumeUrl && !(str(p.resumeUrl) && MEDIA_OK.test(p.resumeUrl))) return 'Resume link must be an https URL or a /media path.';
  for (const k of ['photo', 'heroPoster']) if (p[k] && !(str(p[k]) && IMAGE_OK.test(p[k]))) return 'Profile image "' + k + '" is not a valid image.';
  if (!Array.isArray(p.experience)) return 'Missing experience list.';
  if (p.caps !== undefined) {
    if (!Array.isArray(p.caps) || p.caps.length > 30) return 'The What I do list is not valid.';
    for (const c of p.caps) if (!c || !str(c.title) || !str(c.text) || !str(c.keywords)) return 'Every What I do area needs a title, text and keywords.';
  }
  const ids = new Set();
  for (const x of s.projects) {
    if (!x || typeof x !== 'object') return 'Bad project entry.';
    if (!str(x.id) || !x.id || ids.has(x.id)) return 'Every project needs a unique id.';
    ids.add(x.id);
    if (!str(x.title)) return 'Project title must be text.';
    if (!CATEGORIES.includes(x.category)) return 'Unknown category on project "' + x.title + '".';
    if (x.status !== 'published' && x.status !== 'draft') return 'Bad status on project "' + x.title + '".';
    if (x.video && !(str(x.video) && MEDIA_OK.test(x.video))) return 'Video of "' + x.title + '" must be an https URL or a /media path.';
    if (x.cover && !(str(x.cover) && IMAGE_OK.test(x.cover))) return 'Cover of "' + x.title + '" is not a valid image.';
  }
  return null;
}
