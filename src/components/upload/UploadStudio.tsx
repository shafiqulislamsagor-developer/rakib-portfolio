"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { OutlineButton } from "../ui";

type Step = "edit" | "final" | "published" | "promote";

const categories = [["Graphic Design", "Branding"], ["Ux Research", "UIUX Design"], ["Web Design"]];

function DropZone({ onRemove }: { onRemove?: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [over, setOver] = useState(false);

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  function take(file?: File) {
    if (file && file.type.startsWith("image/")) setPreview(URL.createObjectURL(file));
  }

  return (
    <div className="relative h-[680px] w-full">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload an image"
        onClick={() => input.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
        onDragOver={(e: DragEvent) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e: DragEvent) => {
          e.preventDefault();
          setOver(false);
          take(e.dataTransfer.files[0]);
        }}
        className={`absolute inset-0 cursor-pointer overflow-hidden rounded-[4px] bg-[#989898]/[0.08] transition-colors ${over ? "bg-[#989898]/20" : ""}`}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
          <img src={preview} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <>
            <span className="absolute inset-5 rounded-[4px] shadow-[0_4px_4px_rgba(0,0,0,0.25)]">
              <svg className="absolute inset-0" width="975" height="640" viewBox="0 0 975 640" aria-hidden>
                <rect
                  x="0.5"
                  y="0.5"
                  width="974"
                  height="639"
                  rx="4"
                  fill="none"
                  stroke="rgba(152,152,152,0.4)"
                  strokeDasharray="12 12"
                />
              </svg>
            </span>
            <span className="absolute top-[282px] left-1/2 flex w-[261px] -translate-x-1/2 flex-col items-center gap-4">
              <Image src="/icons/image-upload.svg" alt="" width={80} height={80} unoptimized />
              <span className="text-center text-[16px] leading-[1.33] text-g2 capitalize">Drag and drop an image, or Browse</span>
            </span>
          </>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" hidden onChange={(e: ChangeEvent<HTMLInputElement>) => take(e.target.files?.[0])} />
      <button
        type="button"
        aria-label={preview ? "Replace image" : "Edit block"}
        onClick={() => (preview ? input.current?.click() : onRemove?.())}
        className="absolute top-[-8px] left-[-8px] flex size-11 cursor-pointer items-center justify-center rounded-full bg-white transition-transform hover:scale-105"
      >
        <Image src="/icons/image-edit.svg" alt="" width={44} height={44} unoptimized className="absolute inset-0" />
      </button>
    </div>
  );
}

function ToolCell({ icon, label, edges }: { icon: string; label: string; edges: string }) {
  return (
    <button
      type="button"
      className={`flex h-[100px] w-[162.5px] cursor-pointer flex-col items-center justify-center border-[#989898]/[0.08] text-[16px] leading-[1.33] text-g2 capitalize transition-colors hover:bg-white/[0.03] hover:text-g5 ${edges}`}
    >
      <Image src={icon} alt="" width={32} height={32} unoptimized />
      {label}
    </button>
  );
}

function Modal({ children, w, h, onClose }: { children: React.ReactNode; w: number; h: number; onClose: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="modal-pop relative rounded-[4px] bg-mist text-ink"
        style={{ width: w, height: h }}
      >
        {children}
      </div>
    </div>
  );
}

export function UploadStudio() {
  const [step, setStep] = useState<Step>("edit");
  const [blocks, setBlocks] = useState([0, 1]);
  const [title, setTitle] = useState("");
  const close = () => setStep("edit");

  useEffect(() => {
    if (step !== "published") return;
    const t = setTimeout(() => setStep("promote"), 1800);
    return () => clearTimeout(t);
  }, [step]);

  return (
    <>
      <div
        className={`relative mx-auto flex w-[1360px] gap-5 pt-[153px] pb-[30px] transition-opacity duration-500 ${step === "edit" ? "" : "pointer-events-none opacity-50"}`}
      >
        <div className="flex w-[1015px] flex-col gap-[50px]">
          <div className="flex flex-col gap-10">
            <label className="relative block h-10">
              <span className="sr-only">Project name</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give me a name"
                className="absolute top-[-21.2px] left-0 block h-[75px] w-full bg-transparent p-0 text-[56px] leading-[74.5px] font-semibold text-g2 outline-none placeholder:text-g2"
              />
            </label>
            <DropZone />
          </div>
          {blocks.slice(1).map((b, i) => (
            <div key={b} className="flex flex-col gap-[50px]">
              {i === 0 && (
                <div className="relative flex h-12 items-center justify-center">
                  <span aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-[#989898]/25" />
                  <button
                    type="button"
                    onClick={() => setBlocks((x) => [...x, x.length])}
                    className="relative flex h-12 cursor-pointer items-center gap-1 rounded-full bg-ink px-10 text-[16px] leading-[1.33] text-g1 capitalize outline outline-1 outline-[#989898]/25 transition-colors hover:text-white"
                  >
                    <Image src="/icons/plus.svg" alt="" width={24} height={24} unoptimized />
                    Insert more
                  </button>
                </div>
              )}
              <DropZone onRemove={() => setBlocks((x) => x.filter((y) => y !== b))} />
            </div>
          ))}
        </div>

        <aside className="w-[325px] pt-20">
          <div className="flex flex-col gap-10 rounded-[4px] pb-[30px] outline outline-1 outline-[#989898]/25">
            <div>
              <h2 className="flex h-12 items-center rounded-t-[4px] bg-[#090909] px-3 text-[18px] leading-[1.33] font-semibold text-g2 capitalize">
                Add content
              </h2>
              <div className="flex flex-wrap">
                <ToolCell icon="/icons/image-upload-32.svg" label="Image JPG/PNG" edges="border-r border-b" />
                <ToolCell icon="/icons/text.svg" label="Text" edges="" />
                <ToolCell icon="/icons/video.svg" label="Video" edges="border-b" />
                <ToolCell icon="/icons/grid.svg" label="Image Grid" edges="border-t border-b border-l" />
              </div>
            </div>
            <div className="flex flex-col items-center gap-10">
              <div className="w-full">
                <h2 className="flex h-12 items-center rounded-t-[4px] bg-[#090909] px-3 text-[18px] leading-[1.33] font-semibold text-g2 capitalize">
                  Attach Assets
                </h2>
                <div className="flex flex-col items-center gap-5 border-b border-[#989898]/[0.08] py-[50px]">
                  <button type="button" className="flex cursor-pointer items-center gap-2 text-[14px] leading-[1.33] text-white capitalize">
                    <Image src="/icons/attach.svg" alt="" width={20} height={20} unoptimized />
                    Attach Assets
                  </button>
                  <p className="w-[325px] text-center text-[14px] leading-[1.33] text-g2 capitalize">
                    Add files like fonts, illustrations, photos, zips, or templates as free or paid downloads.
                  </p>
                </div>
              </div>
              <div className="flex w-[270px] flex-col gap-4">
                <OutlineButton label="Cancel" href="/" className="w-full" />
                <button
                  type="button"
                  onClick={() => setStep("final")}
                  className="group relative inline-flex h-10 w-full cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-[4px] border border-white bg-white text-ink"
                >
                  <span aria-hidden className="btn-fill absolute inset-0 bg-ink" />
                  <span className="relative flex items-center gap-3 transition-colors group-hover:text-white">
                    <span className="text-[14px] leading-[13.2px] uppercase">Continue</span>
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden>
                      <path d="M6.03814 2.70084C6.47814 3.25884 6.84014 3.71084 7.22414 4.17384H0.994141V5.26984H7.21414C6.82914 5.72184 6.46614 6.17484 6.03814 6.72184L4.66414 8.45784H6.03814L8.99414 4.70984L6.03814 0.964844H4.66414L6.03814 2.70084Z" fill="currentColor" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {step === "final" && (
        <Modal w={900} h={560} onClose={close}>
          <div className="flex gap-[30px] p-[50px]">
            <div className="flex w-[260px] flex-col gap-[30px]">
              <h2 className="trim h-[17px] text-[24px] font-bold capitalize">Final Touches</h2>
              <div className="flex flex-col gap-2">
                <p className="trim h-[10px] text-[14px] font-semibold capitalize">Thumbnail Preview</p>
                <div className="relative h-[200px] w-[260px] overflow-hidden rounded-[4px] bg-[#d9d9d9]">
                  <Image src="/images/upload/thumbnail.webp" alt="" fill sizes="260px" className="object-cover" />
                </div>
                <div className="flex h-[22px] items-center gap-1">
                  <Image src="/icons/edit-cover.svg" alt="" width={16} height={20} unoptimized />
                  <button type="button" className="trim h-[10px] flex-1 cursor-pointer text-left text-[14px] capitalize underline">
                    Edit cover image
                  </button>
                  <Image src="/icons/eye.svg" alt="" width={20} height={20} unoptimized />
                </div>
              </div>
            </div>
            <span aria-hidden className="w-px self-stretch bg-[#989898]/10" style={{ height: 467 }} />
            <form
              className="flex w-[478px] flex-col items-end gap-[107px]"
              onSubmit={(e) => {
                e.preventDefault();
                setStep("published");
              }}
            >
              <div className="flex w-full flex-col gap-[30px]">
                {[
                  ["Project Tag", "Add project tags..."],
                  ["Tools Used", "What software, hardware, or materials do you use?..."],
                ].map(([label, ph]) => (
                  <label key={label} className="flex flex-col gap-3">
                    <span className="trim h-[10px] text-[14px] font-semibold capitalize">
                      {label} <span className="text-g1 normal-case">(maximum 50)</span>
                    </span>
                    <input
                      placeholder={ph}
                      className="h-12 w-full rounded-[4px] border border-[#a1a1a1]/50 bg-transparent px-[10px] text-[14px] outline-none placeholder:text-g1 focus:border-ink"
                    />
                  </label>
                ))}
                <fieldset className="flex flex-col gap-5">
                  <legend className="trim mb-5 h-[10px] text-[14px] font-semibold capitalize">
                    How would you categorize this project? <span className="text-g1">(required)</span>
                  </legend>
                  <div className="flex gap-5">
                    {categories.map((col, i) => (
                      <div key={i} className="flex w-[113px] flex-col gap-[19px]">
                        {col.map((c) => (
                          <label key={c} className="flex h-[14px] cursor-pointer items-center gap-1">
                            <input type="checkbox" className="peer sr-only" />
                            <span className="relative size-[14px] shrink-0 rounded-[2px] border border-[#dfdfdf] peer-checked:border-ink peer-checked:bg-ink peer-focus-visible:ring-1 peer-focus-visible:ring-ink peer-checked:[&>svg]:block">
                              <svg viewBox="0 0 14 14" className="absolute inset-0 hidden text-white" aria-hidden>
                                <path d="M3.5 7.2 5.8 9.4 10.5 4.6" fill="none" stroke="currentColor" strokeWidth="1.3" />
                              </svg>
                            </span>
                            <span className="trim text-[14px] capitalize">{c}</span>
                          </label>
                        ))}
                      </div>
                    ))}
                  </div>
                </fieldset>
              </div>
              <div className="flex w-full items-center justify-between">
                <button type="button" onClick={close} className="cursor-pointer text-[14px] leading-[13.2px] uppercase underline">
                  Cancel
                </button>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={close}
                    className="h-9 cursor-pointer rounded-[4px] border border-ink px-4 text-[14px] leading-[13.2px] uppercase transition-colors hover:bg-ink hover:text-white"
                  >
                    Save as draft
                  </button>
                  <button
                    type="submit"
                    className="h-9 cursor-pointer rounded-[4px] bg-ink px-4 text-[14px] leading-[13.2px] text-white uppercase transition-opacity hover:opacity-85"
                  >
                    Publish Now
                  </button>
                </div>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {step === "published" && (
        <Modal w={670} h={370} onClose={() => setStep("promote")}>
          <div className="absolute top-[126.5px] left-[236.5px] h-[117px] w-[197px]">
            <Image src="/icons/published.svg" alt="" width={197} height={117} unoptimized className="absolute inset-0" />
            <p className="trim absolute inset-x-0 top-[100px] h-[17px] text-center text-[24px] font-bold capitalize">
              Published Project
            </p>
          </div>
        </Modal>
      )}

      {step === "promote" && (
        <Modal w={670} h={370} onClose={close}>
          <div className="absolute top-[150.5px] left-[223px] flex w-[224px] flex-col items-center gap-5">
            <div className="flex gap-[11px]">
              {["facebook", "instagram", "x", "linkedin"].map((s) => (
                <a
                  key={s}
                  href="#"
                  aria-label={`Share on ${s}`}
                  className="flex size-8 items-center justify-center rounded-full border border-[#a1a1a1]/50 transition-colors hover:bg-white"
                >
                  <Image src={`/icons/${s}.svg`} alt="" width={24} height={24} unoptimized />
                </a>
              ))}
            </div>
            <p className="trim h-[17px] text-[24px] font-bold whitespace-nowrap capitalize">Promote your work</p>
          </div>
          <a
            href="https://www.behance.net/rakibkhan-uiux"
            target="_blank"
            rel="noreferrer"
            className="absolute top-[268px] left-[189px] flex h-8 items-center gap-2 rounded-[4px] border border-[#a1a1a1]/25 px-2"
          >
            <Image src="/icons/link.svg" alt="" width={16} height={16} unoptimized />
            <span className="trim pb-[2px] text-[14px] lowercase underline">https://www.behance.net/rakibkhan-uiux</span>
          </a>
        </Modal>
      )}
    </>
  );
}
