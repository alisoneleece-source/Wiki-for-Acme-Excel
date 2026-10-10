/* global React */
// ---- Corporate Info ----
// Source of truth: the "AE Corporate Info" master Google Doc. Every data point
// below renders as a link back to that document so anyone can verify or expand.
const CORP_DOC_URL =
  "#";

const CORP_ENTITIES = [
  {
    id: "acme-excel-holdings-inc",
    name: "Acme Excel Holdings Inc.",
    dba: "dba Acme Excel",
    country: "USA",
    flag: "🇺🇸",
    type: "C-Corp",
    primary: true,
    meta: [
      { label: "Registered in", value: "Delaware" },
      { label: "Formed", value: "2015" },
    ],
    fields: [
      { label: "Registered address", value: "1 Registered Agent Way, Wilmington, Delaware 19800" },
      { label: "Head office", value: "100 Main Street, Suite 100, Anytown, CA 90000, United States" },
      { label: "Phone", value: "1 (555) 010-0100 (routed to Zendesk)", mono: true },
      { label: "Tax year end", value: "December 31" },
      { label: "Tax number (FEIN)", value: "12-0000000", mono: true, key: true },
      { label: "Registration no.", value: "0000000", mono: true },
      { label: "Secondary reg.", value: "SR00000000000", mono: true },
      { label: "DUNS", value: "000000000", mono: true, key: true },
      { label: "NAICS", value: "000000", mono: true, key: true },
      { label: "SIC", value: "0000", mono: true },
      { label: "Verticals", values: ["Properties (original)", "Retail", "Solar", "Utilities (TidyTiles)", "Geospatial"] },
      { label: "Directors", values: ["Richard Vance", "Howard Lim", "Rohan Iyer", "Stephen Clarke", "Peter Quinn (Chair)", "Adam Kessler"] },
      { label: "Officers / signatories", values: ["Richard Vance", "Neil Grant", "Derek Lang", "Claire Martin", "Alan Webb", "Wes Carver"] },
      { label: "Billing contact", value: "Kelsey Moss · billing@acmeexcel.com · 555-010-0200" },
    ],
  },
  {
    id: "insight-m",
    name: "Skyward Analytics Inc.",
    country: "USA",
    flag: "🇺🇸",
    type: "C-Corp",
    meta: [
      { label: "Registered in", value: "Delaware" },
      { label: "Acquired", value: "2022" },
      { label: "Formation", value: "Formed via merger with Project Kestrel Merger Co." },
    ],
    fields: [
      { label: "Registered address", value: "200 Example Road, Dover, Delaware 19900" },
      { label: "Head office", value: "300 Sample Ave, Sunnyvale, CA 94000, United States" },
      { label: "Tax year end", value: "December 31" },
      { label: "Tax number", value: "12-0000000", mono: true, key: true },
      { label: "Registration no.", value: "0000000", mono: true },
      { label: "Secondary reg.", value: "SR00000000000", mono: true },
      { label: "CAGE code", value: "0XX00", mono: true, key: true },
      { label: "Verticals", values: ["Oil and Gas"] },
      { label: "Directors", values: ["Richard Vance"] },
      { label: "Officers / signatories", values: ["Richard Vance"] },
      { label: "Key customers", values: ["Pogo Stick Pals", "Lazy River Rafts", "Bubblegum Basin", "Kazoo Kingdom"] },
    ],
  },
  {
    id: "acme-excel-holdings-europe",
    name: "Acme Excel Europe GmbH",
    country: "Germany",
    flag: "🇩🇪",
    type: "Company with Limited Liability",
    meta: [
      { label: "Founded", value: "2015" },
      { label: "Acquired", value: "2022" },
    ],
    fields: [
      { label: "Registered address", value: "Musterstraße 1, 40000 Musterstadt, Germany" },
      { label: "Head office", value: "Musterstraße 1, 40000 Musterstadt, Germany" },
      { label: "Tax year end", value: "December 31" },
      { label: "Tax number", value: "DE 000000000", mono: true, key: true },
      { label: "USt-IdNr / W-IdNr", value: "USt-IdNr DE000000000 · W-IdNr DE000000000-00001", mono: true },
      { label: "Registration no.", value: "HRB 000000", mono: true },
      { label: "EORI number", value: "DE000000000000000", mono: true, key: true },
      { label: "NACE (WZ Nummer)", value: "00.00.0", mono: true },
      { label: "Verticals", values: ["Retail (primary)", "Solar", "2025 expansion: Property"] },
      { label: "Directors", values: ["Lars Henning", "Richard Vance"] },
      { label: "Officers / signatories", values: ["Richard Vance"] },
      { label: "Key customers", values: ["GE"] },
    ],
  },
  {
    id: "acmeexcel-apac",
    name: "Acme Excel APAC Pvt Ltd",
    country: "India",
    flag: "🇮🇳",
    type: "Private Limited Company",
    meta: [
      { label: "Registered in", value: "Bangalore" },
      { label: "Founded", value: "2015" },
    ],
    fields: [
      { label: "Registered address", value: "Unit 1, Example Tech Park, Bengaluru, Karnataka 560000" },
      { label: "Head office", value: "Unit 1, Example Tech Park, Bangalore 560000" },
      { label: "Tax year end", value: "March 31" },
      { label: "Registration no. (CIN)", value: "U00000XX0000PTC000000", mono: true, key: true },
      { label: "Verticals", values: ["Solar", "Retail"] },
      { label: "Directors", values: ["Vikram Rao", "Richard Vance", "Brian Fenn"] },
      { label: "Officers / signatories", values: ["Vikram Rao", "Richard Vance"] },
    ],
  },
  {
    id: "acmeexcel-latam",
    name: "Acme Excel LatAm Ltd",
    country: "Brazil",
    flag: "🇧🇷",
    meta: [
      { label: "Founded", value: "2015" },
    ],
    fields: [
      { label: "Registered address", value: "Av. Exemplo 100, Rio de Janeiro, Brazil" },
      { label: "Head office", value: "Av. Exemplo 100, Centro, Rio de Janeiro 20000-000" },
      { label: "Tax year end", value: "December 31" },
      { label: "Verticals", values: ["Retail (primary)", "Solar (rarely)"] },
      { label: "Directors", values: ["Thiago Lima"] },
      { label: "Officers / signatories", values: ["Thiago Lima"] },
      { label: "Key customers", values: ["GE"] },
    ],
  },
  {
    id: "acmeexcel-canada",
    name: "Acme Excel Canada Inc.",
    country: "Canada",
    flag: "🇨🇦",
    type: "Corporation",
    meta: [
      { label: "Registered in", value: "Ontario" },
    ],
    fields: [
      { label: "Registered address", value: "100 Sample St, Toronto, Ontario Canada M5V 0A0" },
      { label: "Head office", value: "100 Sample St, Toronto, Ontario Canada M5V 0A0" },
      { label: "Tax year end", value: "December 31" },
      { label: "Tax number", value: "000000000", mono: true, key: true },
      { label: "Registration no.", value: "0000000000", mono: true },
      { label: "Verticals", values: ["Solar (manned aircraft)", "Expansion: Retail, Geospatial"] },
      { label: "Directors", values: ["Richard Vance", "Brian Fenn"] },
      { label: "Officers / signatories", values: ["Richard Vance"] },
    ],
  },
];

