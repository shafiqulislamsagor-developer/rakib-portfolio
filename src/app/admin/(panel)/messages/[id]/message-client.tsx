"use client";

import { addMessageNote, deleteMessageNote, markMessageReplied, markMessageViewed } from "@/app/admin/_actions/messages";
import { Field } from "@/app/admin/_components/fields";
import { useRunAction } from "@/app/admin/_components/row-actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/format";
import { CheckCheck, Copy, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export function MarkViewed({ id, read }: { id: string; read: boolean }) {
  const router = useRouter();
  const done = useRef(false);
  useEffect(() => {
    if (read || done.current) return;
    done.current = true;
    void markMessageViewed(id).then(() => router.refresh());
  }, [id, read, router]);
  return null;
}

export function CopyEmailButton({ email }: { email: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(email);
        toast.success("Email address copied");
      }}
    >
      <Copy /> Copy email
    </Button>
  );
}

export function MarkRepliedButton({ id, again = false }: { id: string; again?: boolean }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const { run, pending } = useRunAction();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={again ? "outline" : "default"}>
          <CheckCheck /> {again ? "Log another reply" : "Mark as replied"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark as replied</DialogTitle>
          <DialogDescription>
            Use this after you have contacted the sender (email, phone, WhatsApp…). Add a short note so you remember what was said.
          </DialogDescription>
        </DialogHeader>
        <Field label="Note (optional)">
          <Textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="e.g. Called on WhatsApp, sending a proposal on Friday" maxLength={2000} />
        </Field>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={pending}
            onClick={async () => {
              if (await run(() => markMessageReplied(id, note))) {
                setOpen(false);
                setNote("");
              }
            }}
          >
            {pending && <Loader2 className="animate-spin" />} Mark as replied
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function NotesPanel({ id, notes }: { id: string; notes: { id: string; body: string; authorEmail: string; createdAt: string }[] }) {
  const [body, setBody] = useState("");
  const { run, pending } = useRunAction();
  return (
    <div className="space-y-4">
      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No internal notes. Notes are never sent to the sender.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="group rounded-[4px] border border-border bg-muted/30 p-3">
              <p className="whitespace-pre-wrap text-sm">{note.body}</p>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {note.authorEmail} · {formatDateTime(note.createdAt)}
                </span>
                <button
                  type="button"
                  onClick={() => void run(() => deleteMessageNote(id, note.id))}
                  className="rounded p-1 opacity-60 hover:text-destructive hover:opacity-100"
                  aria-label="Delete note"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (!body.trim()) return;
          if (await run(() => addMessageNote(id, body))) setBody("");
        }}
        className="space-y-2"
      >
        <Textarea rows={3} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Add a private note…" maxLength={2000} aria-label="New note" />
        <Button type="submit" size="sm" variant="outline" disabled={pending || !body.trim()}>
          {pending && <Loader2 className="animate-spin" />} Add note
        </Button>
      </form>
    </div>
  );
}
