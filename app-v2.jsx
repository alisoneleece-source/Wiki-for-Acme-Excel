/* global React, ReactDOM */
const { useState, useEffect, useMemo, useRef } = React;

// ---- Editor access ----
// Only people who know this passcode can switch the wiki into editor mode and
// edit entries. NOTE: this is a client-side gate (the file has no server), so it
// keeps editing out of casual reach but is not hardened security.
// To change the passcode, replace the char codes below with your own. Quick way:
//   in the browser console run:  [...'yourcode'].map(c=>c.charCodeAt(0))
// then paste the resulting array here.
const EDITOR_PASSCODE = String.fromCharCode(100,101,109,111,50,48,50,54); // "demo2026"

// ---- Tweaks: persistent defaults ----
const TWEAKS = /*EDITMODE-BEGIN*/{
  "primaryColor": "#3A28C4",
  "accentTint": "#EFECFF",
  "cardDensity": "comfortable",
  "showReplyCount": true,
  "heroStyle": "gradient"
}/*EDITMODE-END*/;

// ---- Helpers ----
const CATEGORIES_ORDER = [
  "Vendor Portals & Registration",
  "Finance",
  "Legal",
  "Company Info",
  "Safety & Compliance",
  "Sustainability",
  "Insurance",
];

const CATEGORY_SHORT = {
  "Vendor Portals & Registration": "Portals",
  "Finance": "Finance",
  "Legal": "Legal",
  "Company Info": "Company",
  "Safety & Compliance": "Safety",
  "Sustainability": "ESG",
  "Insurance": "Insurance",
};

function parseDate(s) {
  // "Jul 30, 2024"
  if (!s) return 0;
  const d = new Date(s);
  return isNaN(d) ? 0 : d.getTime();
}

function initials(name) {
  if (!name) return "··";
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.[0] || "";
  const b = parts[parts.length - 1]?.[0] || "";
  return (a + b).toUpperCase();
}

