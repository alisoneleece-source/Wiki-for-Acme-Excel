window.SAMPLE_DOC_TITLES = {"sample-1":"Articles of Incorporation (Sample)","sample-2":"Annual Declaration – Québec (Sample)","sample-3":"Policy Documentation Log (Sample)","sample-4":"Employee Handbook (Sample)","sample-5":"Supporting Document (Sample)","sample-6":"Certificate of Incorporation (Sample)","sample-7":"W-9 Form (Sample)","sample-8":"OSHA Log (Sample)","sample-9":"Supporting Document (Sample)","sample-10":"W-9 Form (Sample)","sample-11":"Tax Registration (Sample)","sample-12":"WSIB Clearance Certificate (Sample)","sample-13":"Certificate of Incorporation (Sample)","sample-14":"Void Cheque (Sample)","sample-15":"W-9 Form (Sample)","sample-16":"Supporting Document (Sample)","sample-17":"Safety Program (Sample)","sample-18":"Supporting Document (Sample)","sample-19":"Supporting Document (Sample)","sample-20":"Supporting Document (Sample)","sample-21":"Supporting Document (Sample)","sample-22":"Certificate of Insurance (Sample)","sample-23":"Supporting Document (Sample)","sample-24":"Supporting Document (Sample)","sample-25":"Supporting Document (Sample)","sample-26":"Supporting Document (Sample)","sample-27":"Supporting Document (Sample)","sample-28":"Vendor Registration Confirmation (Sample)"};
window.WIKI_DOCS = {};
window.resolveDoc = function(id){
  var t = (window.SAMPLE_DOC_TITLES||{})[id] || "Sample Document";
  var clean = t.replace(" (Sample)","");
  var html = '<!doctype html><html><head><meta charset="utf-8"><title>'+t+'</title><style>'+
  'body{margin:0;background:#eef0f3;font:15px/1.55 system-ui,-apple-system,Segoe UI,sans-serif;color:#1f2933;display:flex;justify-content:center;padding:40px 16px}'+
  '.pg{position:relative;background:#fff;width:100%;max-width:760px;min-height:900px;padding:56px 64px;box-shadow:0 2px 14px rgba(0,0,0,.08);border-radius:4px;overflow:hidden;box-sizing:border-box}'+
  '.wm{position:absolute;top:42%;left:50%;transform:translate(-50%,-50%) rotate(-28deg);font-size:110px;font-weight:800;color:rgba(91,72,251,.07);letter-spacing:.08em;pointer-events:none;white-space:nowrap}'+
  '.hd{display:flex;align-items:center;gap:10px;border-bottom:2px solid #5B48FB;padding-bottom:16px;margin-bottom:32px}'+
  '.lg{width:30px;height:30px;border-radius:7px;background:#5B48FB;color:#fff;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center}'+
  'h1{font-size:24px;margin:0 0 6px}.sub{color:#6b7280;font-size:13px;margin:0 0 28px}'+
  '.row{display:grid;grid-template-columns:200px 1fr;gap:12px;padding:10px 0;border-bottom:1px solid #eceef2;font-size:14px}.row b{color:#6b7280;font-weight:600}'+
  '.ln{height:10px;background:#eceef2;border-radius:4px;margin:12px 0}.note{margin-top:36px;padding:14px 16px;background:#f5f3ff;border-radius:8px;font-size:13px;color:#4b3fc0}'+
  '</style></head><body><div class="pg"><div class="wm">SAMPLE</div>'+
  '<div class="hd"><div class="lg">AE</div><b>Acme Excel Holdings, Inc.</b></div>'+
  '<h1>'+clean+'</h1><p class="sub">Document ref. AE-'+id.replace("sample-","").padStart(4,"0")+' · Issued 01 Jan 2026</p>'+
  '<div class="row"><b>Legal entity</b><span>Acme Excel Holdings, Inc.</span></div>'+
  '<div class="row"><b>Address</b><span>100 Main Street, Suite 100, Anytown, CA 90000</span></div>'+
  '<div class="row"><b>Reference no.</b><span>00-0000000</span></div>'+
  '<div class="row"><b>Prepared by</b><span>Vendor Management Team</span></div>'+
  '<div class="ln" style="width:92%;margin-top:32px"></div><div class="ln" style="width:85%"></div><div class="ln" style="width:88%"></div><div class="ln" style="width:60%"></div>'+
  '<div class="ln" style="width:90%;margin-top:24px"></div><div class="ln" style="width:78%"></div><div class="ln" style="width:83%"></div>'+
  '<div class="note">This is a placeholder for demonstration purposes. In the live wiki, this link opens the actual document.</div>'+
  '</div></body></html>';
  return URL.createObjectURL(new Blob([html],{type:"text/html"}));
};
