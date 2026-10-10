/* global React */
// ---- Compliance Platforms & Insurance trackers (DEMO — fictional data) ----
const { useState: useTrState } = React;

const COMPLIANCE_PLATFORMS = [
  { name: "VendorShield", type: "Contractor prequalification", date: "2027-03-15", notes: "Annual subscription; Marshmallow Manor Realty requirement", user: "vendors@acmeexcel.com", account: "VS-104822", grade: "A" },
  { name: "SafeTrack Pro", type: "Safety & insurance verification", date: "2026-11-02", notes: "Upload renewed COI before due date", user: "compliance@acmeexcel.com", account: "STP-55190", grade: "B" },
  { name: "ClearPath Compliance", type: "Supplier onboarding", date: "2026-09-30", notes: "Renewal lapsed — Jellybean Junction sites", user: "vendors@acmeexcel.com", account: "CPC-20931", grade: "Pending" },
  { name: "GridReady Network", type: "Utility contractor registry", date: "2027-06-01", notes: "Covers Gumdrop Gardens + Rubber Duck Docks", user: "ops@acmeexcel.com", account: "GRN-7788", grade: "A" },
  { name: "Certivo", type: "Document & training tracking", date: "2026-12-10", notes: "Pilot training records synced quarterly", user: "safety@acmeexcel.com", account: "CTV-31045", grade: "A" },
  { name: "TrustLedger", type: "Financial & tax verification", date: "2027-01-20", notes: "W-9 and banking details on file", user: "finance@acmeexcel.com", account: "TL-90214", grade: "Verified" },
];

