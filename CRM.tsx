"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// ── Supabase persistence helpers ──────────────────────────────────────────────
const USER_ID = "default"; // Replace with auth.user.id once you add Supabase Auth

const load = async (key: string, fallback: any) => {
  try {
    const { data } = await supabase
      .from("crm_store")
      .select("value")
      .eq("user_id", USER_ID)
      .eq("key", key)
      .single();
    return data ? JSON.parse(data.value) : fallback;
  } catch {
    return fallback;
  }
};

const save = async (key: string, val: any) => {
  try {
    await supabase.from("crm_store").upsert(
      { user_id: USER_ID, key, value: JSON.stringify(val) },
      { onConflict: "user_id,key" }
    );
  } catch {}
};

// ── Seed data ─────────────────────────────────────────────────────────────────
const SEED_CONTACTS = [
  { id: "c1", name: "Priya Nair", company: "Horizon Group", email: "priya@horizon.com", phone: "0412 000 001", stage: "customer", value: 8400, tags: ["VIP"], avatar: "PN", lastContact: "2026-01-28" },
  { id: "c2", name: "Jake Mercer", company: "BlueWave Retail", email: "jake@bluewave.com", phone: "0412 000 002", stage: "proposal", value: 5200, tags: ["Hot"], avatar: "JM", lastContact: "2026-03-10" },
  { id: "c3", name: "Sofia Tan", company: "Arclight Media", email: "sofia@arclight.com", phone: "0412 000 003", stage: "lead", value: 2100, tags: [], avatar: "ST", lastContact: "2026-03-18" },
  { id: "c4", name: "Marcus Webb", company: "Ironside Consulting", email: "marcus@ironside.com", phone: "0412 000 004", stage: "customer", value: 12000, tags: ["VIP"], avatar: "MW", lastContact: "2026-02-05" },
  { id: "c5", name: "Anika Patel", company: "Sunrise Ventures", email: "anika@sunrise.com", phone: "0412 000 005", stage: "negotiation", value: 6800, tags: ["Hot"], avatar: "AP", lastContact: "2026-03-20" },
];

const SEED_DEALS = [
  { id: "d1", title: "Horizon AI Retainer", contactId: "c1", stage: "won", value: 8400, closeDate: "2026-02-01", probability: 100 },
  { id: "d2", title: "BlueWave Onboarding", contactId: "c2", stage: "proposal", value: 5200, closeDate: "2026-03-27", probability: 65 },
  { id: "d3", title: "Arclight Discovery", contactId: "c3", stage: "qualified", value: 2100, closeDate: "2026-05-01", probability: 30 },
  { id: "d4", title: "Ironside Annual Contract", contactId: "c4", stage: "won", value: 12000, closeDate: "2026-01-15", probability: 100 },
  { id: "d5", title: "Sunrise Growth Package", contactId: "c5", stage: "negotiation", value: 6800, closeDate: "2026-04-01", probability: 75 },
];

const SEED_ACTIVITIES = [
  { id: "a1", contactId: "c1", type: "call", note: "Discussed Q2 roadmap — very positive", date: "2026-01-28", done: true },
  { id: "a2", contactId: "c2", type: "email", note: "Sent proposal deck", date: "2026-03-10", done: true },
  { id: "a3", contactId: "c3", type: "meeting", note: "Intro call scheduled", date: "2026-03-18", done: false },
  { id: "a4", contactId: "c4", type: "email", note: "Checked in on renewal timeline", date: "2026-02-05", done: true },
  { id: "a5", contactId: "c5", type: "call", note: "Negotiating scope — they want phased delivery", date: "2026-03-20", done: true },
];

const SEED_REMINDERS = [
  { id: "r1", contactId: "c2", text: "Follow up on BlueWave proposal", dueDate: "2026-03-27", done: false },
  { id: "r2", contactId: "c3", text: "Send Arclight case studies", dueDate: "2026-03-30", done: false },
];

const PIPELINE_STAGES = [
  { id: "lead", label: "Lead", color: "#94A3B8" },
  { id: "qualified", label: "Qualified", color: "#60A5FA" },
  { id: "proposal", label: "Proposal", color: "#F59E0B" },
  { id: "negotiation", label: "Negotiation", color: "#F97316" },
  { id: "won", label: "Won", color: "#22C55E" },
  { id: "lost", label: "Lost", color: "#EF4444" },
];