function openCorpDoc(e) {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  const esc = window.escHtml;
  const body = CORP_ENTITIES.map((ent) => '<h2>' + esc(ent.name) + (ent.dba ? ' <span style="font-weight:400;color:#6b7280">' + esc(ent.dba) + '</span>' : '') + '</h2>' +
    '<div class="row"><b>Country</b><span>' + esc(ent.country) + (ent.type ? ' · ' + esc(ent.type) : '') + '</span></div>' +
    (ent.meta || []).concat(ent.fields || []).map((f) => '<div class="row"><b>' + esc(f.label) + '</b><span>' + esc(f.values ? f.values.join(', ') : f.value) + '</span></div>').join('')).join('') +
    '<h2>Schedule of Insurance Portfolio</h2><div class="row"><b>Named insured</b><span>Acme Excel Holdings Inc. and subsidiaries</span></div><div class="row"><b>Territory</b><span>Worldwide</span></div><div class="row"><b>Policies</b><span>General Liability, Professional Liability (E&amp;O), Cyber Liability, Commercial Auto, Aviation Liability, Umbrella, Workers Compensation</span></div>';
  window.showDocOverlay(window.buildSampleDoc('AE Corporate Info', 'Master record of legal entities, tax IDs and registrations · Updated 01 Jan 2026', body), 'AE Corporate Info');
}

// A data point that links back to the master corporate doc.
function DocValue({ children, mono, isKey, title }) {
  return (
    <a
      className={"corp-link" + (mono ? " mono" : "") + (isKey ? " key" : "")}
      href="#"
      onClick={openCorpDoc}
      title={title || "Open in AE Corporate Info doc"}
    >
      {children}
    </a>
  );
}

