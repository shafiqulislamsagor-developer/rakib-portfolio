import CareerList from "@/app/admin/_components/career-list";
import { PageHeader, Panel } from "@/app/admin/_components/ui";
import { Button } from "@/components/ui/button";
import { adminPage } from "@/lib/admin/page";
import { param } from "@/lib/admin/paginate";
import { Service, Settings } from "@/lib/db/models";
import { toService, toSettings } from "@/lib/db/serialize";
import { ExternalLink, Handshake, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import ProcessForm from "./process-form";

export const metadata: Metadata = { title: "Services" };

export default async function ServicesAdminPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await adminPage();
  const status = param((await searchParams).status) === "archived" ? "archived" : "active";
  const [docs, active, archived, settingsDoc] = await Promise.all([
    Service.find({ status }).sort({ order: 1, createdAt: 1 }).lean(),
    Service.countDocuments({ status: "active" }),
    Service.countDocuments({ status: "archived" }),
    Settings.findOne({ key: "main" }).select("process").lean(),
  ]);
  const services = docs.map(toService);
  const settings = toSettings(settingsDoc);

  return (
    <>
      <PageHeader
        icon={Handshake}
        title="Services"
        description="What you offer. Featured services appear on the homepage; all active services and your process appear on /services."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <a href="/services" target="_blank" rel="noreferrer">
                <ExternalLink /> View page
              </a>
            </Button>
            <Button asChild>
              <Link href="/admin/services/new">
                <Plus /> Add service
              </Link>
            </Button>
          </>
        }
      />
      <CareerList
        kind="service"
        basePath="/admin/services"
        status={status}
        counts={{ active, archived }}
        icon={Handshake}
        emptyTitle="No services yet"
        emptyDescription="Describe the kinds of work you take on."
        rows={services.map((service) => ({
          id: service.id,
          title: service.title,
          subtitle: service.summary || "—",
          meta: `${service.deliverables.length} deliverable(s) · icon: ${service.icon}`,
          status: service.status,
          badge: service.featured ? "Homepage" : undefined,
        }))}
      />
      <Panel title="Work process" description="The numbered steps shown on /services under “How we'll work together”." className="mt-8">
        <ProcessForm initial={{ process: settings.process }} />
      </Panel>
    </>
  );
}
