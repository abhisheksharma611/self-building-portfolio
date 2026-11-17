/**
 * Where this site lives.
 *
 * Set NEXT_PUBLIC_SITE_URL to the deployment domain (or a local URL while developing).
 * Nothing else in the project hard-codes a domain: the metadata, the Open Graph tags,
 * the sitemap and robots.txt all read it from here.
 */
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