// Deterministic avatar color from the palette
const AVATAR_COLORS = ["#3A28C4"];
function avatarColor(name) {
  let h = 0;
  for (const c of name || "·") h = (h * 31 + c.charCodeAt(0)) % 9973;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

// ---- Search synonyms ----
// A typed token matches an entry if the entry's text contains the token itself
// OR any of the token's synonyms. Lets internal shorthand/tickers (e.g. "solv")
// surface everything in a topic area (solar energy) without retagging the data.
const SEARCH_SYNONYMS = {
  solv: ["solar", "photovoltaic", "photovoltaics", "pv", "renewable", "renewables"],
};
function tokenHits(hay, token) {
  if (hay.includes(token)) return true;
  const syns = SEARCH_SYNONYMS[token];
  return syns ? syns.some((s) => hay.includes(s)) : false;
}

function highlight(text, q) {
  if (!q || !text) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark>{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

// ---- Iconography (minimal, hand-drawn SVG primitives only) ----
const Icon = {
  Search: (p) => (
    <svg viewBox="0 0 20 20" width="18" height="18" {...p}>
      <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14 14 L18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  Check: (p) => (
    <svg viewBox="0 0 16 16" width="14" height="14" {...p}>
      <path d="M3 8.5 L6.5 12 L13 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Warn: (p) => (
    <svg viewBox="0 0 16 16" width="14" height="14" {...p}>
      <circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 5 V9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="8" cy="11.3" r="0.9" fill="currentColor" />
    </svg>
  ),
  Chevron: (p) => (
    <svg viewBox="0 0 12 12" width="12" height="12" {...p}>
      <path d="M4 3 L8 6 L4 9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Arrow: (p) => (
    <svg viewBox="0 0 16 16" width="14" height="14" {...p}>
      <path d="M3 8 H12 M9 5 L12 8 L9 11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Slack: (p) => (
    <svg viewBox="0 0 16 16" width="12" height="12" {...p}>
      <rect x="2" y="6.2" width="5.6" height="1.6" rx="0.8" fill="currentColor" />
      <rect x="8.4" y="8.4" width="5.6" height="1.6" rx="0.8" fill="currentColor" />
      <rect x="6.2" y="8.4" width="1.6" height="5.6" rx="0.8" fill="currentColor" />
      <rect x="8.4" y="2" width="1.6" height="5.6" rx="0.8" fill="currentColor" />
    </svg>
  ),
  Filter: (p) => (
    <svg viewBox="0 0 16 16" width="13" height="13" {...p}>
      <path d="M2 3 H14 L10 8 V13 L6 11.5 V8 L2 3 Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  ),
  Close: (p) => (
    <svg viewBox="0 0 12 12" width="12" height="12" {...p}>
      <path d="M3 3 L9 9 M9 3 L3 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  Sparkle: (p) => (
    <svg viewBox="0 0 16 16" width="14" height="14" {...p}>
      <path d="M8 1 L9.2 6.8 L15 8 L9.2 9.2 L8 15 L6.8 9.2 L1 8 L6.8 6.8 Z" fill="currentColor" />
    </svg>
  ),
  Lock: (p) => (
    <svg viewBox="0 0 16 16" width="14" height="14" {...p}>
      <rect x="3.2" y="7" width="9.6" height="6.4" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.4 7 V5.2 a2.6 2.6 0 0 1 5.2 0 V7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Unlock: (p) => (
    <svg viewBox="0 0 16 16" width="14" height="14" {...p}>
      <rect x="3.2" y="7" width="9.6" height="6.4" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.4 7 V5.2 a2.6 2.6 0 0 1 5.0 -0.9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  Doc: (p) => (
    <svg viewBox="0 0 16 16" width="13" height="13" {...p}>
      <path d="M4 1.5 h5 L12.5 5 v9 a0.6 0.6 0 0 1 -0.6 0.6 H4 a0.6 0.6 0 0 1 -0.6 -0.6 V2.1 A0.6 0.6 0 0 1 4 1.5 Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M8.8 1.7 V5 H12.3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M5.6 8 H10.4 M5.6 10.4 H10.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
};

// ---- Appendices: documents that source wiki entries ----
// Entries with an `appendix` key point here instead of a Slack thread.
const APPENDICES = {
  A: {
    id: "A",
    title: "Client RFP Questionnaire",
    type: "Google Sheet",
    date: "December 2025",
    url: "#",
    description: "Vendor due-diligence questionnaire completed for Marshmallow Manor Realty. Answers were drawn directly from this filled-in response document rather than a Slack discussion.",
  },
  B: {
    id: "B",
    title: "EMEA Chamber of Commerce",
    type: "Document",
    date: "June 2026",
    url: "#",
    description: "Chamber of Commerce registration for Acme Excel's EMEA entity. The original certificate is in German; an English translation is linked from the entry it backs.",
  },
};

// ---- Top Nav ----
function TopNav({ tab, setTab, editor, setEditor }) {
  const toggleEditor = () => {
    if (editor) {
      setEditor(false);
      try { localStorage.removeItem("demo_wiki_editor"); } catch {}
      return;
    }
    const code = window.prompt("Enter editor passcode to enable editing:");
    if (code == null) return;
    if (code === EDITOR_PASSCODE) {
      setEditor(true);
      try { localStorage.setItem("demo_wiki_editor", "1"); } catch {}
    } else {
      window.alert("Incorrect passcode. Editing stays locked.");
    }
  };
  const exportEdits = async () => {
    let raw = "{}";
    try { raw = localStorage.getItem("demo_wiki_edits") || "{}"; } catch {}
    const obj = JSON.parse(raw || "{}");
    if (!Object.keys(obj).length) {
      window.alert("No saved edits yet. Edit an entry first, then export.");
      return;
    }
    const pretty = JSON.stringify(obj, null, 2);
    // Copy to clipboard so it can be pasted straight back into chat
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(pretty);
      else {
        const ta = document.createElement("textarea");
        ta.value = pretty; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select(); document.execCommand("copy");
        document.body.removeChild(ta);
      }
    } catch (_) {}
    // Also download a file as a backup
    try {
      const blob = new Blob([pretty], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "wiki-edits.json";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } catch (_) {}
    window.alert("Copied your edits to the clipboard (and downloaded wiki-edits.json). Paste them into the chat so they can be saved permanently.");
  };
  const tabs = [
    { k: "wiki", label: "Wiki" },
    { k: "submissions", label: "Submissions" },
    { k: "corporate", label: "Corporate Info" },
    { k: "compliance-platforms", label: "Compliance Platforms" },
    { k: "insurance", label: "Insurance" },
    { k: "contacts", label: "Contacts" },
    { k: "appendix", label: "Appendix" },
    { k: "changelog", label: "Changelog" },
  ];
  return (
    <div className="topnav">
      <div className="topnav-inner">
        <div className="wordmark" onClick={() => setTab("wiki")} style={{ cursor: "pointer" }}>
          <img className="brand-logo" src={window.BRAND_LOGO} alt="Acme Excel" />
          <div className="brand-sub">Vendor Wiki</div>
        </div>
        <nav className="top-links">
          {tabs.map((t) => (
            <a
              key={t.k}
              className={"top-link " + (tab === t.k ? "active" : "")}
              onClick={() => setTab(t.k)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setTab(t.k); } }}
            >
              {t.label}
            </a>
          ))}
        </nav>
        <div className="topnav-right">
          <button className="icon-btn" title="Ask AI">
            <Icon.Sparkle />
          </button>
          <button
            className={"icon-btn" + (editor ? " editor-on" : "")}
            onClick={toggleEditor}
            title={editor ? "Editor mode on — click to lock" : "Unlock editing (passcode)"}
            aria-pressed={editor}
          >
            {editor ? <Icon.Unlock /> : <Icon.Lock />}
          </button>
          {editor && (
            <button className="export-edits-btn" onClick={exportEdits} title="Export your saved edits to share/save permanently">
              Export edits
            </button>
          )}
          <div className="avatar-me" title="You">
            <span>AE</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Hero ----
const CAT_COLORS = {"Vendor Portals & Registration":"#2563A8","Finance":"#0F766E","Legal":"#8A3FA0","Company Info":"#3A28C4","Safety & Compliance":"#B45309","Sustainability":"#4D7C0F","Insurance":"#9F1239"};
const DEPT_COLORS = {"Leadership":"#3A28C4","Sales & Account Management":"#2563A8","Customer Success":"#0F766E","Operations":"#B45309","Finance & Revenue Ops":"#4D7C0F","Compliance & Legal":"#9F1239","Other contributors":"#5C5C6E","Former staff":"#9A9AAA"};
const TOP_DOCS = [
  { id: "sample-7", label: "W-9 Form", hint: "US tax ID" },
  { id: "sample-22", label: "Certificate of Insurance", hint: "COI" },
  { id: "sample-14", label: "Void Cheque", hint: "Banking" },
  { id: "sample-6", label: "Certificate of Incorporation", hint: "Legal" },
  { id: "sample-8", label: "OSHA Log", hint: "Safety stats" },
  { id: "sample-17", label: "Safety Program", hint: "HSE" },
];
function openTopDoc(d) {
  const u = window.resolveDoc && window.resolveDoc(d.id);
  if (u) showDocOverlay(u, d.label);
}
function countDue(rows) {
  const ts = window.trStatus; if (!ts || !rows) return { expired: 0, soon: 0 };
  const c = { expired: 0, soon: 0 }; rows.forEach((r) => { const k = ts(r.date).k; if (c[k] !== undefined) c[k]++; }); return c;
}
function Hero({ query, setQuery, total, answered, needsReview, onSuggest, setTab }) {
  const exampleQueries = ["W-9", "certificate of insurance", "bank details", "ISO 9001", "void cheque Canada", "SOC 2"];
  const ins = countDue(window.INSURANCE_POLICIES), plat = countDue(window.COMPLIANCE_PLATFORMS);
  const scrollToEntries = () => { const el = document.querySelector(".layout"); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: "smooth" }); };
  const stats = [
    { n: answered, l: "answers on file", tone: "ok", go: scrollToEntries },
    { n: needsReview, l: "need review", tone: "warn", go: () => setTab("submissions") },
    { n: ins.expired + ins.soon, l: "insurance policies expiring", tone: ins.expired ? "bad" : "warn", go: () => setTab("insurance") },
    { n: plat.expired + plat.soon, l: "compliance renewals due", tone: plat.expired ? "bad" : "warn", go: () => setTab("compliance-platforms") },
  ];
  return (
    <section className="hero2">
      <div className="hero2-shell">
        <div className="hero2-top">
          <div className="hero2-eyebrow"><span className="pulse-dot"></span> {total} answers indexed</div>
          <h1 className="hero2-title">Has this vendor question <span className="hero-emph">been answered before?</span></h1>
          <p className="hero2-sub">Search past answers for vendor onboarding, compliance and RFP responses before you write a new one.</p>
          <div className="hero2-search"><SearchBar query={query} setQuery={setQuery} /></div>
          <div className="hero2-ex">
            <span className="hero2-ex-label">Common asks</span>
            {exampleQueries.map((q) => <button key={q} className="hero2-chip" onClick={() => onSuggest(q)}>{q}</button>)}
          </div>
        </div>
        <div className="hero2-stats">
          {stats.map((s) => (
            <button key={s.l} className={"hero2-stat tone-" + s.tone} onClick={s.go}>
              <b>{s.n}</b><span>{s.l}</span><i>View →</i>
            </button>
          ))}
        </div>
        <div className="hero2-docs-head"><h2>Most requested documents</h2><span>Open or download in one click</span></div>
        <div className="hero2-docs">
          {TOP_DOCS.map((d) => (
            <button key={d.id} className="hero2-doc" onClick={() => openTopDoc(d)}>
              <span className="hero2-doc-ic"><Icon.Doc /></span>
              <span className="hero2-doc-t"><b>{d.label}</b><em>{d.hint}</em></span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function SearchBar({ query, setQuery }) {
  const ref = useRef(null);
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <div className="search-wrap">
      <div className="search">
        <span className="search-icon"><Icon.Search /></span>
        <input
          ref={ref}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search questions, answers, or keywords…"
          aria-label="Search the wiki"
        />
        {query && (
          <button className="search-clear" onClick={() => setQuery("")} aria-label="Clear">
            <Icon.Close />
          </button>
        )}
        <span className="kbd">⌘K</span>
      </div>
    </div>
  );
}

// ---- Sidebar ----
function Sidebar({ data, activeCat, activeSub, setCat, setSub, mobileOpen, onCloseMobile, setTab }) {
  const tree = useMemo(() => {
    const t = {};
    for (const cat of CATEGORIES_ORDER) t[cat] = { total: 0, subs: {} };
    for (const d of data) {
      if (!t[d.category]) t[d.category] = { total: 0, subs: {} };
      t[d.category].total++;
      t[d.category].subs[d.subcategory] = (t[d.category].subs[d.subcategory] || 0) + 1;
    }
    return t;
  }, [data]);

  const [open, setOpen] = useState(() => {
    const o = {};
    for (const c of CATEGORIES_ORDER) o[c] = true;
    return o;
  });

  const toggle = (c) => setOpen((s) => ({ ...s, [c]: !s[c] }));

  return (
    <>
    <div className={"sidebar-scrim " + (mobileOpen ? "open" : "")} onClick={onCloseMobile} />
    <aside className={"sidebar " + (mobileOpen ? "sidebar-mobile-open" : "")}>
      <div className="side-head">
        <div className="side-head-row">
          <div className="side-label">BROWSE</div>
          <button className="side-close" onClick={onCloseMobile} aria-label="Close"><Icon.Close /></button>
        </div>
        <button
          className={"all-btn " + (!activeCat ? "active" : "")}
          onClick={() => { setCat(null); setSub(null); }}
        >
          <span>All entries</span>
          <span className="count">{data.length}</span>
        </button>
      </div>

      <nav className="side-nav">
        {CATEGORIES_ORDER.map((cat) => {
          const node = tree[cat];
          const isActive = activeCat === cat;
          const isOpen = open[cat];
          return (
            <div key={cat} className={"cat " + (isActive ? "active-cat" : "")}>
              <button
                className={"cat-row " + (isActive && !activeSub ? "active" : "")}
                onClick={() => {
                  if (!isOpen) toggle(cat);
                  setCat(cat); setSub(null);
                }}
              >
                <span
                  className={"caret " + (isOpen ? "open" : "")}
                  onClick={(e) => { e.stopPropagation(); toggle(cat); }}
                  role="button"
                >
                  <Icon.Chevron />
                </span>
                <span className="cat-dot" style={{ background: CAT_COLORS[cat] }}></span><span className="cat-name">{cat}</span>
                <span className="count">{node?.total || 0}</span>
              </button>
              {isOpen && (
                <div className="subs">
                  {Object.entries(node?.subs || {}).map(([sub, n]) => (
                    <button
                      key={sub}
                      className={"sub-row " + (activeCat === cat && activeSub === sub ? "active" : "")}
                      onClick={() => { setCat(cat); setSub(sub); }}
                    >
                      <span className="sub-name">{sub}</span>
                      <span className="count">{n}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="side-footer">
        <div className="card-mini">
          <div className="mini-title">Can't find it?</div>
          <div className="mini-body">Can't find the answer? Prepare an email with your question and context using the Submissions form.</div>
          <button type="button" className="mini-cta" onClick={() => { setTab("submissions"); onCloseMobile(); }}>Prepare email <Icon.Arrow /></button>
        </div>
      </div>
    </aside>
    </>
  );
}

// ---- Main content: controls + list ----
function StatusBadge({ status }) {
  if (status === "needs-review") {
    return (
      <span className="badge badge-warn">
        <Icon.Warn /> Needs review
      </span>
    );
  }
  return (
    <span className="badge badge-ok">
      <Icon.Check /> Answered
    </span>
  );
}

function Avatar({ name, size = 26, color }) {
  return (
    <span
      className="avatar"
      style={{
        background: color || avatarColor(name),
        width: size,
        height: size,
        fontSize: Math.round(size * 0.42),
      }}
      title={name}
    >
      {initials(name)}
    </span>
  );
}

function EntryCard({ entry, query, onOpen, showReplies, onNav }) {
  const answerPlain = plainText(entry.answer || "");
  const hasLink = /\[[^\]]+\]\s*\((?:https?|file|doc):\/\//.test(entry.answer || "")
    || /<(?:https?|file|doc):\/\//.test(entry.answer || "");
  const answerShort = answerPlain.slice(0, 260);
  const truncated = answerPlain.length > 260;
  return (
    <article className="entry-card" onClick={() => onOpen(entry)} tabIndex={0}
      onKeyDown={(e)=>{ if(e.key==='Enter') onOpen(entry); }}>
      <div className="entry-top">
        <div className="crumb">
          <button type="button" className="crumb-link crumb-cat" title={"Filter by " + entry.category} style={{ "--cat": CAT_COLORS[entry.category] || "var(--primary)" }}
            onClick={(e) => { e.stopPropagation(); onNav?.(entry.category, null); }}>{entry.category}</button>
          <span className="crumb-sep">›</span>
          <button type="button" className="crumb-link crumb-sub" title={"Filter by " + entry.subcategory}
            onClick={(e) => { e.stopPropagation(); onNav?.(entry.category, entry.subcategory); }}>{entry.subcategory}</button>
        </div>
        <StatusBadge status={entry.status} />
      </div>
      <h3 className="q">{highlight(entry.question, query)}</h3>
      <p className="a">
        {hasLink ? (
          <AnswerText text={entry.answer} query={query} stop={true} />
        ) : (
          <>
            {highlight(answerShort, query)}
            {truncated ? "… " : " "}
            {truncated && <span className="read-more">Read more</span>}
          </>
        )}
      </p>
      <div className="entry-foot">
        <div className="foot-left">
          {entry.appendix && APPENDICES[entry.appendix] ? (
            <span className="appendix-attr">
              <span className="appendix-chip"><Icon.Doc /> Appendix {entry.appendix}</span>
              <span className="dot">·</span>
              <span className="date">{entry.date || "Undated"}</span>
            </span>
          ) : (
            <>
              <Avatar name={entry.author} />
              <span className="author">{entry.author || "—"}</span>
              <span className="dot">·</span>
              <span className="date">{entry.date || "Undated"}</span>
              {showReplies && entry.replies > 0 && (
                <>
                  <span className="dot">·</span>
                  <span className="replies">{entry.replies} {entry.replies === 1 ? "reply" : "replies"}</span>
                </>
              )}
            </>
          )}
        </div>
        {entry.appendix && APPENDICES[entry.appendix] ? (
          <a
            className="slack-link appendix-link"
            href="#"
            onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); openAppendix(entry.appendix); }}
          >
            <Icon.Doc /> Open Appendix {entry.appendix} <Icon.Arrow />
          </a>
        ) : entry.source ? (
          <span className="source-tag">{entry.source}</span>
        ) : (
          <a
            className="slack-link"
            href="#"
            onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); openThread(entry); }}
          >
            <Icon.Slack /> View thread <Icon.Arrow />
          </a>
        )}
      </div>
    </article>
  );
}

function Main({ data, query, setQuery, activeCat, activeSub, setCat, setSub, tweaks, openEntry, setOpenEntry, onSave, editor, onOpenBrowse }) {
  const [status, setStatus] = useState("all"); // all | answered | needs-review
  const [sort, setSort] = useState("newest");
  const [recentOnly, setRecentOnly] = useState(false);

  const filtered = useMemo(() => {
    let list = data.slice();
    if (activeCat) list = list.filter((d) => d.category === activeCat);
    if (activeSub) list = list.filter((d) => d.subcategory === activeSub);
    if (status !== "all") list = list.filter((d) => d.status === status);
    if (recentOnly) {
      const cutoff = parseDate("Aug 01, 2025");
      list = list.filter((d) => parseDate(d.date) >= cutoff);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      const tokens = q.split(/\s+/).filter(Boolean);
      list = list.filter((d) => {
        const hay = (
          (d.question || "") + " " +
          (d.answer || "") + " " +
          (d.category || "") + " " +
          (d.subcategory || "") + " " +
          (d.author || "") + " " +
          (d.keywords || "")
        ).toLowerCase();
        // Match the full phrase OR every individual word (so "void cheque Canada"
        // still finds "void cheque for Canada"). Falls back to phrase match for
        // single-word queries.
        return hay.includes(q) || tokens.every((t) => tokenHits(hay, t));
      });
    }
    list.sort((a, b) => {
      if (sort === "newest") return parseDate(b.date) - parseDate(a.date);
      if (sort === "oldest") return parseDate(a.date) - parseDate(b.date);
      if (sort === "category") return (a.category + a.subcategory).localeCompare(b.category + b.subcategory);
      return 0;
    });
    return list;
  }, [data, activeCat, activeSub, status, recentOnly, query, sort]);

  const totalCounts = useMemo(() => {
    let base = data;
    if (activeCat) base = base.filter((d) => d.category === activeCat);
    if (activeSub) base = base.filter((d) => d.subcategory === activeSub);
    return {
      all: base.length,
      answered: base.filter((d) => d.status === "answered").length,
      review: base.filter((d) => d.status === "needs-review").length,
    };
  }, [data, activeCat, activeSub]);

  // Keyboard nav through cards
  const listRef = useRef(null);
  useEffect(() => {
    const onKey = (e) => {
      if (document.activeElement?.tagName === "INPUT") return;
      if (e.key === "j" || e.key === "k") {
        const cards = [...(listRef.current?.querySelectorAll(".entry-card") || [])];
        const idx = cards.indexOf(document.activeElement);
        let next = e.key === "j" ? idx + 1 : idx - 1;
        if (idx < 0) next = 0;
        next = Math.max(0, Math.min(cards.length - 1, next));
        cards[next]?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main className="main">
      <header className="main-head">
        <div className="main-head-left">
          <button type="button" className="browse-toggle" onClick={onOpenBrowse}>
            <Icon.Filter /> Browse categories
          </button>
          <div className="breadcrumb">
            <span className="crumb-home" onClick={() => { setCat(null); setSub(null); }}>Wiki</span>
            {activeCat && <> <span className="crumb-sep">›</span> <span className="crumb-mid" onClick={()=>setSub(null)}>{activeCat}</span></>}
            {activeSub && <> <span className="crumb-sep">›</span> <span className="crumb-cur">{activeSub}</span></>}
            {!activeCat && <> <span className="crumb-sep">›</span> <span className="crumb-cur">All entries</span></>}
          </div>
          <h2 className="main-title">
            {activeSub || activeCat || "All entries"}
          </h2>
          <div className="main-meta">
            {filtered.length} of {totalCounts.all} entries
            {query && <> matching "<b>{query}</b>"</>}
          </div>
        </div>
        <div className="main-head-right">
          <button className="ghost-btn">
            <Icon.Filter /> More filters
          </button>
          <button className="primary-btn">
            + New entry
          </button>
        </div>
      </header>

      <div className="controls">
        <div className="chips">
          {[
            { k: "all", label: "All", count: totalCounts.all },
            { k: "answered", label: "Answered", count: totalCounts.answered, dot: "ok" },
            { k: "needs-review", label: "Needs review", count: totalCounts.review, dot: "warn" },
          ].map((c) => (
            <button
              key={c.k}
              className={"chip " + (status === c.k ? "chip-active" : "")}
              onClick={() => setStatus(c.k)}
            >
              {c.dot && <span className={"chip-dot " + c.dot} />}
              {c.label}
              <span className="chip-count">{c.count}</span>
            </button>
          ))}
        </div>
        <div className="controls-right">
          <label className="toggle">
            <input type="checkbox" checked={recentOnly} onChange={(e) => setRecentOnly(e.target.checked)} />
            <span className="toggle-slider" />
            <span className="toggle-label">Recent (last 90 days)</span>
          </label>
          <div className="sort">
            <span className="sort-label">Sort</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="category">By category</option>
            </select>
          </div>
        </div>
      </div>

      <div className="entries" ref={listRef}>
        {filtered.length === 0 && <EmptyState query={query} onReset={() => { setQuery(""); setCat(null); setSub(null); setStatus("all"); setRecentOnly(false); }} />}
        {filtered.map((e) => (
          <EntryCard key={e.id} entry={e} query={query} onOpen={setOpenEntry} showReplies={tweaks.showReplyCount}
            onNav={(cat, sub) => { setCat(cat); setSub(sub); }} />
        ))}
      </div>

      {openEntry && <EntryModal entry={openEntry} onClose={() => setOpenEntry(null)} onSave={onSave} editor={editor}
        onNav={(cat, sub) => { setCat(cat); setSub(sub); setOpenEntry(null); }} />}
    </main>
  );
}

function EmptyState({ query, onReset }) {
  return (
    <div className="empty">
      <div className="empty-illus" aria-hidden>
        <svg viewBox="0 0 160 110" width="180" height="124">
          <defs>
            <linearGradient id="gf" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#EFECFF" />
              <stop offset="1" stopColor="#CDC7FE" />
            </linearGradient>
          </defs>
          <rect x="8" y="16" width="144" height="86" rx="10" fill="url(#gf)" />
          <rect x="20" y="30" width="80" height="8" rx="4" fill="white" />
          <rect x="20" y="46" width="110" height="6" rx="3" fill="white" opacity="0.8" />
          <rect x="20" y="58" width="90" height="6" rx="3" fill="white" opacity="0.8" />
          <circle cx="118" cy="76" r="14" fill="white" />
          <circle cx="118" cy="76" r="9" fill="none" stroke="#3A28C4" strokeWidth="2" />
          <path d="M124 82 L130 88" stroke="#3A28C4" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </div>
      <h3>No matches</h3>
      <p>
        {query
          ? <>No entries contain "<b>{query}</b>". Try broader terms, or browse categories in the sidebar.</>
          : <>No entries match these filters. Try clearing them.</>}
      </p>
      <button className="primary-btn" onClick={onReset}>Reset filters</button>
    </div>
  );
}

// Renders answer text with clickable links. Forgiving about format — supports
// bare URLs, [label](url) (with or without a space), and Slack-style <url|label>.
// Opens an embedded PDF in an in-app overlay (no new tab / no popup blocking).
function showDocOverlay(blobUrl, name) {
  const existing = document.getElementById("doc-overlay");
  if (existing) existing.remove();
  const ov = document.createElement("div");
  ov.id = "doc-overlay";
  ov.setAttribute("style", [
    "position:fixed", "inset:0", "z-index:9999",
    "background:rgba(20,18,30,0.72)", "backdrop-filter:blur(4px)",
    "display:flex", "flex-direction:column", "padding:24px",
  ].join(";"));
  const bar = document.createElement("div");
  bar.setAttribute("style", "display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 14px;background:#fff;border-radius:10px 10px 0 0;font:600 14px/1.2 system-ui,sans-serif;color:#1c1b22");
  const title = document.createElement("span");
  title.textContent = name || "Document";
  const actions = document.createElement("div");
  actions.setAttribute("style", "display:flex;align-items:center;gap:8px");
  const dl = document.createElement("a");
  dl.textContent = "Download";
  dl.href = blobUrl; dl.download = (name || "document") + ".html";
  dl.setAttribute("style", "text-decoration:none;color:#6d5ae6;font-weight:600;padding:6px 12px;border:1px solid #e3e0f0;border-radius:7px");
  const close = document.createElement("button");
  close.textContent = "✕ Close";
  close.setAttribute("style", "cursor:pointer;border:none;background:#6d5ae6;color:#fff;font-weight:600;padding:7px 14px;border-radius:7px");
  close.onclick = () => ov.remove();
  actions.appendChild(dl); actions.appendChild(close);
  bar.appendChild(title); bar.appendChild(actions);
  const frame = document.createElement("iframe");
  frame.src = blobUrl;
  frame.setAttribute("style", "flex:1;width:100%;border:none;border-radius:0 0 10px 10px;background:#fff");
  ov.appendChild(bar); ov.appendChild(frame);
  ov.addEventListener("click", (e) => { if (e.target === ov) ov.remove(); });
  document.addEventListener("keydown", function esc(e){ if(e.key==="Escape"){ ov.remove(); document.removeEventListener("keydown", esc);} });
  document.body.appendChild(ov);
}
const escHtml = (s) => String(s == null ? "" : s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
function buildSampleDoc(title, sub, body) {
  const html = '<!doctype html><html><head><meta charset="utf-8"><title>' + escHtml(title) + '</title><style>' +
    'body{margin:0;background:#eef0f3;font:15px/1.55 system-ui,-apple-system,Segoe UI,sans-serif;color:#1f2933;display:flex;justify-content:center;padding:40px 16px}' +
    '.pg{position:relative;background:#fff;width:100%;max-width:860px;padding:56px 64px;box-shadow:0 2px 14px rgba(0,0,0,.08);border-radius:4px;overflow:hidden;box-sizing:border-box}' +
    '.wm{position:fixed;top:45%;left:50%;transform:translate(-50%,-50%) rotate(-28deg);font-size:110px;font-weight:800;color:rgba(91,72,251,.07);letter-spacing:.08em;pointer-events:none;white-space:nowrap}' +
    '.hd{display:flex;align-items:center;gap:10px;border-bottom:2px solid #3A28C4;padding-bottom:16px;margin-bottom:32px}' +
    '.lg{width:30px;height:30px;border-radius:7px;background:#3A28C4;color:#fff;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center}' +
    'h1{font-size:24px;margin:0 0 6px}h2{font-size:17px;margin:32px 0 8px}.sub{color:#6b7280;font-size:13px;margin:0 0 28px}' +
    '.row{display:grid;grid-template-columns:210px 1fr;gap:12px;padding:9px 0;border-bottom:1px solid #eceef2;font-size:14px}.row b{color:#6b7280;font-weight:600}' +
    '.qa{padding:14px 0;border-bottom:1px solid #eceef2}.qa .q{font-weight:600;margin-bottom:4px}.qa .a{color:#374151;font-size:14px}.num{font-family:ui-monospace,Menlo,monospace;color:#6b7280;font-size:12px;margin-right:6px}' +
    '.note{margin-top:36px;padding:14px 16px;background:#f5f3ff;border-radius:8px;font-size:13px;color:#3A28C4}' +
    '</style></head><body><div class="pg"><div class="wm">SAMPLE</div><div class="hd"><div class="lg">AE</div><b>Acme Excel Holdings, Inc.</b></div>' +
    '<h1>' + escHtml(title) + '</h1><p class="sub">' + escHtml(sub) + '</p>' + body +
    '<div class="note">Sample document for demonstration purposes. In the live wiki this opens the actual source document.</div></div></body></html>';
  return URL.createObjectURL(new Blob([html], { type: "text/html" }));
}
const stripLinks = (s) => String(s || "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/<[^|>]+\|([^>]+)>/g, "$1");
function openAppendix(id) {
  const ap = APPENDICES[id];
  if (!ap) return;
  let body;
  if (id === "A") {
    const rows = (window.WIKI_DATA || []).filter((d) => d.appendix === "A");
    body = '<div class="row"><b>Prepared for</b><span>Marshmallow Manor Realty — Vendor Due Diligence</span></div><div class="row"><b>Respondent</b><span>Acme Excel Holdings, Inc.</span></div><div class="row"><b>Questions answered</b><span>' + rows.length + '</span></div><h2>Responses</h2>' +
      rows.map((d, i) => '<div class="qa"><div class="q"><span class="num">Q' + (i + 1) + '</span>' + escHtml(d.question) + '</div><div class="a">' + escHtml(stripLinks(d.answer)) + '</div></div>').join("");
  } else {
    body = '<div class="row"><b>Registered name</b><span>Acme Excel Europe GmbH</span></div><div class="row"><b>Register court</b><span>Amtsgericht Musterstadt</span></div><div class="row"><b>Register number</b><span>HRB 000000</span></div><div class="row"><b>Registered office</b><span>Musterstraße 1, 40000 Musterstadt, Germany</span></div><div class="row"><b>Legal form</b><span>Gesellschaft mit beschränkter Haftung (GmbH)</span></div><div class="row"><b>Managing directors</b><span>Lars Henning, Richard Vance</span></div><div class="row"><b>Date of entry</b><span>01 June 2026</span></div><div class="row"><b>Chamber membership</b><span>IHK Musterstadt · Member no. 0000000</span></div><h2>English translation</h2><p style="font-size:14px;color:#374151">The Chamber of Commerce and Industry hereby confirms that the above-named company is entered in the commercial register and is a member of the Chamber. This certificate is issued for the purpose of supplier and vendor registration.</p>';
  }
  showDocOverlay(buildSampleDoc("Appendix " + id + " — " + ap.title, ap.type + " · " + ap.date, body), "Appendix " + id + " — " + ap.title);
}
Object.assign(window, { showDocOverlay, buildSampleDoc, escHtml });
// ---- Demo thread viewer (stands in for the live Slack thread) ----
function threadHash(s) { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 100003; return h; }
function openThread(entry) {
  const esc = escHtml;
  const people = Object.keys(CONTACT_TITLES);
  const h = threadHash(entry.id + entry.question);
  const asker = entry.author || "Vendor Team";
  const others = people.filter((p) => p !== asker);
  const pick = (i) => others[(h + i * 7) % others.length];
  const answerer = pick(0), helper = pick(1);
  const fillers = [
    [helper, "Good question. I think we've had this one before, let me dig through the shared drive."],
    [answerer, "I've got this. Pulling the latest version now."],
    [asker, "Thanks! The client needs it by end of week if possible."],
    [helper, "Looping in " + answerer.split(" ")[0] + " since they handled the last request like this."],
    [answerer, "Confirmed with Finance. Writing it up so it's in the wiki for next time."],
    [asker, "Perfect, that's exactly what I needed. Marking this as resolved."],
  ];
  const n = Math.max(1, Math.min(entry.replies || 2, 6));
  const shown = fillers.slice(0, Math.max(0, n - 1));
  const answerText = stripLinks(entry.answer && entry.answer !== "0" ? entry.answer : "Still looking into this one, will update the thread once confirmed.");
  const date = entry.date || "Dec 2025";
  const times = ["9:14 AM", "9:22 AM", "9:41 AM", "10:03 AM", "10:30 AM", "11:12 AM", "1:47 PM"];
  const colors = ["#3A28C4", "#2563A8", "#0F766E", "#B45309", "#8A3FA0", "#9F1239"];
  const msg = (who, text, i, isAnswer) => {
    const ini = who.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
    return '<div class="m' + (isAnswer ? ' ans' : '') + '"><div class="av" style="background:' + colors[threadHash(who) % colors.length] + '">' + esc(ini) + '</div><div class="mb"><div class="mh"><b>' + esc(who) + '</b><span>' + times[i % times.length] + '</span>' + (isAnswer ? '<em>Answer</em>' : '') + '</div><div class="mt">' + esc(text) + '</div></div></div>';
  };
  const hidden = (entry.replies || 0) - shown.length - 1;
  const html = '<!doctype html><html><head><meta charset="utf-8"><title>Thread</title><style>' +
    'body{margin:0;background:#F4F4FB;font:15px/1.5 system-ui,-apple-system,Segoe UI,sans-serif;color:#15151F;display:flex;justify-content:center;padding:28px 16px}' +
    '.w{background:#fff;width:100%;max-width:760px;border:1px solid #DAD9E6;border-radius:12px;overflow:hidden}' +
    '.top{display:flex;align-items:center;gap:10px;padding:14px 20px;border-bottom:1px solid #DAD9E6}.top b{font-size:15px}.top span{font-size:13px;color:#5C5C6E}' +
    '.ch{font-family:ui-monospace,Menlo,monospace;font-size:12px;background:#EFECFF;color:#3A28C4;padding:2px 8px;border-radius:5px;font-weight:600}' +
    '.day{display:flex;align-items:center;gap:10px;margin:14px 20px 4px;font-size:12px;font-weight:600;color:#5C5C6E}.day:before,.day:after{content:"";flex:1;height:1px;background:#E7E6F0}' +
    '.m{display:flex;gap:12px;padding:10px 20px}.m:hover{background:#FAFAFD}.av{width:36px;height:36px;border-radius:8px;flex:none;color:#fff;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center}' +
    '.mh{display:flex;align-items:baseline;gap:8px}.mh b{font-size:14.5px}.mh span{font-size:12px;color:#5C5C6E}.mh em{font-style:normal;font-size:11px;font-weight:700;color:#1F7A42;background:#EAF6EE;border:1px solid #BFE6CB;border-radius:4px;padding:0 6px}' +
    '.mt{font-size:14.5px;color:#1E1E2A;white-space:pre-wrap;margin-top:2px}' +
    '.ans{background:#F6FBF8;border-left:3px solid #1F7A42;padding-left:17px}' +
    '.rc{margin:2px 20px 6px 68px;font-size:12.5px;font-weight:600;color:#3A28C4}' +
    '.more{margin:6px 20px;font-size:12.5px;color:#5C5C6E;text-align:center}' +
    '.note{margin:14px 20px 18px;padding:12px 14px;background:#F5F3FF;border-radius:8px;font-size:12.5px;color:#3A28C4}' +
    '</style></head><body><div class="w"><div class="top"><span class="ch">#vendor-questions</span><b>Thread</b><span>' + esc(entry.category || "") + (entry.subcategory ? " › " + esc(entry.subcategory) : "") + '</span></div>' +
    '<div class="day">' + esc(date) + '</div>' +
    msg(asker, entry.question, 0) +
    '<div class="rc">' + (entry.replies || shown.length + 1) + ' replies</div>' +
    shown.map((f, i) => msg(f[0], f[1], i + 1)).join("") +
    (hidden > 0 ? '<div class="more">' + hidden + ' more replies</div>' : '') +
    msg(answerer, answerText, shown.length + 1, true) +
    '<div class="note">Demo thread. In the live wiki this opens the original Slack conversation.</div></div></body></html>';
  showDocOverlay(URL.createObjectURL(new Blob([html], { type: "text/html" })), "#vendor-questions · Thread");
}


// Strip markdown/link syntax down to readable text for card previews:
//  [label](url) -> label   ·   <url|label> -> label   ·   <url> -> url
function plainText(str) {
  return String(str || "")
    .replace(/\[([^\]]+)\]\s*\((?:https?|file|doc):\/\/[^\s)]+\)/g, "$1")
    .replace(/<(?:https?|file|doc):\/\/[^\s|>]+\|([^>]+)>/g, "$1")
    .replace(/<((?:https?|file|doc):\/\/[^\s|>]+)>/g, "$1");
}

function AnswerText({ text, query, stop }) {
  const str = String(text || "");
  if (!str) return "—";
  // Apply search highlighting to plain-text segments between links.
  const pushText = (seg) => {
    if (!seg) return;
    if (query) nodes.push(<React.Fragment key={key++}>{highlight(seg, query)}</React.Fragment>);
    else nodes.push(seg);
  };
  const re = /\[([^\]]+)\]\s*\(((?:https?|file|doc):\/\/[^\s)]+)\)|<((?:https?|file|doc):\/\/[^\s|>]+)(?:\|([^>]+))?>|((?:https?|file):\/\/[^\s<]+)/g;
  const nodes = [];
  let last = 0, m, key = 0;
  while ((m = re.exec(str)) !== null) {
    if (m.index > last) pushText(str.slice(last, m.index));
    let label, url, trailing = "";
    if (m[2]) { label = m[1]; url = m[2]; }
    else if (m[3]) { url = m[3]; label = m[4] || m[3]; }
    else {
      url = m[5]; label = m[5];
      const t = url.match(/[).,;:!?]+$/);
      if (t) { trailing = t[0]; url = url.slice(0, -trailing.length); label = url; }
    }
    // Resolve doc:// links to the embedded PDF (opened as an in-memory blob).
    if (url.indexOf("doc://") === 0) {
      const id = url.slice(6);
      const names = {
        "bahamas-nib": "Bahamas NIB Registration.pdf",
        "wsib-clearance": "WSIB Clearance Certificate.pdf",
        "company-emr-signed": "Acme Excel EMR Letter (signed).pdf",
        "emr-marsh-mclennan": "EMR Letter - Hartwell Brokers.pdf",
        "compline-emr-history": "Riskline Riskscreen - EMR History.pdf",
        "employer-stamp-exception": "Employer Stamp Exception Letter.pdf",
      };
      const resolved = (typeof window !== "undefined" && window.resolveDoc) ? window.resolveDoc(id) : null;
      nodes.push(
        <a
          key={key++}
          className="answer-link"
          href={resolved || "#"}
          download={(names[id] || (window.SAMPLE_DOC_TITLES||{})[id] || id) + ".html"}
          onClick={(e) => {
            e.preventDefault();
            if (stop) e.stopPropagation();
            const u = window.resolveDoc && window.resolveDoc(id);
            if (!u) { alert("Document not available."); return; }
            showDocOverlay(u, names[id] || (window.SAMPLE_DOC_TITLES||{})[id] || "Sample Document");
          }}
        >
          {query ? highlight(label, query) : label}
        </a>
      );
      if (trailing) nodes.push(trailing);
      last = re.lastIndex;
      continue;
    }
    nodes.push(
      <a
        key={key++}
        className="answer-link"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={stop ? (e) => e.stopPropagation() : undefined}
      >
        {query ? highlight(label, query) : label}
      </a>
    );
    if (trailing) nodes.push(trailing);
    last = re.lastIndex;
  }
  if (last < str.length) pushText(str.slice(last));
  return nodes.length ? nodes : str;
}

// ---- Answer composer: one clean place to write/edit answers ----
function AnswerComposer({ entry, initial, onSave, onCancel }) {
  const [text, setText] = useState(initial || "");
  const [tab, setTabC] = useState("write");
  const [panel, setPanel] = useState(null); // "link" | "doc" | null
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [keywords, setKeywords] = useState(entry.keywords || "");
  const [answered, setAnswered] = useState(true);
  const ta = useRef(null);
  useEffect(() => { ta.current && ta.current.focus(); }, []);
  const similar = useMemo(() => {
    const qt = sbTokens(entry.question);
    return (window.WIKI_DATA || []).filter((d) => d.id !== entry.id && d.status === "answered" && d.answer && d.answer !== "0").map((d) => {
      const bag = new Set(sbTokens(d.question + " " + (d.keywords || "")));
      return { d, s: qt.filter((w) => bag.has(w)).length };
    }).filter((x) => x.s >= 2).sort((x, y) => y.s - x.s).slice(0, 3).map((x) => x.d);
  }, [entry.id]);
  const insert = (snippet) => {
    const el = ta.current; const s = el ? el.selectionStart : text.length, e = el ? el.selectionEnd : text.length;
    const next = text.slice(0, s) + snippet + text.slice(e);
    setText(next); setTabC("write");
    setTimeout(() => { if (el) { el.focus(); el.selectionStart = el.selectionEnd = s + snippet.length; } }, 0);
  };
  const openLink = () => {
    const el = ta.current; const sel = el ? text.slice(el.selectionStart, el.selectionEnd) : "";
    setLinkLabel(sel); setLinkUrl(""); setPanel(panel === "link" ? null : "link");
  };
  const addLink = () => { if (!linkUrl.trim()) return; insert("[" + (linkLabel.trim() || linkUrl.trim()) + "](" + linkUrl.trim() + ")"); setPanel(null); };
  const docs = Object.entries(window.SAMPLE_DOC_TITLES || {});
  const save = () => { if (!text.trim()) return; onSave({ answer: text.trim(), keywords: keywords.trim(), ...(answered ? { status: "answered" } : {}) }); };
  const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); save(); } };
  return (
    <div className="ac" onKeyDown={onKey}>
      <div className="ac-bar">
        <div className="ac-tabs">
          <button type="button" className={tab === "write" ? "on" : ""} onClick={() => setTabC("write")}>Write</button>
          <button type="button" className={tab === "preview" ? "on" : ""} onClick={() => setTabC("preview")}>Preview</button>
        </div>
        <div className="ac-tools">
          <button type="button" className={panel === "link" ? "on" : ""} onClick={openLink}>Add link</button>
          <button type="button" className={panel === "doc" ? "on" : ""} onClick={() => setPanel(panel === "doc" ? null : "doc")}><Icon.Doc /> Attach document</button>
        </div>
      </div>
      {panel === "link" && (
        <div className="ac-pop">
          <input className="sb-input" placeholder="Link text, e.g. W-9 Form" value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} />
          <input className="sb-input" placeholder="https://…" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLink(); } }} />
          <button type="button" className="primary-btn sm" onClick={addLink} disabled={!linkUrl.trim()}>Insert</button>
        </div>
      )}
      {panel === "doc" && (
        <div className="ac-docs">
          {docs.map(([id, t]) => (
            <button type="button" key={id} onClick={() => { insert("[" + t.replace(" (Sample)", "") + "](doc://" + id + ")"); setPanel(null); }}>
              <Icon.Doc /> {t.replace(" (Sample)", "")}
            </button>
          ))}
        </div>
      )}
      {tab === "write" ? (
        <textarea ref={ta} className="ac-text" rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a clear, reusable answer. Use Add link or Attach document instead of typing link code." />
      ) : (
        <div className="ac-preview">{text.trim() ? <p><AnswerText text={text} /></p> : <span className="ac-empty">Nothing to preview yet.</span>}</div>
      )}
      {similar.length > 0 && (
        <div className="ac-similar">
          <div className="ac-label">Reuse a similar answer</div>
          {similar.map((d) => (
            <div key={d.id} className="ac-sim">
              <div className="ac-sim-t"><b>{d.question}</b><span>{plainText(d.answer).slice(0, 120)}{plainText(d.answer).length > 120 ? "…" : ""}</span></div>
              <button type="button" className="ghost-btn" onClick={() => insert((text.trim() ? "\n" : "") + d.answer)}>Insert</button>
            </div>
          ))}
        </div>
      )}
      <div className="ac-meta">
        <label className="ac-label" htmlFor={"ac-kw-" + entry.id}>Search keywords <span className="optional">(helps people find it)</span></label>
        <input id={"ac-kw-" + entry.id} className="sb-input" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="e.g. W-9, tax form, TIN" />
      </div>
      <div className="ac-foot">
        <label className="ac-check"><input type="checkbox" checked={answered} onChange={(e) => setAnswered(e.target.checked)} /> Mark as answered</label>
        <span className="ac-hint">⌘ + Enter to save</span>
        <button type="button" className="ghost-btn" onClick={onCancel}>Cancel</button>
        <button type="button" className="primary-btn sm" disabled={!text.trim()} onClick={save}>Save answer</button>
      </div>
    </div>
  );
}

function EntryModal({ entry, onClose, onSave, editor, onNav }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.answer || "");
  const [answer, setAnswer] = useState(entry.answer || "");
  const [copied, setCopied] = useState(false);
  const taRef = useRef(null);

  // Reset local state when a different entry is opened
  useEffect(() => {
    setAnswer(entry.answer || "");
    setDraft(entry.answer || "");
    setEditing(false);
    setCopied(false);
  }, [entry.id]);

  useEffect(() => {
    const k = (e) => e.key === "Escape" && (editing ? setEditing(false) : onClose());
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose, editing]);

  useEffect(() => {
    if (editing && taRef.current) { taRef.current.focus(); }
  }, [editing]);

  // If editor mode is locked while a draft is open, drop out of edit mode.
  useEffect(() => {
    if (!editor) setEditing(false);
  }, [editor]);

  const copyAnswer = async () => {
    const text = answer || "";
    let ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        ok = true;
      }
    } catch (_) { /* fall through to legacy path */ }
    if (!ok) {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch (_) { ok = false; }
    }
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  const saveDraft = () => {
    const v = draft.trim();
    setAnswer(v);
    onSave?.(entry.id, { answer: v });
    setEditing(false);
  };

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="crumb">
            <button type="button" className={"crumb-link" + (onNav ? "" : " crumb-static")} title={onNav ? "Filter by " + entry.category : undefined}
              onClick={() => onNav?.(entry.category, null)}>{entry.category}</button>
            <span className="crumb-sep">›</span>
            <button type="button" className={"crumb-link crumb-sub" + (onNav ? "" : " crumb-static")} title={onNav ? "Filter by " + entry.subcategory : undefined}
              onClick={() => onNav?.(entry.category, entry.subcategory)}>{entry.subcategory}</button>
          </div>
          <div className="modal-head-right">
            <StatusBadge status={entry.status} />
            <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon.Close /></button>
          </div>
        </div>
        <h2 className="modal-q">{entry.question}</h2>
        {entry.appendix && APPENDICES[entry.appendix] ? (
          <div className="modal-byline">
            <div className="appendix-avatar"><Icon.Doc /></div>
            <div>
              <div className="modal-author">Appendix {entry.appendix} — {APPENDICES[entry.appendix].title}</div>
              <div className="modal-date">Sourced from document · {entry.date}</div>
            </div>
          </div>
        ) : (
          <div className="modal-byline">
            <Avatar name={entry.author} size={30} />
            <div>
              <div className="modal-author">{entry.author || "—"}</div>
              <div className="modal-date">Asked {entry.date}</div>
            </div>
            {entry.replies > 0 && (
              <div className="replies-pill">{entry.replies} {entry.replies === 1 ? "reply" : "replies"} in thread</div>
            )}
          </div>
        )}
        <div className="modal-section-label">Answer</div>
        {editing ? (
          <AnswerComposer entry={entry} initial={draft && !/^(0|Needs Further Review)$/i.test(draft) ? draft : ""}
            onCancel={() => setEditing(false)}
            onSave={(patch) => { setAnswer(patch.answer); onSave?.(entry.id, patch); setEditing(false); }} />
        ) : (
          <div className={"modal-answer " + (entry.status === "needs-review" ? "answer-review" : "")}>
            {entry.status === "needs-review" && (
              <div className="review-head">
                <Icon.Warn /> This item is still open — needs follow-up in Slack.
              </div>
            )}
            <p><AnswerText text={answer} /></p>
          </div>
        )}
        <div className="modal-actions">
          {editing ? null : (
            <>
              {entry.appendix && APPENDICES[entry.appendix] ? (
                <a
                  className="primary-btn"
                  href="#"
                  onClick={(e)=>{ e.preventDefault(); openAppendix(entry.appendix); }}
                  style={{ textDecoration: "none" }}
                >
                  <Icon.Doc /> Open Appendix {entry.appendix}
                </a>
              ) : (
                <a
                  className="primary-btn"
                  href="#"
                  style={{ textDecoration: "none", display: entry.source ? "none" : "" }}
                  onClick={(e)=>{ e.preventDefault(); openThread(entry); }}
                >
                  <Icon.Slack /> Open thread
                </a>
              )}
              {!entry.slack && !entry.appendix && entry.source && (
                <span className="modal-source-tag">{entry.source}</span>
              )}
              <button className="ghost-btn" onClick={copyAnswer}>{copied ? "Copied ✓" : "Copy answer"}</button>
              {editor && (
                <button className="ghost-btn" onClick={() => { setDraft(answer); setEditing(true); }}>{entry.status === "needs-review" ? "Add answer" : "Edit answer"}</button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Tweaks panel ----
function TweaksPanel({ tweaks, setTweaks, visible, onClose }) {
  if (!visible) return null;
  const persist = (patch) => {
    window.parent.postMessage({ type: "__edit_mode_set_keys", edits: patch }, "*");
  };
  const update = (patch) => {
    setTweaks((t) => ({ ...t, ...patch }));
    persist(patch);
  };
  return (
    <div className="tweaks">
      <div className="tweaks-head">
        <b>Tweaks</b>
        <button className="icon-btn" onClick={onClose}><Icon.Close /></button>
      </div>
      <label className="tweak-row">
        <span>Primary color</span>
        <input type="color" value={tweaks.primaryColor} onChange={(e) => update({ primaryColor: e.target.value })} />
      </label>
      <label className="tweak-row">
        <span>Accent tint</span>
        <input type="color" value={tweaks.accentTint} onChange={(e) => update({ accentTint: e.target.value })} />
      </label>
      <div className="tweak-row">
        <span>Hero style</span>
        <div className="seg">
          {["gradient", "flat", "grid"].map((s) => (
            <button key={s} className={tweaks.heroStyle === s ? "seg-on" : ""} onClick={() => update({ heroStyle: s })}>{s}</button>
          ))}
        </div>
      </div>
      <div className="tweak-row">
        <span>Card density</span>
        <div className="seg">
          {["compact", "comfortable", "spacious"].map((s) => (
            <button key={s} className={tweaks.cardDensity === s ? "seg-on" : ""} onClick={() => update({ cardDensity: s })}>{s}</button>
          ))}
        </div>
      </div>
      <label className="tweak-row">
        <span>Show reply count</span>
        <input type="checkbox" checked={tweaks.showReplyCount} onChange={(e) => update({ showReplyCount: e.target.checked })} />
      </label>
    </div>
  );
}

// ---- Submissions view ----
const SB_STOP = new Set("the and for with that this what does have from your our are any can who where when which how do we is it of to in on a an be or as by at if there their they them you us need needed please".split(" "));
const sbTokens = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !SB_STOP.has(w));
const SB_MON = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 };
function sbDate(s) {
  const m = /^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/.exec(String(s || "").trim());
  if (m) return new Date(2000 + +m[3], SB_MON[m[2].toLowerCase()], +m[1]).getTime();
  return parseDate(s);
}
const SB_STAGES = ["New", "In progress", "Waiting on client"];
function SubmissionsView({ data, setOpenEntry, setTab, editor, onSave }) {
  const [form, setForm] = useState({ question: "", category: CATEGORIES_ORDER[0], subcategory: "", context: "", client: "", needed: "" });
  const [catTouched, setCatTouched] = useState(false);
  const [qFilter, setQFilter] = useState("");
  const [catFilter, setCatFilter] = useState(null);
  const [stageOverride, setStageOverride] = useState({});
  const [answering, setAnswering] = useState(null);
  const [draft, setDraft] = useState("");
  const people = Object.keys(CONTACT_TITLES);
  const asOf = useMemo(() => Math.max(...data.map((d) => sbDate(d.date)).filter(Boolean)), [data]);
  const ageOf = (d) => { const t = sbDate(d.date); return t ? Math.max(0, Math.round((asOf - t) / 864e5)) : null; };
  const metaOf = (d) => {
    const h = threadHash(d.id + d.question);
    const others = people.filter((p) => p !== d.author);
    return { owner: others[h % others.length], stage: stageOverride[d.id] || SB_STAGES[h % 3] };
  };
  const reviewItems = useMemo(
    () => data.filter((d) => d.status === "needs-review").sort((a, b) => (sbDate(a.date) || 0) - (sbDate(b.date) || 0)),
    [data]
  );
  const shown = reviewItems.filter((d) => (!catFilter || d.category === catFilter) &&
    (!qFilter || (d.question + " " + (d.author || "")).toLowerCase().includes(qFilter.toLowerCase())));
  const old30 = reviewItems.filter((d) => (ageOf(d) || 0) > 30).length;
  const answeredWeek = data.filter((d) => d.status === "answered" && sbDate(d.date) && asOf - sbDate(d.date) <= 7 * 864e5).length;
  const catCounts = useMemo(() => { const c = {}; reviewItems.forEach((d) => c[d.category] = (c[d.category] || 0) + 1); return c; }, [reviewItems]);

  const matches = useMemo(() => {
    const qt = sbTokens(form.question);
    if (qt.length < 2) return [];
    return data.filter((d) => d.status === "answered").map((d) => {
      const bag = new Set(sbTokens(d.question + " " + (d.keywords || "")));
      return { d, score: qt.filter((w) => bag.has(w)).length };
    }).filter((x) => x.score >= 2).sort((a, b) => b.score - a.score).slice(0, 3).map((x) => x.d);
  }, [form.question, data]);
  useEffect(() => {
    if (!catTouched && matches[0]) setForm((f) => (f.category === matches[0].category ? f : { ...f, category: matches[0].category, subcategory: "" }));
  }, [matches, catTouched]);
  const subOptions = useMemo(() => {
    const set = new Set();
    for (const d of data) if (d.category === form.category) set.add(d.subcategory);
    return [...set];
  }, [data, form.category]);

  const submit = (e) => {
    e.preventDefault();
    if (!form.question.trim()) return;
    const subject = "Vendor question: " + form.question.trim().slice(0, 100);
    const body = [
      "Question:", form.question.trim(), "",
      "Category: " + form.category,
      ...(form.subcategory ? ["Subcategory: " + form.subcategory] : []),
      ...(form.client.trim() ? ["Client: " + form.client.trim()] : []),
      ...(form.needed ? ["Needed by: " + form.needed] : []),
      ...(form.context.trim() ? ["", "Additional context:", form.context.trim()] : []),
    ].join("\n");
    // This static portfolio demo cannot send mail on behalf of a visitor.
    // Open a draft instead. The sender chooses the appropriate recipient and sends it.
    window.location.href = "mailto:?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);
  };
  const markAnswered = (d, text) => { onSave && onSave(d.id, { status: "answered", ...(text ? { answer: text } : {}) }); setAnswering(null); setDraft(""); };
  const ageCls = (n) => n == null ? "" : n > 90 ? "sb-age-bad" : n > 30 ? "sb-age-warn" : "sb-age-ok";
  const sel = { width: "100%", minWidth: 0, maxWidth: "100%", boxSizing: "border-box", textOverflow: "ellipsis" };

  return (
    <div className="page page-submissions">
      <div className="page-head">
        <div className="page-eyebrow">SUBMISSIONS</div>
        <h1 className="page-title">Ask a new vendor question</h1>
        <p className="page-sub">Check the wiki for an existing answer first. If you still need help, complete the form to prepare an email with the question and supporting details. Choose the appropriate recipient and send it from your email app.</p>
      </div>
      <div className="sb-summary">
        <div><b>{reviewItems.length}</b><span>open questions</span></div>
        <div className={old30 ? "sb-warn" : ""}><b>{old30}</b><span>open more than 30 days</span></div>
        <div className="sb-ok"><b>{answeredWeek}</b><span>answered this week</span></div>
      </div>
      <div className="sb-grid">
        <form className="submit-card sb-form" onSubmit={submit}>
          <div className="field">
            <label>Your question</label>
            <textarea rows={3} value={form.question}
              onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
              placeholder="e.g. Do we have a current SOC 2 Type II report we can share with prospects?" />
          </div>
          {matches.length > 0 && (
            <div className="sb-matches">
              <div className="sb-matches-h"><Icon.Check /> Possibly already answered</div>
              {matches.map((d) => (
                <button type="button" key={d.id} className="sb-match" onClick={() => setOpenEntry(d)}>
                  <span className="sb-match-q">{d.question}</span>
                  <span className="sb-match-a">{(plainText(d.answer) || "").slice(0, 110)}{plainText(d.answer).length > 110 ? "…" : ""}</span>
                </button>
              ))}
              <div className="sb-matches-f">None of these? Continue preparing your email.</div>
            </div>
          )}
          <div className="sb-row">
            <div className="field" style={{ minWidth: 0 }}>
              <label>Category {!catTouched && matches[0] && <span className="optional">(suggested)</span>}</label>
              <select style={sel} value={form.category} onChange={(e) => { setCatTouched(true); setForm((f) => ({ ...f, category: e.target.value, subcategory: "" })); }}>
                {CATEGORIES_ORDER.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="field" style={{ minWidth: 0 }}>
              <label>Subcategory <span className="optional">(optional)</span></label>
              <select style={sel} value={form.subcategory} onChange={(e) => setForm((f) => ({ ...f, subcategory: e.target.value }))}>
                <option value="">—</option>
                {subOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="sb-row">
            <div className="field" style={{ minWidth: 0 }}>
              <label>Client <span className="optional">(optional)</span></label>
              <input className="sb-input" value={form.client} onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))} placeholder="e.g. Jellybean Junction" />
            </div>
            <div className="field" style={{ minWidth: 0 }}>
              <label>Needed by <span className="optional">(optional)</span></label>
              <input className="sb-input" type="date" value={form.needed} onChange={(e) => setForm((f) => ({ ...f, needed: e.target.value }))} />
            </div>
          </div>
          <div className="field">
            <label>Context <span className="optional">(optional)</span></label>
            <textarea rows={3} value={form.context}
              onChange={(e) => setForm((f) => ({ ...f, context: e.target.value }))}
              placeholder="Link the vendor portal, paste the exact text you're being asked for…" />
          </div>
          <div className="submit-foot">
            <div className="submit-hint">Opens an email draft. <b>Nothing is sent automatically.</b></div>
            <button type="submit" className="primary-btn" disabled={!form.question.trim()}>
              Prepare email <Icon.Arrow />
            </button>
          </div>
        </form>

        <section className="sb-queue">
          <div className="sb-queue-head">
            <h3>Open questions <span className="queue-count">{shown.length}</span></h3>
            <input className="sb-input sb-search" value={qFilter} onChange={(e) => setQFilter(e.target.value)} placeholder="Filter open questions…" />
          </div>
          <div className="sb-cats">
            <button className={"sb-cat" + (!catFilter ? " on" : "")} onClick={() => setCatFilter(null)}>All <span>{reviewItems.length}</span></button>
            {CATEGORIES_ORDER.filter((c) => catCounts[c]).map((c) => (
              <button key={c} className={"sb-cat" + (catFilter === c ? " on" : "")} onClick={() => setCatFilter(catFilter === c ? null : c)}>
                <i style={{ background: CAT_COLORS[c] }}></i>{CATEGORY_SHORT[c] || c} <span>{catCounts[c]}</span>
              </button>
            ))}
          </div>
          <div className="sb-list">
            {shown.map((d) => {
              const m = metaOf(d), age = ageOf(d);
              return (
                <article key={d.id} className="sb-item">
                  <div className="sb-item-top">
                    <span className={"sb-age " + ageCls(age)}>{age == null ? "No date" : age === 0 ? "Today" : age + " days open"}</span>
                    {editor ? (
                      <select className={"sb-stage sb-stage-" + SB_STAGES.indexOf(m.stage)} value={m.stage} onChange={(e) => setStageOverride((s) => ({ ...s, [d.id]: e.target.value }))}>
                        {SB_STAGES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    ) : <span className={"sb-stage sb-stage-" + SB_STAGES.indexOf(m.stage)}>{m.stage}</span>}
                    <span className="sb-item-cat"><i style={{ background: CAT_COLORS[d.category] }}></i>{CATEGORY_SHORT[d.category] || d.category}</span>
                  </div>
                  <button className="sb-item-q" onClick={() => setOpenEntry(d)}>{d.question}</button>
                  <div className="sb-item-meta">
                    <Avatar name={d.author} size={20} /><span>Asked by <b>{d.author || "—"}</b></span>
                    <span className="dot">·</span><span>Waiting on <b>{m.owner}</b></span>
                  </div>
                  {answering === d.id ? (
                    <AnswerComposer entry={d} initial={draft} onCancel={() => { setAnswering(null); setDraft(""); }}
                      onSave={(patch) => { onSave && onSave(d.id, patch); setAnswering(null); setDraft(""); }} />
                  ) : (
                    <div className="sb-actions">
                      <button className="ghost-btn" onClick={() => openThread(d)}><Icon.Slack /> View thread</button>
                      {editor && <button className="ghost-btn" onClick={() => { setAnswering(d.id); setDraft(d.answer && !/^(0|Needs Further Review)$/i.test(d.answer) ? d.answer : ""); }}>Add answer</button>}
                      {editor && <button className="ghost-btn sb-done" onClick={() => markAnswered(d)}><Icon.Check /> Mark answered</button>}
                    </div>
                  )}
                </article>
              );
            })}
            {shown.length === 0 && <div className="queue-empty">{reviewItems.length ? "No open questions match that filter." : "Inbox zero. Nothing currently open."}</div>}
          </div>
          {!editor && <p className="sb-editor-hint">Editors can update stages and answer questions here.</p>}
        </section>
      </div>
    </div>
  );
}

// ---- Contacts view ----
const INACTIVE_AUTHORS = new Set([
  "Ethan Ward",
  "Glen Turner",
  "Renee Dubois",
  "Rob Ellis",
  "Neil Grant",
  "Jordan Hale",
  "Laura Pierce",
  "Owen Price",
  "Nils Berg",
]);
// Explicit position titles for the contacts directory (overrides the inferred category).
const CONTACT_TITLES = {
  "Priya Nair": "Client Operations Manager, Solar",
  "Victor Hayes": "Account Manager, Solar",
  "Sam Doyle": "Account Manager, Solar",
  "Kyle Dawson": "Sales, Solar",
  "Diane Foster": "Global Payroll & Benefits Manager",
  "Gail Porter": "Revenue Operations",
  "Dana Fields": "Sr. Manager of Geospatial Operations",
  "Elena Ruiz": "Account Manager Retail and Solar, EU",
  "Marcus Reid": "VP, Global Enterprise Solutions",
  "Callum Fraser": "Senior Manager, Solar Flight Operations Global",
  "Hannah Brooks": "Customer Success Manager, Retail",
  "Anika Vos": "Operational Coordinator, Europe (Berlin)",
  "Mina Cho": "VP, Utility Sales",
  "Rafael Costa": "Account Coordinator, LatAm",
  "Morgan Pike": "Retail Operations Director",
  "Tessa Morgan": "Customer Success Coordinator",
  "Leo Marino": "Director of Account Management",
  "Karim Benali": "Ops Europe, Spain (Barcelona)",
  "Alan Webb": "VP, Customer Solutions & Revenue Operations",
  "Lucía Romero": "EMEA Ops Lead",
};
// Authors that are documents/sheets or merged/ambiguous handles, not single people — excluded from the Contacts directory.
const NON_PERSON_AUTHORS = new Set([
  "Marshmallow Manor Realty RFP 2025",
  "AE Corporate Info",
  "EMEA Vendor Qualification",
  "EMEA Vendor Qualification Sheet",
  "Joanna Kemp / Rob Ellis",
  "Hartwell Brokers (Joanna Kemp)",
]);


// ---- Contact departments + direct reach-out ----
const EMAIL_DOMAIN = "acmeexcel.com"; // emails default to first.last@EMAIL_DOMAIN
const CONTACT_EMAILS = {}; // overrides, e.g. { "Name Here": "name@company.com" }
const CONTACT_PHONES = {}; // optional, e.g. { "Name Here": "+1 555 010 0100" }
const DEPT_ORDER = ["Leadership", "Sales & Account Management", "Customer Success", "Operations", "Finance & Revenue Ops", "Compliance & Legal", "Other contributors", "Former staff"];
function contactEmail(name) {
  if (CONTACT_EMAILS[name]) return CONTACT_EMAILS[name];
  const p = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z\s-]/g, "").trim().split(/\s+/);
  return p.length > 1 ? p[0] + "." + p[p.length - 1] + "@" + EMAIL_DOMAIN : p[0] + "@" + EMAIL_DOMAIN;
}
function contactDept(c) {
  if (c.inactive) return "Former staff";
  const t = c.title || "";
  if (/\b(VP|Director|Head|Chief)\b/i.test(t)) return "Leadership";
  if (/payroll|benefits|finance|revenue|billing|accounting/i.test(t)) return "Finance & Revenue Ops";
  if (/operation|ops\b|flight|geospatial/i.test(t)) return "Operations";
  if (/customer success|coordinator/i.test(t)) return "Customer Success";
  if (/account|sales/i.test(t)) return "Sales & Account Management";
  const top = c.topCategory || "";
  if (/finance/i.test(top)) return "Finance & Revenue Ops";
  if (/legal|safety|compliance|insurance/i.test(top)) return "Compliance & Legal";
  return "Other contributors";
}
function ContactsView({ data, setOpenEntry, setQuery, setTab }) {
  const [filter, setFilter] = useState("");
  const [showInactive, setShowInactive] = useState(true);
  const [dept, setDept] = useState("All");
  const [copied, setCopied] = useState(null);
  const [compose, setCompose] = useState(null);
  const contacts = useMemo(() => {
    const m = new Map();
    for (const d of data) {
      if (d.appendix) continue;
      if (!d.author) continue;
      if (NON_PERSON_AUTHORS.has(d.author)) continue;
      if (!m.has(d.author)) m.set(d.author, { name: d.author, entries: [], categories: new Set(), subs: {} });
      const c = m.get(d.author);
      c.entries.push(d);
      c.categories.add(d.category);
      if (d.subcategory) c.subs[d.subcategory] = (c.subs[d.subcategory] || 0) + 1;
    }
    return [...m.values()]
      .map((c) => {
        const catCount = {};
        c.entries.forEach((e) => (catCount[e.category] = (catCount[e.category] || 0) + 1));
        const o = {
          ...c,
          count: c.entries.length,
          latest: c.entries.reduce((acc, e) => Math.max(acc, parseDate(e.date)), 0),
          topCategory: Object.entries(catCount).sort((a, b) => b[1] - a[1])[0][0],
          topics: Object.entries(c.subs).sort((a, b) => b[1] - a[1]).slice(0, 4).map((x) => x[0]),
          title: CONTACT_TITLES[c.name] || null,
          inactive: INACTIVE_AUTHORS.has(c.name),
        };
        o.dept = contactDept(o);
        o.email = contactEmail(c.name);
        o.phone = CONTACT_PHONES[c.name] || null;
        return o;
      })
      .sort((a, b) => b.count - a.count);
  }, [data]);

  const q = filter.toLowerCase();
  const filtered = contacts.filter((c) => {
    if (!showInactive && c.inactive) return false;
    if (dept !== "All" && c.dept !== dept) return false;
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || (c.title || "").toLowerCase().includes(q) || c.topics.some((t) => t.toLowerCase().includes(q)) || [...c.categories].some((t) => t.toLowerCase().includes(q));
  });
  const activeCount = contacts.filter((c) => !c.inactive).length;
  const inactiveCount = contacts.length - activeCount;
  const deptCounts = {};
  contacts.forEach((c) => { if (showInactive || !c.inactive) deptCounts[c.dept] = (deptCounts[c.dept] || 0) + 1; });
  const groups = DEPT_ORDER.map((d) => [d, filtered.filter((c) => c.dept === d)]).filter((g) => g[1].length);
  const copy = (txt) => { try { navigator.clipboard.writeText(txt); } catch (e) {} setCopied(txt); setTimeout(() => setCopied(null), 1500); };

  return (
    <div className="page page-contacts">
      <div className="page-head">
        <div className="page-eyebrow">CONTACTS</div>
        <h1 className="page-title">Who knows what</h1>
        <p className="page-sub">
          {activeCount} active contributors{inactiveCount > 0 && <>, {inactiveCount} former</>}, grouped by team. Reach out directly for more context on an answer.
        </p>
        <div className="contact-controls">
          <div className="contact-search">
            <span className="search-icon"><Icon.Search /></span>
            <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search by name, role, or topic…" />
          </div>
          {inactiveCount > 0 && (
            <label className="toggle">
              <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
              <span className="toggle-slider" />
              <span className="toggle-label">Show former staff</span>
            </label>
          )}
        </div>
        <div className="dept-chips">
          {["All", ...DEPT_ORDER.filter((d) => deptCounts[d])].map((d) => (
            <button key={d} className={"dept-chip" + (dept === d ? " on" : "")} onClick={() => setDept(d)}>
              {d}<span>{d === "All" ? Object.values(deptCounts).reduce((a, b) => a + b, 0) : deptCounts[d]}</span>
            </button>
          ))}
        </div>
      </div>
      {groups.map(([d, list]) => (
        <section key={d} className={"dept-section" + (d === "Leadership" ? " dept-leadership" : "")}>
          <h2 className="dept-title"><i className="dept-dot" style={{ background: DEPT_COLORS[d] || "var(--ink-4)" }}></i>{d}<span>{list.length}</span></h2>
          <div className="contacts-grid">
            {list.map((c) => (
              <article key={c.name} className={"contact-card " + (c.inactive ? "contact-inactive" : "")}>
                <div className="contact-top">
                  <Avatar name={c.name} size={44} color={DEPT_COLORS[d]} />
                  <div className="contact-id">
                    <div className="contact-name">
                      {c.name}
                      {c.inactive && <span className="inactive-pill">Former</span>}
                    </div>
                    <div className="contact-role">{c.inactive ? (c.title ? c.title + " · No longer with the company" : "No longer with the company") : (c.title || <span className="role-tbc">Title to be confirmed</span>)}</div>
                    {!c.inactive && <button className="contact-email" onClick={() => copy(c.email)} title="Click to copy">{copied === c.email ? "Copied ✓" : c.email}</button>}
                  </div>
                </div>
                <div className="contact-topics">
                  <div className="contact-topics-label">Ask about</div>
                  <div className="contact-topic-list">
                    {c.topics.slice(0, 3).map((t) => (
                      <button key={t} className="contact-topic" title={t} onClick={() => { setQuery(t); setTab("wiki"); }}>{t}</button>
                    ))}
                    {c.topics.length === 0 && <span className="contact-topic-none">—</span>}
                  </div>
                </div>
                <div className="contact-stats">
                  <div><b>{c.count}</b><span>{c.count === 1 ? "entry" : "entries"}</span></div>
                  <div><b>{c.categories.size}</b><span>{c.categories.size === 1 ? "area" : "areas"}</span></div>
                  <div><b>{new Date(c.latest).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</b><span>last</span></div>
                </div>
                <div className="contact-foot">
                  {!c.inactive ? <button className="reach-btn reach-primary" onClick={() => setCompose(c)}>Message</button> : <span className="reach-btn reach-off" title="No longer with the company">Unavailable</span>}

                  <button className="ghost-btn" onClick={() => { setQuery(c.name); setTab("wiki"); }}>Entries</button>
                  <button className="ghost-btn" onClick={() => setOpenEntry([...c.entries].sort((a, b) => parseDate(b.date) - parseDate(a.date))[0])}>Latest</button>
                
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
      {filtered.length === 0 && <div className="empty-mini">No contacts match "<b>{filter}</b>".</div>}
      {compose && <ComposeModal contact={compose} onClose={() => setCompose(null)} />}
    </div>
  );
}

function ComposeModal({ contact, onClose }) {
  const [subject, setSubject] = useState("Vendor wiki question");
  const [body, setBody] = useState("Hi " + contact.name.split(" ")[0] + ",\n\n");
  const [sent, setSent] = useState(false);
  useEffect(() => {
    const k = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);
  return (
    <div className="cm-overlay" onClick={onClose}>
      <div className="cm-box" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={"Message " + contact.name}>
        <div className="cm-head">
          <b>New message</b>
          <button className="cm-x" onClick={onClose} aria-label="Close">×</button>
        </div>
        {sent ? (
          <div className="cm-sent">
            <div className="cm-check">✓</div>
            <div className="cm-sent-title">Message sent to {contact.name}</div>
            <div className="cm-sent-sub">{contact.email}</div>
            <button className="reach-btn reach-primary" onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <div className="cm-field"><span>To</span>
              <div className="cm-to"><Avatar name={contact.name} size={22} /><b>{contact.name}</b><em>{contact.email}</em></div>
            </div>
            <div className="cm-field"><span>Subject</span><input value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
            <textarea className="cm-body" value={body} onChange={(e) => setBody(e.target.value)} autoFocus placeholder="Type your message…"></textarea>
            <div className="cm-foot">
              {contact.topics && contact.topics[0] && <span className="cm-hint">Go-to for: {contact.topics.slice(0, 2).join(", ")}</span>}
              <button className="ghost-btn" onClick={onClose}>Cancel</button>
              <button className="reach-btn reach-primary" disabled={!body.trim()} onClick={() => setSent(true)}>Send</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---- Changelog view ----
function ChangelogView({ data, setOpenEntry }) {
  const buckets = useMemo(() => {
    const sorted = data.slice().sort((a, b) => parseDate(b.date) - parseDate(a.date));
    const map = new Map();
    for (const d of sorted) {
      const t = parseDate(d.date);
      const key = t ? new Date(t).toLocaleDateString(undefined, { month: "long", year: "numeric" }) : "Undated";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(d);
    }
    return [...map.entries()];
  }, [data]);

  return (
    <div className="page page-changelog">
      <div className="page-head">
        <div className="page-eyebrow">CHANGELOG</div>
        <h1 className="page-title">Recent activity</h1>
        <p className="page-sub">Every question and answer the wiki has captured, newest first.</p>
      </div>
      <div className="timeline">
        {buckets.map(([month, items]) => (
          <section key={month} className="timeline-bucket">
            <div className="timeline-month">
              <span>{month}</span>
              <span className="timeline-month-count">{items.length}</span>
            </div>
            <ol className="timeline-list">
              {items.map((d) => (
                <li key={d.id} className="timeline-item" onClick={() => setOpenEntry(d)}>
                  <div className="timeline-dot" data-status={d.status} />
                  <div className="timeline-body">
                    <div className="timeline-meta">
                      <span className="timeline-date">{d.date}</span>
                      <span className="dot">·</span>
                      <span className="timeline-cat">{d.category}</span>
                      <span className="crumb-sep">›</span>
                      <span className="timeline-sub">{d.subcategory}</span>
                      <StatusBadge status={d.status} />
                    </div>
                    <div className="timeline-q">{d.question}</div>
                    <div className="timeline-a">{(d.answer || "—").slice(0, 200)}{(d.answer || "").length > 200 ? "…" : ""}</div>
                    <div className="timeline-foot">
                      {d.appendix && APPENDICES[d.appendix] ? (
                        <span className="appendix-chip sm"><Icon.Doc /> Appendix {d.appendix}</span>
                      ) : (
                        <>
                          <Avatar name={d.author} size={20} />
                          <span>{d.author || "—"}</span>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}

// ---- Appendix view ----
function AppendixView({ data, setOpenEntry }) {
  // Each section toggles independently. Default: all expanded.
  const [openIds, setOpenIds] = useState(() => new Set(Object.keys(APPENDICES)));
  const toggleOpen = (id) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const appendices = useMemo(() => {
    return Object.values(APPENDICES).map((ap) => {
      const entries = data.filter((d) => d.appendix === ap.id);
      const cats = {};
      for (const e of entries) cats[e.category] = (cats[e.category] || 0) + 1;
      return { ...ap, entries, cats };
    });
  }, [data]);

  return (
    <div className="page page-appendix">
      <div className="page-head">
        <div className="page-eyebrow">APPENDIX</div>
        <h1 className="page-title">Source documents</h1>
        <p className="page-sub">
          Some answers come from completed documents rather than Slack threads. Each appendix below is the original source — open it to see the full document, or collapse and expand any section to jump to the entries it backs.
        </p>
      </div>

      <div className="appendix-stack">
        {appendices.map((ap) => {
          const open = openIds.has(ap.id);
          return (
            <section key={ap.id} className={"appendix-card " + (open ? "open" : "")}>
              <header className="appendix-card-head" onClick={() => toggleOpen(ap.id)}>
                <div className="appendix-badge">{ap.id}</div>
                <div className="appendix-card-main">
                  <div className="appendix-card-title">{ap.title}</div>
                  <div className="appendix-card-meta">
                    <span className="appendix-type"><Icon.Doc /> {ap.type}</span>
                    <span className="dot">·</span>
                    <span>{ap.date}</span>
                    <span className="dot">·</span>
                    <span>{ap.entries.length} {ap.entries.length === 1 ? "entry" : "entries"}</span>
                  </div>
                </div>
                <div className="appendix-card-actions">
                  <a className="primary-btn sm" href="#"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); openAppendix(ap.id); }} style={{ textDecoration: "none" }}>
                    <Icon.Doc /> Open document
                  </a>
                  <button className="appendix-expand" aria-label={open ? "Collapse section" : "Expand section"} aria-expanded={open}>
                    <Icon.Chevron style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform .18s" }} />
                  </button>
                </div>
              </header>

              {ap.description && <p className="appendix-desc">{ap.description}</p>}

              {open && (
                <div className="appendix-entries">
                  <div className="appendix-catbar">
                    {Object.entries(ap.cats).map(([c, n]) => (
                      <span key={c} className="appendix-cat-tag">{c} <b>{n}</b></span>
                    ))}
                  </div>
                  <ol className="appendix-entry-list">
                    {ap.entries.map((e) => (
                      <li key={e.id} className="appendix-entry" onClick={() => setOpenEntry(e)}>
                        <div className="appendix-entry-crumb">{e.category} <span className="crumb-sep">›</span> {e.subcategory}</div>
                        <div className="appendix-entry-q">{e.question}</div>
                        <div className="appendix-entry-a">{(plainText(e.answer) || "—").slice(0, 160)}{plainText(e.answer).length > 160 ? "…" : ""}</div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

// ---- Root ----
function App() {
  const rawData = window.WIKI_DATA || [];
  const [edits, setEdits] = useState(() => {
    try { return JSON.parse(localStorage.getItem("demo_wiki_edits") || "{}"); } catch { return {}; }
  });
  const data = useMemo(
    () => rawData.map((d) => (edits[d.id] ? { ...d, ...edits[d.id] } : d)),
    [edits]
  );
  const saveEdit = (id, patch) => {
    setEdits((prev) => {
      const next = { ...prev, [id]: { ...(prev[id] || {}), ...patch } };
      try { localStorage.setItem("demo_wiki_edits", JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const [tab, setTab] = useState("wiki");
  const [editor, setEditor] = useState(() => {
    try { return localStorage.getItem("demo_wiki_editor") === "1"; } catch { return false; }
  });
  const [query, setQuery] = useState("");
  const [activeCat, setCat] = useState(null);
  const [activeSub, setSub] = useState(null);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [tweaks, setTweaks] = useState(TWEAKS);
  const [tweaksVisible, setTweaksVisible] = useState(false);
  const [openEntry, setOpenEntry] = useState(null);

  // Click a suggestion chip → set the query AND, if there's an obvious best
  // match, jump straight into that entry's modal so the Slack link is one click away.
  const handleSuggest = (q) => {
    setQuery(q);
    setCat(null);
    setSub(null);
    const needle = q.toLowerCase();
    const tokens = needle.split(/\s+/).filter(Boolean);
    const scored = data
      .map((d) => {
        const hay = ((d.question || "") + " " + (d.answer || "") + " " + (d.category || "") + " " + (d.subcategory || "") + " " + (d.keywords || "")).toLowerCase();
        let score = 0;
        if (hay.includes(needle)) score += 10;
        for (const t of tokens) if (tokenHits(hay, t)) score += 1;
        return { d, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);
    if (scored.length && scored[0].score >= tokens.length) {
      setOpenEntry(scored[0].d);
    }
  };

  // Apply CSS vars from tweaks
  useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty("--primary", tweaks.primaryColor);
    r.setProperty("--tint", tweaks.accentTint);
    document.body.dataset.density = tweaks.cardDensity;
  }, [tweaks]);

  // Edit-mode handshake
  useEffect(() => {
    const onMsg = (e) => {
      if (e.data?.type === "__activate_edit_mode") setTweaksVisible(true);
      if (e.data?.type === "__deactivate_edit_mode") setTweaksVisible(false);
    };
    window.addEventListener("message", onMsg);
    window.parent.postMessage({ type: "__edit_mode_available" }, "*");
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const answeredCount = data.filter((d) => d.status === "answered").length;
  const reviewCount = data.filter((d) => d.status === "needs-review").length;
  const authorCount = new Set(data.map((d) => d.author).filter(Boolean)).size;

  return (
    <div className="app">
      <TopNav tab={tab} setTab={setTab} editor={editor} setEditor={setEditor} />
      {tab === "wiki" && (
        <>
          <Hero
            query={query}
            setQuery={setQuery}
            total={data.length}
            answered={answeredCount}
            needsReview={reviewCount}
            authors={authorCount}
            onSuggest={handleSuggest}
            heroStyle={tweaks.heroStyle}
            setTab={setTab}
          />
          <div className="layout">
            <Sidebar
              data={data}
              activeCat={activeCat}
              activeSub={activeSub}
              setCat={(c) => { setCat(c); setBrowseOpen(false); }}
              setSub={setSub}
              mobileOpen={browseOpen}
              onCloseMobile={() => setBrowseOpen(false)}
              setTab={setTab}
            />
            <Main
              data={data}
              query={query}
              setQuery={setQuery}
              activeCat={activeCat}
              activeSub={activeSub}
              setCat={setCat}
              setSub={setSub}
              tweaks={tweaks}
              openEntry={openEntry}
              setOpenEntry={setOpenEntry}
              onSave={saveEdit}
              editor={editor}
              onOpenBrowse={() => setBrowseOpen(true)}
            />
          </div>
        </>
      )}
      {tab === "submissions" && <SubmissionsView data={data} setOpenEntry={setOpenEntry} setTab={setTab} editor={editor} onSave={saveEdit} />}
      {tab === "corporate" && window.CorporateView && <window.CorporateView />}
      {tab === "compliance-platforms" && window.CompliancePlatformsView && <window.CompliancePlatformsView />}
      {tab === "insurance" && window.InsuranceView && <window.InsuranceView />}
      {tab === "contacts" && <ContactsView data={data} setOpenEntry={setOpenEntry} setQuery={setQuery} setTab={setTab} />}
      {tab === "appendix" && <AppendixView data={data} setOpenEntry={setOpenEntry} />}
      {tab === "changelog" && <ChangelogView data={data} setOpenEntry={setOpenEntry} />}
      {openEntry && tab !== "wiki" && <EntryModal entry={openEntry} onClose={() => setOpenEntry(null)} onSave={saveEdit} editor={editor}
        onNav={(cat, sub) => { setTab("wiki"); setCat(cat); setSub(sub); setOpenEntry(null); }} />}
      <TweaksPanel tweaks={tweaks} setTweaks={setTweaks} visible={tweaksVisible} onClose={() => setTweaksVisible(false)} />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
