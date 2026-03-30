"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type SignalSource = "email" | "voice" | "meeting" | "calendar" | "whatsapp" | "manual";
type CRMDest = "builtin" | "salesforce" | "hubspot" | "pipedrive";
type AutoPref = "auto" | "smart" | "prompt-all";

interface WizardConfig {
  signalSources: SignalSource[];
  crmDestination: CRMDest;
  automationPref: AutoPref;
}

interface SourceOption {
  id: SignalSource;
  icon: string;
  label: string;
  desc: string;
  available: boolean;
}

interface CRMOption {
  id: CRMDest;
  icon: string;
  label: string;
  desc: string;
  available: boolean;
}

interface AutoOption {
  id: AutoPref;
  icon: string;
  label: string;
  desc: string;
}

const SOURCES: SourceOption[] = [
  { id: "email",    icon: "✉️",  label: "Email",                desc: "Scan Gmail or Outlook for deal signals and contact updates",          available: false },
  { id: "voice",    icon: "🎙️", label: "Voice Notes",          desc: "Record or upload voice notes — AI extracts structured CRM updates",   available: true  },
  { id: "meeting",  icon: "📋",  label: "Meeting Notes",        desc: "Paste meeting notes and let AI map them to deals and contacts",       available: false },
  { id: "calendar", icon: "📅",  label: "Calendar",             desc: "Infer relationship activity from Google Calendar or Outlook",         available: false },
  { id: "whatsapp", icon: "💬",  label: "WhatsApp / Messaging", desc: "Capture deal signals from WhatsApp and other messaging apps",         available: false },
  { id: "manual",   icon: "✏️",  label: "Manual Input",         desc: "Log updates yourself — always available as a fallback",              available: true  },
];

const CRM_OPTIONS: CRMOption[] = [
  { id: "builtin",    icon: "⚡",  label: "NimbleCRM (built-in)", desc: "Use NimbleCRM's lightweight built-in CRM — no setup needed",        available: true  },
  { id: "salesforce", icon: "☁️", label: "Salesforce",           desc: "Sync captured updates to your Salesforce org",                       available: false },
  { id: "hubspot",    icon: "🟠",  label: "HubSpot",              desc: "Push captured data directly into HubSpot",                          available: false },
  { id: "pipedrive",  icon: "🔵",  label: "Pipedrive",            desc: "Keep your Pipedrive deals up to date automatically",                 available: false },
];

const AUTO_OPTIONS: AutoOption[] = [
  { id: "auto",       icon: "⚡", label: "Auto-pilot",                     desc: "Log all changes silently — I'll review in AI Radar when needed" },
  { id: "smart",      icon: "🧠", label: "Smart mode (recommended)",       desc: "Auto-log low-stakes changes, prompt me for important ones like deal stage or close date" },
  { id: "prompt-all", icon: "👁️", label: "Prompt me for everything",       desc: "Always ask before logging any change — I want full control" },
];

