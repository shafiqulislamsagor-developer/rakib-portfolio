import { cache } from "react";
import { getHomeProjects, getProfile, getPublishedPages, getPublishedPosts, getSiteSettings } from "@/lib/content/public";
import { navColumns, navProjects } from "@/lib/design";

/**
 * The navigation and footer appear on every public page with the same content
 * and only their geometry changing, so both read their props from here.
 * Links to sections that have nothing in them yet are dropped, which is why
 * the posts and pages collections are consulted too.
 */
export const getChrome = cache(async () => {
  const [settings, profile, projects, posts, pages] = await Promise.all([
    getSiteSettings(),
    getProfile(),
    getHomeProjects(),
    getPublishedPosts(),
    getPublishedPages(),
  ]);

  const visible = navColumns({
    ...settings,
    navigation: settings.navigation.filter((item) => item.href !== "/blog" || posts.length > 0),
  });

  return {
    nav: {
      columns: visible,
      projects: navProjects(projects),
    },
    footer: {
      email: profile.email,
      phone: profile.phone,
      siteName: settings.siteName,
      menuLinks: visible.flat(),
      socialLinks: profile.socials
        .filter((social) => social.url)
        .map((social) => ({ label: social.label || social.platform, href: social.url })),
      legalLinks: pages
        .filter((page) => page.showInFooter)
        .map((page) => ({ label: page.title, href: `/${page.slug}` })),
    },
  };
});