const ACT_ICONS: Record<string, string> = { call: "📞", email: "✉️", meeting: "📅", note: "📝", task: "✅" };
const TAG_COLORS: Record<string, string> = { VIP: "#F59E0B", Hot: "#EF4444", Cold: "#60A5FA", Partner: "#A78BFA" };
const CHANNEL_ICONS: Record<string, string> = { email: "✉️", whatsapp: "💬", call: "📞", calendar: "📅", voice: "🎙️" };

const SIMULATED_COMMS = [
  { id: "comm1", contactId: "c2", channel: "email", summary: "Jake replied to your proposal — says 'the pricing looks steep, can we discuss?'", inferredStage: "negotiation", confidence: 0.85, sentiment: "cautious", timestamp: "2 hours ago" },
  { id: "comm2", contactId: "c5", channel: "whatsapp", summary: "Anika sent: 'Just checking — when can we kick off?'", inferredStage: "won", confidence: 0.78, sentiment: "positive", timestamp: "4 hours ago" },
  { id: "comm3", contactId: "c3", channel: "calendar", summary: "Meeting with Sofia Tan — Arclight Discovery Call completed", inferredStage: null, confidence: 0.95, sentiment: "neutral", timestamp: "Yesterday" },
];

// ── Utility ───────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 9); }
function fmt(val: any) { return "$" + Number(val || 0).toLocaleString(); }
function daysSince(dateStr: string) {
  if (!dateStr) return 999;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}
function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

// ── AI Nudge Engine ───────────────────────────────────────────────────────────
function generateNudges(contacts: any[], deals: any[], activities: any[], reminders: any[]) {
  const nudges: any[] = [];

  contacts.forEach((c) => {
    const days = daysSince(c.lastContact);
    const cDeals = deals.filter((d) => d.contactId === c.id && !["won", "lost"].includes(d.stage));
    const isHighValue = c.value > 5000 || c.tags?.includes("VIP");
    const isHot = c.tags?.includes("Hot");

    if (isHighValue && days > 45) {
      nudges.push({ id: `decay-vip-${c.id}`, contactId: c.id, type: "decay", severity: "critical", title: `${c.name} has gone quiet`, body: `Your highest-value contact at ${c.company} hasn't been reached in ${days} days. That's a risk worth addressing today.`, action: "Log a touchpoint", actionType: "activity", icon: "🔴", days });
    } else if (days > 30 && cDeals.length > 0) {
      nudges.push({ id: `decay-deal-${c.id}`, contactId: c.id, type: "decay", severity: "warning", title: `${c.name} — open deal, no contact in ${days} days`, body: `${cDeals[0].title} is still open at ${fmt(cDeals[0].value)} but you haven't been in touch. Deals go cold fast.`, action: "Follow up now", actionType: "activity", icon: "🟡", days });
    } else if (days > 60 && c.stage === "customer") {
      nudges.push({ id: `retention-${c.id}`, contactId: c.id, type: "retention", severity: "warning", title: `Retention risk — ${c.name}`, body: `${c.company} is a paying customer you haven't spoken to in ${days} days. A quick check-in builds loyalty and surfaces upsell opportunities.`, action: "Schedule a check-in", actionType: "reminder", icon: "🟡", days });
    }

    cDeals.forEach((d) => {
      if (d.closeDate && daysUntil(d.closeDate) < 0) {
        nudges.push({ id: `overdue-${d.id}`, contactId: c.id, type: "overdue", severity: "warning", title: `${d.title} close date passed`, body: `This deal was meant to close ${Math.abs(daysUntil(d.closeDate))} days ago. Update the stage or push the date.`, action: "Update deal", actionType: "deal", icon: "⏰", days: 0 });
      }
    });

    if (isHot && days > 7 && c.stage !== "customer") {
      nudges.push({ id: `hot-${c.id}`, contactId: c.id, type: "hot", severity: "info", title: `Hot lead cooling — ${c.name}`, body: `${c.company} is tagged Hot but hasn't been contacted in ${days} days. Hot leads have a short shelf life.`, action: "Reach out", actionType: "activity", icon: "🔥", days });
    }
  });

  const order: Record<string, number> = { critical: 0, warning: 1, info: 2 };
  return nudges.sort((a, b) => order[a.severity] - order[b.severity]);
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Avatar({ initials, size = 36, color = "#334155" }: any) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: 700, flexShrink: 0, letterSpacing: "0.5px" }}>
      {initials}
    </div>
  );
}

