import { EmptyState, PageHeader, Panel, StatusBadge } from "@/app/admin/_components/ui";
import { adminPage } from "@/lib/admin/page";
import { param, searchRegex } from "@/lib/admin/paginate";
import { Education, Experience, Faq, Message, Page, Post, Project, Service, Skill, Testimonial } from "@/lib/db/models";
import { relativeTime } from "@/lib/format";
import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Search" };

export default async function AdminSearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await adminPage();
  const q = param((await searchParams).q);
  if (!q) {
    return (
      <>
        <PageHeader title="Search" />
        <EmptyState icon={Search} title="Search everything" description="Use the search box in the header to find projects, posts, messages and more." />
      </>
    );
  }
  const rx = searchRegex(q);
  const [projects, posts, messages, skills, experience, education, services, testimonials, faqs, pages] = await Promise.all([
    Project.find({ $or: [{ title: rx }, { summary: rx }, { technologies: rx }, { slug: rx }] }).select("title status slug").limit(10).lean(),
    Post.find({ $or: [{ title: rx }, { excerpt: rx }, { tags: rx }, { slug: rx }] }).select("title status slug").limit(10).lean(),
    Message.find({ $or: [{ name: rx }, { email: rx }, { subject: rx }, { message: rx }] }).select("name subject status createdAt").sort({ createdAt: -1 }).limit(10).lean(),
    Skill.find({ name: rx }).select("name category").limit(10).lean(),
    Experience.find({ $or: [{ title: rx }, { company: rx }] }).select("title company").limit(10).lean(),
    Education.find({ $or: [{ title: rx }, { institution: rx }] }).select("title institution").limit(10).lean(),
    Service.find({ $or: [{ title: rx }, { summary: rx }] }).select("title status").limit(10).lean(),
    Testimonial.find({ $or: [{ name: rx }, { company: rx }, { quote: rx }] }).select("name company status").limit(10).lean(),
    Faq.find({ $or: [{ question: rx }, { answer: rx }] }).select("question status").limit(10).lean(),
    Page.find({ $or: [{ title: rx }, { slug: rx }, { content: rx }] }).select("title slug status").limit(10).lean(),
  ]);
  const total =
    projects.length + posts.length + messages.length + skills.length + experience.length + education.length +
    services.length + testimonials.length + faqs.length + pages.length;

  const groups = [
    { title: "Projects", items: projects.map((item) => ({ href: `/admin/projects/${item._id}`, label: item.title, meta: `/projects/${item.slug}`, status: item.status })) },
    { title: "Blog posts", items: posts.map((item) => ({ href: `/admin/blog/${item._id}`, label: item.title, meta: `/blog/${item.slug}`, status: item.status })) },
    {
      title: "Messages",
      items: messages.map((item) => ({ href: `/admin/messages/${item._id}`, label: item.subject, meta: `${item.name} · ${relativeTime(item.createdAt.toISOString())}`, status: item.status })),
    },
    { title: "Skills", items: skills.map((item) => ({ href: "/admin/skills", label: item.name, meta: item.category, status: undefined })) },
    { title: "Experience", items: experience.map((item) => ({ href: `/admin/experience/${item._id}`, label: item.title, meta: item.company, status: undefined })) },
    { title: "Education", items: education.map((item) => ({ href: `/admin/education/${item._id}`, label: item.title, meta: item.institution, status: undefined })) },
    { title: "Services", items: services.map((item) => ({ href: `/admin/services/${item._id}`, label: item.title, meta: "Service", status: item.status })) },
    { title: "Testimonials", items: testimonials.map((item) => ({ href: `/admin/testimonials/${item._id}`, label: item.name, meta: item.company, status: item.status })) },
    { title: "FAQs", items: faqs.map((item) => ({ href: `/admin/faqs/${item._id}`, label: item.question, meta: "FAQ", status: item.status })) },
    { title: "Pages", items: pages.map((item) => ({ href: `/admin/pages/${item._id}`, label: item.title, meta: `/${item.slug}`, status: item.status })) },
  ].filter((group) => group.items.length);

  return (
    <>
      <PageHeader title={`Results for “${q}”`} description={`${total} match${total === 1 ? "" : "es"} (up to 10 per type)`} />
      {groups.length === 0 ? (
        <EmptyState icon={Search} title="No matches" description="Try a different word or check the spelling." />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {groups.map((group) => (
            <Panel key={group.title} title={group.title}>
              <ul className="divide-y divide-border">
                {group.items.map((item) => (
                  <li key={item.href + item.label}>
                    <Link href={item.href} className="flex items-center justify-between gap-3 py-2.5 hover:text-primary">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{item.label}</span>
                        <span className="block truncate text-xs text-muted-foreground">{item.meta}</span>
                      </span>
                      {item.status && <StatusBadge status={item.status} />}
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          ))}
        </div>
      )}
    </>
  );
}