function CorpIcon({ name }) {
  if (name === "doc") {
    return (
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden>
        <path d="M4 1.5 H9.5 L13 5 V14 a0.6 0.6 0 0 1 -0.6 0.6 H4 a0.6 0.6 0 0 1 -0.6 -0.6 V2.1 A0.6 0.6 0 0 1 4 1.5 Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M9.3 1.7 V5 H12.8 M5.6 8 H10.4 M5.6 10.4 H10.4" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }
  if (name === "arrow") {
    return (
      <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden>
        <path d="M5 11 L11 5 M6.2 5 H11 V9.8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return null;
}

function CorpCard({ entity }) {
  return (
    <article className={"corp-card" + (entity.inactive ? " corp-inactive" : "") + (entity.primary ? " corp-primary" : "")}>
      <header className="corp-card-head">
        <div className="corp-flag" aria-hidden>{entity.flag}</div>
        <div className="corp-id">
          <div className="corp-name">
            {entity.name}
            {entity.status && <span className="corp-status">{entity.status}</span>}
          </div>
          <div className="corp-sub">
            {entity.dba && <span className="corp-dba">{entity.dba}</span>}
            <span className="corp-country">{entity.country}</span>
            {entity.type && <><span className="corp-bdot">·</span><span>{entity.type}</span></>}
          </div>
        </div>
      </header>

      {entity.meta && entity.meta.length > 0 && (
        <div className="corp-meta">
          {entity.meta.map((m) => (
            <div key={m.label} className="corp-meta-item">
              <span className="corp-meta-label">{m.label}</span>
              <DocValue title={m.label}>{m.value}</DocValue>
            </div>
          ))}
        </div>
      )}

      <dl className="corp-fields">
        {entity.fields.map((f) => (
          <div key={f.label} className="corp-field">
            <dt>{f.label}</dt>
            <dd>
              {f.values ? (
                <span className="corp-chips">
                  {f.values.map((v, i) => (
                    <DocValue key={i} title={f.label}>{v}</DocValue>
                  ))}
                </span>
              ) : (
                <DocValue mono={f.mono} isKey={f.key} title={f.label}>{f.value}</DocValue>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function CorporateView() {
  const { useState, useMemo } = React;
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return CORP_ENTITIES;
    return CORP_ENTITIES.filter((e) => {
      const hay = (e.name + " " + e.country + " " + (e.type || "") + " " +
        e.fields.map((f) => (f.value || "") + " " + (f.values || []).join(" ")).join(" ")).toLowerCase();
      return hay.includes(needle);
    });
  }, [q]);

  const activeCount = CORP_ENTITIES.filter((e) => !e.inactive).length;
  const countryCount = new Set(CORP_ENTITIES.filter((e) => !e.inactive).map((e) => e.country)).size;

  return (
    <div className="page page-corporate">
      <div className="page-head">
        <div className="page-eyebrow">CORPORATE INFO</div>
        <h1 className="page-title">Legal entities &amp; registrations</h1>
        <p className="page-sub">
          The Acme Excel group of companies — {activeCount} active entities across {countryCount} countries.
          Every field links straight to the master <b>AE Corporate Info</b> doc, the single source of truth for tax IDs, addresses, and registrations.
        </p>
      </div>

      <a className="corp-source" href="#" onClick={openCorpDoc}>
        <span className="corp-source-icon"><CorpIcon name="doc" /></span>
        <span className="corp-source-text">
          <b>AE Corporate Info</b>
          <span>Master Google Doc · click any value below to open it</span>
        </span>
        <span className="corp-source-go">Open doc <CorpIcon name="arrow" /></span>
      </a>

      <div className="corp-toolbar">
        <div className="corp-search">
          <svg viewBox="0 0 20 20" width="17" height="17" aria-hidden>
            <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M14 14 L18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter entities — name, country, tax ID, address…"
            aria-label="Filter corporate entities"
          />
          {q && <button className="corp-search-clear" onClick={() => setQ("")} aria-label="Clear">✕</button>}
        </div>
        <div className="corp-count">{filtered.length} of {CORP_ENTITIES.length} entities</div>
      </div>

      <div className="corp-grid">
        {filtered.map((e) => <CorpCard key={e.id} entity={e} />)}
        {filtered.length === 0 && (
          <div className="corp-empty">No entities match “<b>{q}</b>”.</div>
        )}
      </div>

      <div className="corp-footnote">
        <span className="corp-foot-label">Also in the doc</span>
        <a className="corp-link" href="#" onClick={openCorpDoc}>
          Schedule of Insurance Portfolio for Acme Excel Holdings Inc. (worldwide coverage for subsidiaries noted in the comments) <CorpIcon name="arrow" />
        </a>
      </div>
    </div>
  );
}

window.CorporateView = CorporateView;