function Tag({ label, onRemove }: any) {
  const col = TAG_COLORS[label] || "#64748B";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 20, background: col + "22", color: col, fontSize: 11, fontWeight: 600 }}>
      {label}{onRemove && <span onClick={onRemove} style={{ cursor: "pointer", opacity: 0.7 }}>×</span>}
    </span>
  );
}

function Modal({ title, onClose, children, width = 520 }: any) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#00000099", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
      <div style={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: 14, width: "100%", maxWidth: width, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 60px #00000099" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid #1E293B" }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748B", fontSize: 20, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ padding: "20px 22px" }}>{children}</div>
      </div>
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", size = "md", disabled }: any) {
  const bg = variant === "primary" ? "#3B82F6" : variant === "success" ? "#22C55E" : variant === "danger" ? "#EF444422" : "#1E293B";
  const col = variant === "danger" ? "#EF4444" : variant === "primary" || variant === "success" ? "#fff" : "#94A3B8";
  return (
    <button onClick={onClick} disabled={disabled} style={{ background: bg, color: col, border: "none", borderRadius: 8, padding: size === "sm" ? "5px 12px" : "9px 18px", fontSize: size === "sm" ? 11 : 13, fontWeight: 600, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1 }}>
      {children}
    </button>
  );
}

function Input({ label, value, onChange, type = "text", placeholder }: any) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600, marginBottom: 5, letterSpacing: "0.5px" }}>{label.toUpperCase()}</div>}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", background: "#1E293B", border: "1px solid #334155", borderRadius: 8, padding: "9px 12px", color: "#E2E8F0", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
    </div>
  );
}

