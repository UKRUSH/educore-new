"use client";

import { useState, FormEvent } from "react";

type F = { name: string; email: string; subject: string; message: string };
type Status = "idle" | "sending" | "success" | "error";

const SUBJECTS = ["General Enquiry","Technical Support","Feature Request","Partnership","Other"];

export default function ContactForm() {
  const [form, setForm]   = useState<F>({ name:"", email:"", subject:"", message:"" });
  const [errs, setErrs]   = useState<Partial<F>>({});
  const [status, setStatus] = useState<Status>("idle");

  const validate = () => {
    const e: Partial<F> = {};
    if (!form.name.trim())                     e.name    = "Required";
    if (!form.email.trim())                    e.email   = "Required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email   = "Invalid email";
    if (!form.subject)                         e.subject = "Please pick a subject";
    if (!form.message.trim())                  e.message = "Required";
    else if (form.message.length < 20)         e.message = "At least 20 characters";
    setErrs(e);
    return !Object.keys(e).length;
  };

  const set = (k: keyof F, v: string) => {
    setForm(p => ({ ...p, [k]: v }));
    if (errs[k]) setErrs(p => ({ ...p, [k]: undefined }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus("sending");
    await new Promise(r => setTimeout(r, 1800));
    setStatus("success");
    setForm({ name:"", email:"", subject:"", message:"" });
  };

  const inp = (err?: string) =>
    `w-full px-4 py-3 rounded-xl text-sm bg-white border-2 outline-none transition-all duration-200 placeholder:text-muted-foreground/40 focus:ring-4 focus:ring-primary/10 ${
      err ? "border-red-400 bg-red-50/30 focus:border-red-400" : "border-border hover:border-primary/40 focus:border-primary"
    }`;

  return (
    <form onSubmit={submit} noValidate className="space-y-5">

      {/* Row 1: name + email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <label className="block mb-1.5 text-[11px] font-bold uppercase tracking-widest text-foreground/60">
            Full Name <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </span>
            <input type="text" placeholder="Jane Doe" value={form.name} onChange={e => set("name",e.target.value)} className={`${inp(errs.name)} pl-10`} />
          </div>
          {errs.name && <p className="mt-1 text-[11px] text-red-500 flex items-center gap-1"><span>▲</span>{errs.name}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block mb-1.5 text-[11px] font-bold uppercase tracking-widest text-foreground/60">
            Email <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </span>
            <input type="email" placeholder="jane@uni.edu" value={form.email} onChange={e => set("email",e.target.value)} className={`${inp(errs.email)} pl-10`} />
          </div>
          {errs.email && <p className="mt-1 text-[11px] text-red-500 flex items-center gap-1"><span>▲</span>{errs.email}</p>}
        </div>
      </div>

      {/* Subject */}
      <div>
        <label className="block mb-1.5 text-[11px] font-bold uppercase tracking-widest text-foreground/60">
          Subject <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </span>
          <select value={form.subject} onChange={e => set("subject",e.target.value)} className={`${inp(errs.subject)} pl-10 pr-10 appearance-none cursor-pointer`}>
            <option value="" disabled>Choose a subject…</option>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6,9 12,15 18,9"/>
            </svg>
          </span>
        </div>
        {errs.subject && <p className="mt-1 text-[11px] text-red-500 flex items-center gap-1"><span>▲</span>{errs.subject}</p>}
      </div>

      {/* Message */}
      <div>
        <label className="block mb-1.5 text-[11px] font-bold uppercase tracking-widest text-foreground/60">
          Message <span className="text-red-400">*</span>
        </label>
        <textarea
          rows={5}
          placeholder="Tell us how we can help…"
          value={form.message}
          onChange={e => set("message",e.target.value)}
          className={`${inp(errs.message)} resize-none`}
        />
        <div className="flex justify-between mt-1">
          {errs.message
            ? <p className="text-[11px] text-red-500 flex items-center gap-1"><span>▲</span>{errs.message}</p>
            : <span/>
          }
          <span className={`text-[11px] ml-auto tabular-nums ${form.message.length>480?"text-red-400":"text-muted-foreground/40"}`}>
            {form.message.length}/500
          </span>
        </div>
      </div>

      {/* Success */}
      {status==="success" && (
        <div className="flex gap-3 p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-700">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
          </div>
          <div>
            <p className="font-bold text-sm">Message sent!</p>
            <p className="text-xs opacity-75 mt-0.5">We&apos;ll respond within 24 hours.</p>
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={status==="sending"||status==="success"}
        className="relative w-full flex items-center justify-center gap-2.5 py-4 text-sm font-black text-white rounded-2xl overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
        style={{
          background: "linear-gradient(135deg,oklch(0.6231 0.1880 259.8145) 0%,oklch(0.4882 0.2172 264.3763) 100%)",
          boxShadow: "0 6px 28px oklch(0.6231 0.1880 259.8145 / 0.35)",
        }}
      >
        <span className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-[-20deg] -translate-x-full animate-shimmer" />
        {status==="sending" ? (
          <>
            <svg className="animate-spin w-4 h-4 relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
            </svg>
            <span className="relative z-10">Sending…</span>
          </>
        ) : status==="success" ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="relative z-10">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
            <span className="relative z-10">Sent!</span>
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="relative z-10">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/>
            </svg>
            <span className="relative z-10">Send Message</span>
          </>
        )}
      </button>
      <p className="text-center text-[11px] text-muted-foreground/50">🔒 We never share your info. No spam, ever.</p>
    </form>
  );
}