const STEP_LABELS = ["Welcome", "Signal Sources", "CRM", "Automation", "Summary"];
const TOTAL = STEP_LABELS.length;

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  page:         { minHeight: "100vh", background: "#020817", color: "#E2E8F0", fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif", display: "flex", flexDirection: "column" as const, alignItems: "center", padding: "40px 20px" },
  header:       { width: "100%", maxWidth: 620, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40 },
  logo:         { fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" },
  skipBtn:      { background: "none", border: "none", color: "#475569", fontSize: 13, cursor: "pointer", fontWeight: 500 },
  progressWrap: { width: "100%", maxWidth: 620, marginBottom: 24 },
  progressTrack:{ height: 3, background: "#1E293B", borderRadius: 999, overflow: "hidden" as const, marginBottom: 8 },
  progressFill: (pct: number) => ({ height: "100%", background: "#3B82F6", borderRadius: 999, transition: "width 0.3s ease", width: `${pct}%` }),
  stepLabel:    { display: "flex", justifyContent: "space-between", fontSize: 11, color: "#475569", fontWeight: 600 as const, letterSpacing: "0.3px" },
  card:         { width: "100%", maxWidth: 620, background: "#0F172A", border: "1px solid #1E293B", borderRadius: 16, padding: "36px 40px" },
  title:        { fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 8, color: "#fff" },
  subtitle:     { fontSize: 14, color: "#64748B", lineHeight: 1.6, marginBottom: 28 },
  optionCard:   (selected: boolean, disabled: boolean) => ({
    display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 16px", borderRadius: 10,
    border: `1px solid ${selected ? "#3B82F6" : "#1E293B"}`,
    background: selected ? "#1E3A5F" : disabled ? "#080F1A" : "#0A1628",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    marginBottom: 10, transition: "all 0.15s ease",
  }),
  optionIcon:   { fontSize: 22, lineHeight: 1, paddingTop: 1 },
  optionLabel:  (selected: boolean) => ({ fontSize: 14, fontWeight: 600, color: selected ? "#fff" : "#CBD5E1", marginBottom: 3 }),
  optionDesc:   { fontSize: 12, color: "#64748B", lineHeight: 1.5 },
  badge:        { fontSize: 10, fontWeight: 700, background: "#F59E0B22", color: "#F59E0B", padding: "2px 7px", borderRadius: 20, letterSpacing: "0.3px" },
  check:        (selected: boolean) => ({
    width: 18, height: 18, borderRadius: 4, border: `2px solid ${selected ? "#3B82F6" : "#334155"}`,
    background: selected ? "#3B82F6" : "transparent", display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, marginTop: 2,
  }),
  radio:        (selected: boolean) => ({
    width: 18, height: 18, borderRadius: "50%", border: `2px solid ${selected ? "#3B82F6" : "#334155"}`,
    background: "transparent", display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, marginTop: 2,
  }),
  radioDot:     { width: 8, height: 8, borderRadius: "50%", background: "#3B82F6" },
  footer:       { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 28, paddingTop: 24, borderTop: "1px solid #1E293B" },
  btnPrimary:   { background: "#3B82F6", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  btnSecondary: { background: "none", color: "#64748B", border: "1px solid #334155", borderRadius: 8, padding: "10px 18px", fontSize: 14, fontWeight: 500, cursor: "pointer" },
  summaryRow:   (last: boolean) => ({ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "14px 0", borderBottom: last ? "none" : "1px solid #1E293B" }),
  summaryLabel: { fontSize: 11, color: "#64748B", fontWeight: 700 as const, letterSpacing: "0.5px", marginBottom: 6 },
  summaryValue: { fontSize: 13, color: "#E2E8F0", lineHeight: 1.6 },
  editBtn:      { background: "none", border: "none", color: "#3B82F6", fontSize: 12, cursor: "pointer", fontWeight: 600 as const, flexShrink: 0 },
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function IntegrationWizard({ user }: { user: User }) {
  const router = useRouter();
  const [step, setStep]     = useState(0);
  const [config, setConfig] = useState<WizardConfig>({ signalSources: ["manual"], crmDestination: "builtin", automationPref: "smart" });
  const [saving, setSaving] = useState(false);
  const [done, setDone]     = useState(false);

  // Load saved draft on mount
  useEffect(() => {
    supabase
      .from("crm_store")
      .select("value")
      .eq("user_id", user.id)
      .eq("key", "wizard_draft")
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          try {
            const draft = JSON.parse(data.value) as { config: WizardConfig; step: number };
            if (draft.config) setConfig(draft.config);
            if (typeof draft.step === "number") setStep(Math.min(draft.step, TOTAL - 1));
          } catch {
            // ignore malformed draft
          }
        }
      });
  }, [user.id]);

  const saveDraft = async (nextConfig: WizardConfig, nextStep: number) => {
    await supabase
      .from("crm_store")
      .upsert(
        { user_id: user.id, key: "wizard_draft", value: JSON.stringify({ config: nextConfig, step: nextStep }) },
        { onConflict: "user_id,key" }
      );
  };

  const goNext = async () => {
    const next = Math.min(step + 1, TOTAL - 1);
    await saveDraft(config, next);
    setStep(next);
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const saveAndExit = async () => {
    await saveDraft(config, step);
    router.push("/");
  };

  const toggleSource = (id: SignalSource) => {
    setConfig((prev) => ({
      ...prev,
      signalSources: prev.signalSources.includes(id)
        ? prev.signalSources.filter((s) => s !== id)
        : [...prev.signalSources, id],
    }));
  };

  const complete = async () => {
    setSaving(true);
    await supabase.from("crm_store").upsert(
      { user_id: user.id, key: "integration_config", value: JSON.stringify(config) },
      { onConflict: "user_id,key" }
    );
    await supabase.from("crm_store").upsert(
      { user_id: user.id, key: "wizard_completed", value: JSON.stringify(true) },
      { onConflict: "user_id,key" }
    );
    // Clear draft now that wizard is done
    await supabase.from("crm_store").delete().eq("user_id", user.id).eq("key", "wizard_draft");
    setSaving(false);
    setDone(true);
  };

  // ── Done state ──────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div style={S.page}>
        <div style={S.card}>
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 56, marginBottom: 20 }}>✅</div>
            <div style={S.title}>You&apos;re all set!</div>
            <div style={{ ...S.subtitle, textAlign: "center", marginBottom: 28 }}>
              Your integration preferences have been saved. NimbleCRM is ready to start capturing signals for you.
            </div>
            <button onClick={() => router.push("/")} style={{ ...S.btnPrimary, fontSize: 15, padding: "12px 32px" }}>
              Go to dashboard →
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progressPct = step === 0 ? 0 : Math.round((step / (TOTAL - 1)) * 100);

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.logo}>⚡ NimbleCRM</div>
        {step > 0 && (
          <button onClick={saveAndExit} style={S.skipBtn}>Save &amp; finish later</button>
        )}
      </div>

      {/* Progress bar */}
      {step > 0 && (
        <div style={S.progressWrap}>
          <div style={S.progressTrack}>
            <div style={S.progressFill(progressPct)} />
          </div>
          <div style={S.stepLabel}>
            <span>Step {step} of {TOTAL - 1}</span>
            <span>{STEP_LABELS[step]}</span>
          </div>
        </div>
      )}

      {/* Card */}
      <div style={S.card} data-testid="wizard-card">

        {/* ── Step 0: Welcome ── */}
        {step === 0 && (
          <div>
            <div style={{ fontSize: 44, marginBottom: 20 }}>👋</div>
            <div style={S.title}>Welcome to NimbleCRM</div>
            <div style={S.subtitle}>
              NimbleCRM keeps your CRM up to date automatically by listening for signals in your email,
              voice notes, meetings, and more.<br /><br />
              This quick setup takes about 2 minutes. We&apos;ll ask where your deal activity happens,
              which CRM you use, and how hands-on you want to be.
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const, marginBottom: 28 }}>
              {[
                { icon: "✉️", label: "Email signals" },
                { icon: "🎙️", label: "Voice notes" },
                { icon: "📋", label: "Meeting notes" },
                { icon: "📅", label: "Calendar" },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6, background: "#0A1628", border: "1px solid #1E293B", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "#94A3B8" }}>
                  {item.icon} {item.label}
                </div>
              ))}
            </div>
            <button onClick={goNext} style={{ ...S.btnPrimary, fontSize: 15, padding: "12px 32px" }} data-testid="wizard-start">
              Let&apos;s get started →
            </button>
          </div>
        )}

        {/* ── Step 1: Signal Sources ── */}
        {step === 1 && (
          <div>
            <div style={S.title}>Where does your deal activity live?</div>
            <div style={S.subtitle}>
              Select all the places where conversations about your deals and contacts happen.
              We&apos;ll connect to these to automatically capture CRM updates.
            </div>
            {SOURCES.map((src) => {
              const selected = config.signalSources.includes(src.id);
              return (
                <div
                  key={src.id}
                  style={S.optionCard(selected, !src.available)}
                  onClick={() => src.available && toggleSource(src.id)}
                  data-testid={`source-${src.id}`}
                >
                  <div style={S.check(selected)}>
                    {selected && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}
                  </div>
                  <div style={S.optionIcon}>{src.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={S.optionLabel(selected)}>{src.label}</span>
                      {!src.available && <span style={S.badge}>COMING SOON</span>}
                    </div>
                    <div style={S.optionDesc}>{src.desc}</div>
                  </div>
                </div>
              );
            })}
            <div style={S.footer}>
              <button onClick={goBack} style={S.btnSecondary}>← Back</button>
              <button onClick={goNext} style={S.btnPrimary} data-testid="wizard-next">Next →</button>
            </div>
          </div>
        )}

        {/* ── Step 2: CRM Destination ── */}
        {step === 2 && (
          <div>
            <div style={S.title}>Which CRM do you use?</div>
            <div style={S.subtitle}>
              NimbleCRM will push captured data here. If you don&apos;t have a CRM yet, the built-in
              option gets you started instantly with no setup needed.
            </div>
            {CRM_OPTIONS.map((opt) => {
              const selected = config.crmDestination === opt.id;
              return (
                <div
                  key={opt.id}
                  style={S.optionCard(selected, !opt.available)}
                  onClick={() => opt.available && setConfig((prev) => ({ ...prev, crmDestination: opt.id }))}
                  data-testid={`crm-${opt.id}`}
                >
                  <div style={S.radio(selected)}>
                    {selected && <div style={S.radioDot} />}
                  </div>
                  <div style={S.optionIcon}>{opt.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                      <span style={S.optionLabel(selected)}>{opt.label}</span>
                      {!opt.available && <span style={S.badge}>COMING SOON</span>}
                    </div>
                    <div style={S.optionDesc}>{opt.desc}</div>
                  </div>
                </div>
              );
            })}
            <div style={S.footer}>
              <button onClick={goBack} style={S.btnSecondary}>← Back</button>
              <button onClick={goNext} style={S.btnPrimary} data-testid="wizard-next">Next →</button>
            </div>
          </div>
        )}

        {/* ── Step 3: Automation Preferences ── */}
        {step === 3 && (
          <div>
            <div style={S.title}>How hands-on do you want to be?</div>
            <div style={S.subtitle}>
              Choose how NimbleCRM should handle automated updates. You can change this any time
              from Settings → Integrations.
            </div>
            {AUTO_OPTIONS.map((opt) => {
              const selected = config.automationPref === opt.id;
              return (
                <div
                  key={opt.id}
                  style={S.optionCard(selected, false)}
                  onClick={() => setConfig((prev) => ({ ...prev, automationPref: opt.id }))}
                  data-testid={`auto-${opt.id}`}
                >
                  <div style={S.radio(selected)}>
                    {selected && <div style={S.radioDot} />}
                  </div>
                  <div style={S.optionIcon}>{opt.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ ...S.optionLabel(selected), marginBottom: 3 }}>{opt.label}</div>
                    <div style={S.optionDesc}>{opt.desc}</div>
                  </div>
                </div>
              );
            })}
            <div style={S.footer}>
              <button onClick={goBack} style={S.btnSecondary}>← Back</button>
              <button onClick={goNext} style={S.btnPrimary} data-testid="wizard-next">Next →</button>
            </div>
          </div>
        )}

        {/* ── Step 4: Summary ── */}
        {step === 4 && (
          <div>
            <div style={S.title}>Here&apos;s your setup</div>
            <div style={S.subtitle}>
              Review your choices before we save them. You can always change these later from
              Settings → Integrations.
            </div>

            <div style={S.summaryRow(false)}>
              <div style={{ flex: 1 }}>
                <div style={S.summaryLabel}>SIGNAL SOURCES</div>
                <div style={S.summaryValue}>
                  {config.signalSources.length > 0
                    ? config.signalSources
                        .map((id) => SOURCES.find((s) => s.id === id)?.label)
                        .filter(Boolean)
                        .join(", ")
                    : "None selected"}
                </div>
              </div>
              <button onClick={() => setStep(1)} style={S.editBtn}>Edit</button>
            </div>

            <div style={S.summaryRow(false)}>
              <div style={{ flex: 1 }}>
                <div style={S.summaryLabel}>CRM DESTINATION</div>
                <div style={S.summaryValue}>
                  {CRM_OPTIONS.find((o) => o.id === config.crmDestination)?.label ?? "Not set"}
                </div>
              </div>
              <button onClick={() => setStep(2)} style={S.editBtn}>Edit</button>
            </div>

            <div style={S.summaryRow(true)}>
              <div style={{ flex: 1 }}>
                <div style={S.summaryLabel}>AUTOMATION</div>
                <div style={S.summaryValue}>
                  {AUTO_OPTIONS.find((o) => o.id === config.automationPref)?.label ?? "Not set"}
                </div>
              </div>
              <button onClick={() => setStep(3)} style={S.editBtn}>Edit</button>
            </div>

            <div style={S.footer}>
              <button onClick={goBack} style={S.btnSecondary}>← Back</button>
              <button
                onClick={complete}
                disabled={saving}
                style={{ ...S.btnPrimary, opacity: saving ? 0.7 : 1 }}
                data-testid="wizard-confirm"
              >
                {saving ? "Saving…" : "Confirm & finish ✓"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