function Select({ label, value, onChange, options }: any) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600, marginBottom: 5, letterSpacing: "0.5px" }}>{label.toUpperCase()}</div>}
      <select value={value} onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", background: "#1E293B", border: "1px solid #334155", borderRadius: 8, padding: "9px 12px", color: "#E2E8F0", fontSize: 13, outline: "none", cursor: "pointer" }}>
        {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

const avatarColor = (name: string) => {
  const colors = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#EC4899"];
  return colors[(name || "").charCodeAt(0) % colors.length];
};

// ── Main CRM Component ────────────────────────────────────────────────────────
export default function CRM() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [processedComms, setProcessedComms] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState("radar");
  const [modal, setModal] = useState<string | null>(null);
  const [voiceNote, setVoiceNote] = useState("");
  const [voiceContactId, setVoiceContactId] = useState("");
  const [voiceProcessing, setVoiceProcessing] = useState(false);
  const [voiceResult, setVoiceResult] = useState<any>(null);
  const [pendingComm, setPendingComm] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const c = await load("contacts", SEED_CONTACTS);
      const d = await load("deals", SEED_DEALS);
      const a = await load("activities", SEED_ACTIVITIES);
      const r = await load("reminders", SEED_REMINDERS);
      const dis = await load("dismissed", []);
      const proc = await load("processedComms", []);
      setContacts(c); setDeals(d); setActivities(a); setReminders(r);
      setDismissed(dis); setProcessedComms(proc);
      setLoaded(true);
    })();
  }, []);

  useEffect(() => { if (loaded) save("contacts", contacts); }, [contacts, loaded]);
  useEffect(() => { if (loaded) save("deals", deals); }, [deals, loaded]);
  useEffect(() => { if (loaded) save("activities", activities); }, [activities, loaded]);
  useEffect(() => { if (loaded) save("reminders", reminders); }, [reminders, loaded]);
  useEffect(() => { if (loaded) save("dismissed", dismissed); }, [dismissed, loaded]);
  useEffect(() => { if (loaded) save("processedComms", processedComms); }, [processedComms, loaded]);

  const nudges = generateNudges(contacts, deals, activities, reminders).filter((n) => !dismissed.includes(n.id));
  const pendingIncoming = SIMULATED_COMMS.filter((c) => !processedComms.includes(c.id));
  const dismissNudge = (id: string) => setDismissed((d) => [...d, id]);

  const acceptComm = (comm: any) => {
    setActivities((as) => [{ id: uid(), contactId: comm.contactId, type: comm.channel === "calendar" ? "meeting" : comm.channel === "whatsapp" ? "note" : "email", note: comm.summary, date: new Date().toISOString().slice(0, 10), done: true }, ...as]);
    if (comm.inferredStage) {
      setDeals((ds) => ds.map((d) => d.contactId === comm.contactId && !["won", "lost"].includes(d.stage) ? { ...d, stage: comm.inferredStage } : d));
    }
    setContacts((cs) => cs.map((c) => c.id === comm.contactId ? { ...c, lastContact: new Date().toISOString().slice(0, 10) } : c));
    setProcessedComms((p) => [...p, comm.id]);
    setPendingComm(null);
  };

  const dismissComm = (commId: string) => {
    setProcessedComms((p) => [...p, commId]);
    setPendingComm(null);
  };

  // ── Voice note — calls internal API route (key stays server-side) ──────────
  const processVoiceNote = async () => {
    if (!voiceNote.trim() || !voiceContactId) return;
    setVoiceProcessing(true);
    setVoiceResult(null);
    const contact = contacts.find((c) => c.id === voiceContactId);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are a CRM assistant that processes post-call voice notes from business owners. Extract structured information and respond ONLY with valid JSON, no markdown, no preamble.`,
          messages: [{
            role: "user",
            content: `Contact: ${contact?.name} at ${contact?.company}. Voice note: "${voiceNote}". 
Extract and return JSON with these fields:
- summary: clean 1-2 sentence activity note (professional tone)
- activityType: one of call/meeting/email/note
- sentiment: positive/neutral/cautious/negative
- stageSignal: null or one of lead/qualified/proposal/negotiation/won/lost (only if clearly implied)
- followUpSuggestion: one specific follow-up action or null
- urgency: low/medium/high`,
          }],
        }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || "{}";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      setVoiceResult(parsed);
    } catch {
      setVoiceResult({ summary: voiceNote, activityType: "note", sentiment: "neutral", stageSignal: null, followUpSuggestion: null, urgency: "low" });
    }
    setVoiceProcessing(false);
  };

  const commitVoiceNote = () => {
    if (!voiceResult) return;
    setActivities((as) => [{ id: uid(), contactId: voiceContactId, type: voiceResult.activityType || "note", note: voiceResult.summary, date: new Date().toISOString().slice(0, 10), done: true }, ...as]);
    if (voiceResult.stageSignal) {
      setDeals((ds) => ds.map((d) => d.contactId === voiceContactId && !["won", "lost"].includes(d.stage) ? { ...d, stage: voiceResult.stageSignal } : d));
    }
    if (voiceResult.followUpSuggestion) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (voiceResult.urgency === "high" ? 1 : voiceResult.urgency === "medium" ? 3 : 7));
      setReminders((rs) => [...rs, { id: uid(), contactId: voiceContactId, text: voiceResult.followUpSuggestion, dueDate: dueDate.toISOString().slice(0, 10), done: false }]);
    }
    setContacts((cs) => cs.map((c) => c.id === voiceContactId ? { ...c, lastContact: new Date().toISOString().slice(0, 10) } : c));
    setVoiceNote(""); setVoiceResult(null); setModal(null);
  };

  const severityBar: Record<string, string> = { critical: "#EF4444", warning: "#F59E0B", info: "#60A5FA" };

  if (!loaded) return <div style={{ minHeight: "100vh", background: "#020817", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B", fontFamily: "system-ui" }}>Loading...</div>;

  const pipelineTotal = deals.filter((d) => !["won", "lost"].includes(d.stage)).reduce((s, d) => s + Number(d.value || 0), 0);
  const wonTotal = deals.filter((d) => d.stage === "won").reduce((s, d) => s + Number(d.value || 0), 0);

  return (
    <div style={{ minHeight: "100vh", background: "#020817", color: "#E2E8F0", fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif", display: "flex" }}>

      {/* Sidebar */}
      <div style={{ width: 220, background: "#0A1628", borderRight: "1px solid #1E293B", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "22px 20px 18px" }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>⚡ NimbleCRM</div>
          <div style={{ fontSize: 10, color: "#334155", letterSpacing: "1px", marginTop: 2 }}>AI-POWERED BY NIMBLEWORX</div>
        </div>

        {[
          { id: "radar", label: "AI Radar", icon: "🧠", badge: nudges.length + pendingIncoming.length, badgeDanger: nudges.filter((n) => n.severity === "critical").length > 0 },
          { id: "contacts", label: "Contacts", icon: "👥", badge: contacts.length },
          { id: "pipeline", label: "Pipeline", icon: "📊", badge: deals.filter((d) => !["won", "lost"].includes(d.stage)).length },
          { id: "activity", label: "Activity", icon: "⚡", badge: 0 },
        ].map((item) => (
          <button key={item.id} onClick={() => setView(item.id)}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", width: "100%", border: "none", background: view === item.id ? "#1E293B" : "none", color: view === item.id ? "#fff" : "#64748B", borderLeft: view === item.id ? "2px solid #3B82F6" : "2px solid transparent", cursor: "pointer", fontSize: 13, fontWeight: view === item.id ? 600 : 400, textAlign: "left" }}>
            <span>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge > 0 && (
              <span style={{ background: item.badgeDanger ? "#EF4444" : "#1E3A5F", color: item.badgeDanger ? "#fff" : "#60A5FA", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 10 }}>{item.badge}</span>
            )}
          </button>
        ))}

        <div style={{ padding: "12px 20px" }}>
          <button onClick={() => { setVoiceContactId(contacts[0]?.id || ""); setVoiceNote(""); setVoiceResult(null); setModal("voice"); }}
            style={{ width: "100%", background: "#1E293B", border: "1px dashed #334155", borderRadius: 8, padding: "10px", color: "#94A3B8", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
            🎙️ Drop a voice note
          </button>
        </div>

        <div style={{ marginTop: "auto", padding: "16px 20px", borderTop: "1px solid #1E293B" }}>
          <div style={{ fontSize: 10, color: "#334155", letterSpacing: "1px", marginBottom: 10 }}>QUICK STATS</div>
          <div style={{ fontSize: 12, color: "#64748B", marginBottom: 6 }}>Pipeline <span style={{ color: "#60A5FA", float: "right" }}>{fmt(pipelineTotal)}</span></div>
          <div style={{ fontSize: 12, color: "#64748B", marginBottom: 6 }}>Won <span style={{ color: "#22C55E", float: "right" }}>{fmt(wonTotal)}</span></div>
          <div style={{ fontSize: 12, color: "#64748B" }}>Contacts <span style={{ color: "#E2E8F0", float: "right" }}>{contacts.length}</span></div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderBottom: "1px solid #1E293B", background: "#020817" }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.3px" }}>
            {view === "radar" ? "🧠 AI Radar" : view === "contacts" ? "Contacts" : view === "pipeline" ? "Pipeline" : "Activity Log"}
          </div>
          {view === "radar" && pendingIncoming.length > 0 && (
            <div style={{ fontSize: 12, color: "#60A5FA", background: "#1E3A5F", padding: "5px 12px", borderRadius: 20, fontWeight: 600 }}>
              {pendingIncoming.length} incoming communication{pendingIncoming.length > 1 ? "s" : ""} to review
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

          {/* AI RADAR */}
          {view === "radar" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {pendingIncoming.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: "#64748B", letterSpacing: "0.8px", fontWeight: 700, marginBottom: 12 }}>INCOMING — AUTO-DETECTED COMMUNICATIONS</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {pendingIncoming.map((comm) => {
                      const contact = contacts.find((c) => c.id === comm.contactId);
                      const isHighConfidence = comm.confidence >= 0.85;
                      return (
                        <div key={comm.id} style={{ background: "#0F172A", border: "1px solid #1E3A5F", borderRadius: 12, padding: "14px 16px" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                            <div style={{ fontSize: 20 }}>{CHANNEL_ICONS[comm.channel]}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                {contact && <Avatar initials={contact.avatar} size={22} color={avatarColor(contact.name)} />}
                                <span style={{ fontWeight: 600, fontSize: 13 }}>{contact?.name}</span>
                                <span style={{ fontSize: 10, color: "#475569", textTransform: "capitalize" }}>{comm.channel}</span>
                                <span style={{ fontSize: 10, color: "#475569", marginLeft: "auto" }}>{comm.timestamp}</span>
                              </div>
                              <div style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.5, marginBottom: 10 }}>{comm.summary}</div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                {comm.inferredStage && <span style={{ fontSize: 11, background: "#F59E0B22", color: "#F59E0B", padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>Stage → {comm.inferredStage}</span>}
                                <span style={{ fontSize: 11, color: comm.sentiment === "positive" ? "#22C55E" : comm.sentiment === "cautious" ? "#F59E0B" : "#64748B" }}>
                                  {comm.sentiment === "positive" ? "😊" : comm.sentiment === "cautious" ? "🤔" : "😐"} {comm.sentiment}
                                </span>
                                <span style={{ fontSize: 11, color: "#475569", marginLeft: "auto" }}>{Math.round(comm.confidence * 100)}% confidence</span>
                              </div>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 8, marginTop: 12, paddingTop: 12, borderTop: "1px solid #1E293B" }}>
                            {isHighConfidence ? (
                              <>
                                <Btn size="sm" variant="success" onClick={() => acceptComm(comm)}>✓ Auto-log this</Btn>
                                <Btn size="sm" onClick={() => setPendingComm(comm)}>Review first</Btn>
                                <Btn size="sm" variant="danger" onClick={() => dismissComm(comm.id)}>Dismiss</Btn>
                              </>
                            ) : (
                              <>
                                <Btn size="sm" onClick={() => setPendingComm(comm)}>Review and confirm</Btn>
                                <Btn size="sm" variant="danger" onClick={() => dismissComm(comm.id)}>Dismiss</Btn>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {nudges.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: "#64748B", letterSpacing: "0.8px", fontWeight: 700, marginBottom: 12 }}>RELATIONSHIP INTELLIGENCE — {nudges.length} ITEM{nudges.length > 1 ? "S" : ""} NEED ATTENTION</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {nudges.map((nudge) => {
                      const contact = contacts.find((c) => c.id === nudge.contactId);
                      return (
                        <div key={nudge.id} style={{ background: "#0F172A", borderLeft: `3px solid ${severityBar[nudge.severity]}`, border: `1px solid ${severityBar[nudge.severity]}33`, borderRadius: 10, padding: "14px 16px" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                            <div style={{ fontSize: 20, flexShrink: 0 }}>{nudge.icon}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                {contact && <Avatar initials={contact.avatar} size={20} color={avatarColor(contact.name)} />}
                                <span style={{ fontWeight: 700, fontSize: 13 }}>{nudge.title}</span>
                              </div>
                              <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.6, marginBottom: 10 }}>{nudge.body}</div>
                              <div style={{ display: "flex", gap: 8 }}>
                                <Btn size="sm" onClick={() => {
                                  if (nudge.actionType === "activity") {
                                    setActivities((as) => [{ id: uid(), contactId: nudge.contactId, type: "note", note: `Follow-up triggered by AI nudge`, date: new Date().toISOString().slice(0, 10), done: false }, ...as]);
                                    setContacts((cs) => cs.map((c) => c.id === nudge.contactId ? { ...c, lastContact: new Date().toISOString().slice(0, 10) } : c));
                                  } else if (nudge.actionType === "reminder") {
                                    const due = new Date(); due.setDate(due.getDate() + 2);
                                    setReminders((rs) => [...rs, { id: uid(), contactId: nudge.contactId, text: "Check in with " + contact?.name, dueDate: due.toISOString().slice(0, 10), done: false }]);
                                  }
                                  dismissNudge(nudge.id);
                                }}>{nudge.action}</Btn>
                                <Btn size="sm" variant="ghost" onClick={() => dismissNudge(nudge.id)}>Dismiss</Btn>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {nudges.length === 0 && pendingIncoming.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#334155" }}>
                  <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#475569" }}>All clear</div>
                  <div style={{ fontSize: 13, marginTop: 8 }}>No relationship risks or pending actions right now.</div>
                </div>
              )}

              <div>
                <div style={{ fontSize: 11, color: "#64748B", letterSpacing: "0.8px", fontWeight: 700, marginBottom: 12 }}>RELATIONSHIP HEALTH</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[...contacts].sort((a, b) => daysSince(b.lastContact) - daysSince(a.lastContact)).map((c) => {
                    const days = daysSince(c.lastContact);
                    const health = days < 14 ? "green" : days < 30 ? "yellow" : days < 60 ? "orange" : "red";
                    const healthColor: Record<string, string> = { green: "#22C55E", yellow: "#EAB308", orange: "#F97316", red: "#EF4444" };
                    const healthLabel: Record<string, string> = { green: "Active", yellow: "Warm", orange: "Cooling", red: "Cold" };
                    return (
                      <div key={c.id} style={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar initials={c.avatar} size={34} color={avatarColor(c.name)} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: "#475569" }}>{days === 999 ? "Never contacted" : `${days}d ago`}</div>
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: healthColor[health], background: healthColor[health] + "22", padding: "3px 8px", borderRadius: 20, flexShrink: 0 }}>{healthLabel[health]}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* CONTACTS */}
          {view === "contacts" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {contacts.map((c) => {
                const days = daysSince(c.lastContact);
                const cDeals = deals.filter((d) => d.contactId === c.id);
                return (
                  <div key={c.id} style={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#3B82F6")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1E293B")}>
                    <Avatar initials={c.avatar} size={42} color={avatarColor(c.name)} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                        {c.tags?.map((t: string) => <Tag key={t} label={t} />)}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748B" }}>{c.company} · Last contact: {days === 999 ? "never" : `${days}d ago`}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#22C55E" }}>{fmt(c.value)}</div>
                      <div style={{ fontSize: 11, color: "#334155", marginTop: 3 }}>{cDeals.length} deal{cDeals.length !== 1 ? "s" : ""}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* PIPELINE */}
          {view === "pipeline" && (
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12 }}>
              {PIPELINE_STAGES.map((stage) => {
                const stageDeals = deals.filter((d) => d.stage === stage.id);
                const stageTotal = stageDeals.reduce((s, d) => s + Number(d.value || 0), 0);
                return (
                  <div key={stage.id} style={{ minWidth: 190, flex: "0 0 190px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, padding: "0 4px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: stage.color }} />
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8" }}>{stage.label}</div>
                      </div>
                      <div style={{ fontSize: 11, color: "#475569" }}>{fmt(stageTotal)}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {stageDeals.map((deal) => {
                        const contact = contacts.find((c) => c.id === deal.contactId);
                        const isOverdue = deal.closeDate && daysUntil(deal.closeDate) < 0;
                        return (
                          <div key={deal.id} style={{ background: "#0F172A", border: "1px solid #1E293B", borderLeft: `3px solid ${stage.color}`, borderRadius: 8, padding: "12px", cursor: "pointer" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#1E293B")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "#0F172A")}>
                            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{deal.title}</div>
                            {contact && (
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                                <Avatar initials={contact.avatar} size={18} color={avatarColor(contact.name)} />
                                <span style={{ fontSize: 11, color: "#64748B" }}>{contact.name}</span>
                              </div>
                            )}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: "#22C55E" }}>{fmt(deal.value)}</div>
                              <div style={{ fontSize: 10, color: "#475569" }}>{deal.probability}%</div>
                            </div>
                            {deal.closeDate && (
                              <div style={{ fontSize: 10, color: isOverdue ? "#EF4444" : "#475569", marginTop: 6 }}>
                                {isOverdue ? `⚠ ${Math.abs(daysUntil(deal.closeDate))}d overdue` : `Close: ${deal.closeDate}`}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {stageDeals.length === 0 && <div style={{ background: "#0A1628", borderRadius: 8, padding: 16, textAlign: "center", color: "#334155", fontSize: 12 }}>Empty</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ACTIVITY */}
          {view === "activity" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[...activities].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((act) => {
                const contact = contacts.find((c) => c.id === act.contactId);
                return (
                  <div key={act.id} style={{ background: "#0F172A", border: "1px solid #1E293B", borderRadius: 10, padding: "12px 16px", display: "flex", gap: 12 }}>
                    <span style={{ fontSize: 18 }}>{ACT_ICONS[act.type]}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        {contact && <Avatar initials={contact.avatar} size={20} color={avatarColor(contact.name)} />}
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{contact?.name}</span>
                        <span style={{ fontSize: 11, color: "#475569", textTransform: "capitalize" }}>{act.type}</span>
                      </div>
                      {act.note && <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.5 }}>{act.note}</div>}
                    </div>
                    <div style={{ fontSize: 11, color: "#475569", flexShrink: 0 }}>{act.date}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* VOICE NOTE MODAL */}
      {modal === "voice" && (
        <Modal title="🎙️ Voice Note" onClose={() => { setModal(null); setVoiceResult(null); }}>
          <Select label="Contact" value={voiceContactId} onChange={setVoiceContactId}
            options={contacts.map((c) => ({ value: c.id, label: `${c.name} — ${c.company}` }))} />
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600, marginBottom: 5, letterSpacing: "0.5px" }}>YOUR NOTE (type or paste a transcription)</div>
            <textarea value={voiceNote} onChange={(e) => setVoiceNote(e.target.value)} rows={4}
              placeholder="e.g. Just got off the phone with Jake, he liked the proposal but wants to reduce scope in phase 1..."
              style={{ width: "100%", background: "#1E293B", border: "1px solid #334155", borderRadius: 8, padding: "9px 12px", color: "#E2E8F0", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
          </div>
          {!voiceResult && (
            <Btn onClick={processVoiceNote} disabled={voiceProcessing || !voiceNote.trim()}>
              {voiceProcessing ? "AI is processing..." : "✨ Process with AI"}
            </Btn>
          )}
          {voiceResult && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, color: "#64748B", letterSpacing: "0.8px", fontWeight: 700, marginBottom: 12 }}>AI EXTRACTED</div>
              <div style={{ background: "#0A1628", borderRadius: 10, padding: 14, marginBottom: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 10, color: "#475569", marginBottom: 3 }}>ACTIVITY NOTE</div>
                  <div style={{ fontSize: 13, color: "#E2E8F0" }}>{voiceResult.summary}</div>
                </div>
                <div style={{ display: "flex", gap: 16 }}>
                  <div><div style={{ fontSize: 10, color: "#475569", marginBottom: 3 }}>TYPE</div><div style={{ fontSize: 12, textTransform: "capitalize" }}>{voiceResult.activityType}</div></div>
                  <div><div style={{ fontSize: 10, color: "#475569", marginBottom: 3 }}>SENTIMENT</div><div style={{ fontSize: 12, color: voiceResult.sentiment === "positive" ? "#22C55E" : voiceResult.sentiment === "cautious" ? "#F59E0B" : "#94A3B8", textTransform: "capitalize" }}>{voiceResult.sentiment}</div></div>
                  {voiceResult.stageSignal && <div><div style={{ fontSize: 10, color: "#475569", marginBottom: 3 }}>STAGE SIGNAL</div><div style={{ fontSize: 12, color: "#F59E0B", textTransform: "capitalize" }}>→ {voiceResult.stageSignal}</div></div>}
                  <div><div style={{ fontSize: 10, color: "#475569", marginBottom: 3 }}>URGENCY</div><div style={{ fontSize: 12, textTransform: "capitalize" }}>{voiceResult.urgency}</div></div>
                </div>
                {voiceResult.followUpSuggestion && (
                  <div><div style={{ fontSize: 10, color: "#475569", marginBottom: 3 }}>FOLLOW-UP CREATED</div><div style={{ fontSize: 12, color: "#60A5FA" }}>🔔 {voiceResult.followUpSuggestion}</div></div>
                )}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <Btn onClick={commitVoiceNote}>Save to CRM</Btn>
                <Btn variant="ghost" onClick={() => setVoiceResult(null)}>Re-process</Btn>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* COMM REVIEW MODAL */}
      {pendingComm && (
        <Modal title="Review Communication" onClose={() => setPendingComm(null)}>
          <div style={{ background: "#0A1628", borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "#475569", marginBottom: 8 }}>DETECTED FROM {pendingComm.channel.toUpperCase()}</div>
            <div style={{ fontSize: 13, color: "#E2E8F0", lineHeight: 1.6 }}>{pendingComm.summary}</div>
            {pendingComm.inferredStage && <div style={{ marginTop: 10, fontSize: 12, color: "#F59E0B" }}>AI suggests moving deal to: <strong>{pendingComm.inferredStage}</strong></div>}
          </div>
          <div style={{ fontSize: 13, color: "#64748B", marginBottom: 16 }}>
            Confirming will log this as an activity{pendingComm.inferredStage ? " and update the deal stage" : ""}.
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="success" onClick={() => acceptComm(pendingComm)}>Confirm and log</Btn>
            <Btn variant="danger" onClick={() => dismissComm(pendingComm.id)}>Dismiss</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