const INSURANCE_POLICIES = [
  { name: "Harborline Mutual", type: "Commercial General Liability", date: "2027-04-01", notes: "$[amount] per occurrence", policy: "CGL-2026-004417" },
  { name: "Aerosure Underwriters", type: "Aviation / UAS Liability", date: "2026-11-15", notes: "Covers all fleet aircraft + hull", policy: "UAS-88310-26" },
  { name: "Harborline Mutual", type: "Workers' Compensation", date: "2027-01-01", notes: "US entities; Canada via provincial boards", policy: "WC-2026-118204" },
  { name: "Teacup Specialty", type: "Professional Liability (E&O)", date: "2026-10-01", notes: "Renewal in progress with broker", policy: "PL-55021-A" },
  { name: "Butterfingers Casualty", type: "Commercial Auto", date: "2027-02-28", notes: "Hired & non-owned auto", policy: "CA-3390147" },
  { name: "Teacup Specialty", type: "Cyber Liability", date: "2027-05-12", notes: "Includes data breach response", policy: "CY-77420-26" },
  { name: "Harborline Mutual", type: "Umbrella / Excess", date: "2027-04-01", notes: "Follows form over CGL, Auto, EL", policy: "UMB-2026-004418" },
];

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d)) return null;
  return Math.ceil((d - new Date()) / 86400000);
}
function fmtDate(s) {
  const d = new Date(s + "T00:00:00");
  return isNaN(d) ? "—" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function trStatus(date) {
  const days = daysUntil(date);
  if (days === null) return { k: "none", label: "No date" };
  if (days < 0) return { k: "expired", label: "Expired" };
  if (days <= 60) return { k: "soon", label: "Due in " + days + "d" };
  return { k: "active", label: "Active" };
}
function ExpiryBadge({ date }) {
  const s = trStatus(date);
  return <span className={"tr-badge tr-badge-" + s.k}>{s.label}</span>;
}

const trShell = (title, body) => '<!doctype html><html><head><meta charset="utf-8"><style>' +
  'body{margin:0;background:#eef0f3;font:14px/1.55 system-ui,-apple-system,Segoe UI,sans-serif;color:#1f2933}' +
  '.bar{display:flex;align-items:center;gap:10px;padding:14px 22px;background:#fff;border-bottom:1px solid #e3e6eb}' +
  '.lg{width:28px;height:28px;border-radius:7px;background:#1f2933;color:#fff;font-weight:700;font-size:12px;display:flex;align-items:center;justify-content:center}' +
  '.wrap{max-width:760px;margin:28px auto;padding:0 16px}.card{position:relative;background:#fff;border-radius:10px;padding:28px 32px;box-shadow:0 2px 12px rgba(0,0,0,.06);overflow:hidden}' +
  'h1{font-size:21px;margin:0 0 4px}.sub{color:#6b7280;font-size:13px;margin:0 0 22px}' +
  '.row{display:grid;grid-template-columns:190px 1fr;gap:12px;padding:9px 0;border-bottom:1px solid #eceef2}.row b{color:#6b7280;font-weight:600}' +
  '.pill{display:inline-block;padding:2px 8px;border-radius:5px;font-size:12px;font-weight:600}.ok{background:#EAF6EE;color:#1F7A42}.warn{background:#FBF1DA;color:#92620B}.bad{background:#FBE9E9;color:#B23A3A}' +
  'table{width:100%;border-collapse:collapse;margin-top:18px;font-size:13px}th,td{text-align:left;padding:8px 10px;border-bottom:1px solid #eceef2}th{color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:.04em}' +
  '.wm{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-28deg);font-size:96px;font-weight:800;color:rgba(91,72,251,.07);pointer-events:none;white-space:nowrap}' +
  '.note{margin-top:22px;padding:12px 14px;background:#f5f3ff;border-radius:8px;font-size:12.5px;color:#4A37E6}' +
  '</style></head><body>' + body + '</body></html>';

function portalHtml(r) {
  const s = trStatus(r.date);
  const cls = s.k === "active" ? "ok" : s.k === "soon" ? "warn" : "bad";
  const docs = [["Certificate of Insurance", s.k === "expired" ? "Expired" : "Approved"], ["W-9 / Tax Form", "Approved"], ["Safety Program", "Approved"], ["EMR Letter", s.k === "active" ? "Approved" : "Update required"]];
  return trShell(r.name, '<div class="bar"><div class="lg">' + r.name.slice(0, 2).toUpperCase() + '</div><b>' + r.name + '</b><span style="margin-left:auto;color:#6b7280;font-size:13px">Signed in as ' + r.user + '</span></div>' +
    '<div class="wrap"><div class="card"><div class="wm">DEMO</div><h1>Supplier dashboard</h1><p class="sub">Acme Excel Holdings, Inc. · Account ' + r.account + '</p>' +
    '<div class="row"><b>Account status</b><span><span class="pill ' + cls + '">' + s.label + '</span></span></div>' +
    '<div class="row"><b>Compliance grade</b><span>' + r.grade + '</span></div>' +
    '<div class="row"><b>Subscription renews</b><span>' + fmtDate(r.date) + '</span></div>' +
    '<div class="row"><b>Program type</b><span>' + r.type + '</span></div>' +
    '<table><thead><tr><th>Requirement</th><th>Status</th></tr></thead><tbody>' +
    docs.map(([d, st]) => '<tr><td>' + d + '</td><td><span class="pill ' + (st === "Approved" ? "ok" : st === "Expired" ? "bad" : "warn") + '">' + st + '</span></td></tr>').join("") +
    '</tbody></table><div class="note">Demo portal — in the live wiki this opens the real platform login.</div></div></div>');
}
function policyHtml(r) {
  return trShell(r.type, '<div class="wrap"><div class="card"><div class="wm">SAMPLE</div>' +
    '<div style="display:flex;align-items:center;gap:10px;border-bottom:2px solid #1f2933;padding-bottom:14px;margin-bottom:24px"><div class="lg">' + r.name.slice(0, 2).toUpperCase() + '</div><b>' + r.name + '</b><span style="margin-left:auto;color:#6b7280;font-size:12px">Declarations page</span></div>' +
    '<h1>' + r.type + '</h1><p class="sub">Policy no. ' + r.policy + '</p>' +
    '<div class="row"><b>Named insured</b><span>Acme Excel Holdings, Inc.</span></div>' +
    '<div class="row"><b>Address</b><span>100 Main Street, Suite 100, Anytown, CA 90000</span></div>' +
    '<div class="row"><b>Policy period</b><span>' + fmtDate(String(Number(r.date.slice(0, 4)) - 1) + r.date.slice(4)) + ' – ' + fmtDate(r.date) + '</span></div>' +
    '<div class="row"><b>Limits</b><span>$[amount] each occurrence / $[amount] aggregate</span></div>' +
    '<div class="row"><b>Broker</b><span>Hartwell Brokers</span></div>' +
    '<div class="row"><b>Notes</b><span>' + r.notes + '</span></div>' +
    '<div class="note">Sample policy for demonstration — in the live wiki this links to the actual policy document.</div></div></div>');
}

function TrViewer({ doc, onClose }) {
  if (!doc) return null;
  return (
    <div className="tr-modal" onClick={onClose}>
      <div className="tr-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="tr-modal-head">
          <b>{doc.title}</b>
          <button className="tr-modal-x" onClick={onClose} aria-label="Close">×</button>
        </div>
        <iframe className="tr-modal-frame" srcDoc={doc.html} title={doc.title}></iframe>
      </div>
    </div>
  );
}

function TrackerTable({ rows, columns, linkLabel, onOpen }) {
  const sorted = [...rows].sort((a, b) => new Date(a.date) - new Date(b.date));
  return (
    <div className="tr-table-wrap">
      <table className="tr-table">
        <thead>
          <tr>{columns.map((c) => <th key={c}>{c}</th>)}<th>Status</th><th></th></tr>
        </thead>
        <tbody>
          {sorted.map((r, i) => (
            <tr key={i}>
              <td className="tr-name">{r.name}{r.policy && <div className="tr-sub">{r.policy}</div>}</td>
              <td>{r.type}</td>
              <td className="tr-date">{fmtDate(r.date)}</td>
              <td>{r.notes || "—"}</td>
              <td><ExpiryBadge date={r.date} /></td>
              <td><button className="tr-link" onClick={() => onOpen(r)}>{linkLabel} ↗</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TrSummary({ rows }) {
  const c = { expired: 0, soon: 0, active: 0 };
  rows.forEach((r) => { const k = trStatus(r.date).k; if (c[k] !== undefined) c[k]++; });
  return (
    <div className="tr-summary">
      <span className="tr-badge tr-badge-expired">{c.expired} expired</span>
      <span className="tr-badge tr-badge-soon">{c.soon} due within 60 days</span>
      <span className="tr-badge tr-badge-active">{c.active} active</span>
    </div>
  );
}

function CompliancePlatformsView() {
  const [doc, setDoc] = useTrState(null);
  return (
    <div className="page page-tracker">
      <div className="page-head">
        <div className="page-eyebrow">COMPLIANCE PLATFORMS</div>
        <h1 className="page-title">Vendor compliance platforms</h1>
        <p className="page-sub">Third-party compliance platforms we're registered on and when subscriptions or requirements are due.</p>
      </div>
      <TrSummary rows={COMPLIANCE_PLATFORMS} />
      <TrackerTable rows={COMPLIANCE_PLATFORMS} columns={["Platform", "Type", "Renewal / due", "Notes"]} linkLabel="Open portal"
        onOpen={(r) => setDoc({ title: r.name + " — Supplier portal", html: portalHtml(r) })} />
      <TrViewer doc={doc} onClose={() => setDoc(null)} />
    </div>
  );
}

function InsuranceView() {
  const [doc, setDoc] = useTrState(null);
  return (
    <div className="page page-tracker">
      <div className="page-head">
        <div className="page-eyebrow">INSURANCE</div>
        <h1 className="page-title">Insurance policies &amp; coverage</h1>
        <p className="page-sub">Carriers, coverage types, and expiration dates.</p>
      </div>
      <TrSummary rows={INSURANCE_POLICIES} />
      <TrackerTable rows={INSURANCE_POLICIES} columns={["Carrier", "Coverage", "Expires", "Notes"]} linkLabel="View policy"
        onOpen={(r) => setDoc({ title: r.type + " — " + r.policy, html: policyHtml(r) })} />
      <TrViewer doc={doc} onClose={() => setDoc(null)} />
    </div>
  );
}

Object.assign(window, { CompliancePlatformsView, InsuranceView, COMPLIANCE_PLATFORMS, INSURANCE_POLICIES, trStatus });
