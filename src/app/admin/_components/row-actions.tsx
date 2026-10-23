"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/types/content";
import {
  Archive,
  ArchiveRestore,
  ArrowDown,
  ArrowUp,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  MailCheck,
  MoreHorizontal,
  Pencil,
  Send,
  ShieldAlert,
  Star,
  StarOff,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

const ICONS = {
  edit: Pencil,
  view: ExternalLink,
  duplicate: Copy,
  archive: Archive,
  restore: ArchiveRestore,
  publish: Send,
  unpublish: EyeOff,
  show: Eye,
  delete: Trash2,
  up: ArrowUp,
  down: ArrowDown,
  feature: Star,
  unfeature: StarOff,
  spam: ShieldAlert,
  read: MailCheck,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

export type RowAction =
  | { type: "link"; label: string; icon: IconName; href: string; external?: boolean }
  | {
      type: "action";
      label: string;
      icon: IconName;
      action: () => Promise<ActionResult<unknown>>;
      destructive?: boolean;
      confirm?: { title: string; description: string; confirmLabel?: string };
      redirectTo?: string;
    }
  | { type: "separator" };

export function useRunAction() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const run = (action: () => Promise<ActionResult<unknown>>, redirectTo?: string) =>
    new Promise<boolean>((resolve) => {
      startTransition(async () => {
        try {
          const result = await action();
          if (result.ok) {
            toast.success(result.message ?? "Done");
            if (redirectTo) router.push(redirectTo);
            else router.refresh();
            resolve(true);
          } else {
            toast.error(result.error);
            resolve(false);
          }
        } catch {
          toast.error("Something went wrong. Please try again.");
          resolve(false);
        }
      });
    });
  return { run, pending };
}

export function RowActions({ actions, label = "Actions" }: { actions: RowAction[]; label?: string }) {
  const { run, pending } = useRunAction();
  const [confirming, setConfirming] = useState<Extract<RowAction, { type: "action" }> | null>(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" aria-label={label} disabled={pending}>
            {pending ? <Loader2 className="animate-spin" /> : <MoreHorizontal />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {actions.map((item, index) => {
            if (item.type === "separator") return <DropdownMenuSeparator key={`sep-${index}`} />;
            const Icon = ICONS[item.icon];
            if (item.type === "link") {
              return (
                <DropdownMenuItem key={item.label} asChild>
                  {item.external ? (
                    <a href={item.href} target="_blank" rel="noreferrer">
                      <Icon /> {item.label}
                    </a>
                  ) : (
                    <Link href={item.href}>
                      <Icon /> {item.label}
                    </Link>
                  )}
                </DropdownMenuItem>
              );
            }
            return (
              <DropdownMenuItem
                key={item.label}
                className={cn(item.destructive && "text-destructive focus:text-destructive")}
                onSelect={(event) => {
                  if (item.confirm) {
                    event.preventDefault();
                    setConfirming(item);
                  } else {
                    void run(item.action, item.redirectTo);
                  }
                }}
              >
                <Icon /> {item.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={Boolean(confirming)} onOpenChange={(open) => !open && setConfirming(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirming?.confirm?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirming?.confirm?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={cn(confirming?.destructive && "bg-destructive text-destructive-foreground hover:bg-destructive/90")}
              onClick={() => {
                if (confirming) void run(confirming.action, confirming.redirectTo);
                setConfirming(null);
              }}
            >
              {confirming?.confirm?.confirmLabel ?? "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/** A standalone button that runs a server action, optionally behind a confirmation. */
export function ActionButton({
  action,
  label,
  icon,
  variant = "outline",
  size = "sm",
  confirm,
  redirectTo,
}: {
  action: () => Promise<ActionResult<unknown>>;
  label: string;
  icon?: IconName;
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
  size?: "sm" | "default";
  confirm?: { title: string; description: string; confirmLabel?: string };
  redirectTo?: string;
}) {
  const { run, pending } = useRunAction();
  const [open, setOpen] = useState(false);
  const Icon = icon ? ICONS[icon] : null;
  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={pending}
        onClick={() => (confirm ? setOpen(true) : void run(action, redirectTo))}
      >
        {pending ? <Loader2 className="animate-spin" /> : Icon ? <Icon /> : null}
        {label}
      </Button>
      {confirm && (
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{confirm.title}</AlertDialogTitle>
              <AlertDialogDescription>{confirm.description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className={cn(variant === "destructive" && "bg-destructive text-destructive-foreground hover:bg-destructive/90")}
                onClick={() => void run(action, redirectTo)}
              >
                {confirm.confirmLabel ?? "Confirm"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
