import { faqs as catalogFaqs } from './catalog';
import { extraFaqs } from './pages';

export { siteSettings, offices, stats, accreditations } from './site';
export { destinations, services, testPrepCourses, navItems } from './catalog';
export { homeContent, features, testimonials, partners } from './home';
export { counsellors, pages } from './pages';
export const faqs = [...catalogFaqs, ...extraFaqs];
export { scholarships, englishRequirements, gradingScales, toolContents, toolsConfig } from './tools';
export { universities, events } from './trust';
export { availability, availabilityExceptions, bookingSettings } from './booking';
