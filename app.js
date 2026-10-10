
let S=null, Q=[], TOPICS={}, KEY="", store={wrong:[],best:null,runs:0};
function openSubject(s){
  S=s; Q=s.q; TOPICS=s.topics; KEY="tt-"+s.id;
  store={wrong:[],best:null,runs:0};
  try { const x=JSON.parse(localStorage.getItem(KEY)); if (x) store=Object.assign(store,x); } catch(e){}
  cfg.topics=new Set(Object.keys(TOPICS)); cfg.mode="mashq"; home();
}
function save(){ try { localStorage.setItem(KEY, JSON.stringify(store)); } catch(e){} }

let cfg = {mode:"mashq", topics:new Set(), count:20, timed:false};
let run = null, tick = null, screen = "";
let armed = false;
function arm(){ if (!armed) { try { history.pushState({tt:1}, ""); armed = true; } catch(e){} } }
function handleBack(){
  if (run) {
    if (run.pos > 0) { run.pos--; show(); return true; }
    if (confirm("Test to‘xtatilsinmi? Javoblar hisoblanmaydi.")) { clearInterval(tick); run = null; home(); }
    else show();
    return true;
  }
  if (screen === "result") { home(); return true; }
  if (screen === "home" && SUBJECTS.length > 1) { subjects(); return true; }
  return false;
}
addEventListener("popstate", () => { armed = false; if (handleBack() && screen !== "subjects") arm(); });
const app = document.getElementById("app");
const shuffle = a => { a=a.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

function pool(){
  if (cfg.mode === "xato") return store.wrong.filter(i => Q[i]);
  return Q.map((q,i)=>i).filter(i => cfg.topics.has(Q[i].t));
}

function home(){
  screen = "home"; if (SUBJECTS.length > 1) arm();
  clearInterval(tick);
  const nW = store.wrong.length;
  if (cfg.mode === "xato" && !nW) cfg.mode = "mashq";
  const n = pool().length;
  const counts = {}; Q.forEach(q => counts[q.t]=(counts[q.t]||0)+1);
  app.innerHTML = `
    ${SUBJECTS.length>1?`<button class="back" id="subj">‹ Fanlar</button>`:""}
    <h1>${esc(S.name)}</h1>
    <p class="sub">${Q.length} ta test savoli. Variantlar har safar aralashtiriladi.</p>
    <div class="stats">
      <div class="stat"><b>${store.best==null?"—":store.best+"%"}</b><span>Eng yaxshi imtihon</span></div>
      <div class="stat"><b>${nW}</b><span>Xato qilingan savollar</span></div>
    </div>
    <div class="modes" role="group" aria-label="Rejim">
      <button class="mode" data-m="mashq" aria-pressed="${cfg.mode==="mashq"}"><span class="ic">✎</span><div><b>Mashq</b><span>Har bir javobdan keyin to‘g‘ri javob darhol ko‘rsatiladi</span></div></button>
      <button class="mode" data-m="imtihon" aria-pressed="${cfg.mode==="imtihon"}"><span class="ic">⏱</span><div><b>Imtihon</b><span>Natija va baho oxirida chiqadi</span></div></button>
      <button class="mode" data-m="xato" aria-pressed="${cfg.mode==="xato"}" ${nW?"":"disabled"}><span class="ic">↺</span><div><b>Xatolar ustida ishlash</b><span>${nW?`${nW} ta savol. To‘g‘ri javob berilgan savol ro‘yxatdan chiqadi`:"Hozircha xato qilingan savol yo‘q"}</span></div></button>
    </div>
    ${cfg.mode!=="xato"?`
    <h2>Mavzular</h2>
    <div class="chips">${Object.entries(TOPICS).map(([k,v])=>`<button class="chip" data-t="${k}" aria-pressed="${cfg.topics.has(k)}">${v}<small>${counts[k]}</small></button>`).join("")}</div>`:""}
    ${cfg.mode==="imtihon"?`
    <h2>Savollar soni</h2>
    <div class="chips">${[10,20,30,50,0].map(c=>`<button class="chip" data-c="${c}" aria-pressed="${cfg.count===c}">${c?c:"Hammasi"}</button>`).join("")}</div>
    <label class="toggle"><input type="checkbox" id="timed" ${cfg.timed?"checked":""}> Vaqt cheklovi: har bir savolga 1 daqiqa</label>`:""}
    <button class="primary" id="go" ${n?"":"disabled"}>${n?"Boshlash":"Kamida bitta mavzuni tanlang"}</button>
    ${SUBJECTS.length===1?installHint():""}
    <p class="foot">Natijalar faqat shu qurilmada saqlanadi. <button class="link" id="reset">Natijalarni tozalash</button></p>`;
  app.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { cfg.mode=b.dataset.m; home(); });
  app.querySelectorAll("[data-t]").forEach(b => b.onclick = () => { const t=b.dataset.t; cfg.topics.has(t)?cfg.topics.delete(t):cfg.topics.add(t); home(); });
  app.querySelectorAll("[data-c]").forEach(b => b.onclick = () => { cfg.count=+b.dataset.c; home(); });
  const tm = document.getElementById("timed"); if (tm) tm.onchange = () => cfg.timed = tm.checked;
  document.getElementById("go").onclick = start;
  bindInstall();
  const sb=document.getElementById("subj"); if (sb) sb.onclick=subjects;
  document.getElementById("reset").onclick = () => { if (confirm("Barcha natijalar va xatolar ro‘yxati o‘chirilsinmi?")) { store={wrong:[],best:null,runs:0}; save(); home(); } };
  window.scrollTo(0,0);
}

function start(){
  let ids = shuffle(pool());
  if (cfg.mode==="imtihon" && cfg.count) ids = ids.slice(0, cfg.count);
  run = { mode:cfg.mode, items: ids.map(i => ({i, opts: shuffle([Q[i].a, ...Q[i].d]), pick:null})), pos:0, t0:Date.now(),
          limit: (cfg.mode==="imtihon" && cfg.timed) ? ids.length*60 : 0 };
  if (run.limit) tick = setInterval(updTimer, 1000);
  show();
}

function fmt(s){ s=Math.max(0,Math.round(s)); return Math.floor(s/60)+":"+String(s%60).padStart(2,"0"); }
function updTimer(){
  const el = document.getElementById("timer"); if (!run || !run.limit) return;
  const left = run.limit - (Date.now()-run.t0)/1000;
  if (el){ el.textContent = fmt(left); el.classList.toggle("low", left < 60); }
  if (left <= 0){ clearInterval(tick); finish(); }
}

function pillClass(it, k){
  let c = "pill";
  if (it.pick!=null){
    if (run.mode==="imtihon") c += " done";
    else c += it.pick===Q[it.i].a ? " ok" : " bad";
  }
  if (k===run.pos) c += " cur";
  return c;
}

function show(){
  screen = "quiz"; arm();
  const it = run.items[run.pos], q = Q[it.i], total = run.items.length;
  const answered = it.pick!=null, practice = run.mode!=="imtihon";
  const L = "ABCD";
  app.innerHTML = `
    <div class="top">
      <div class="topbar">
        <button class="x" id="quit" aria-label="Testni to‘xtatish">×</button>
        <span class="counter">${run.pos+1} / ${total}</span>
        ${run.limit?`<span class="timer" id="timer"></span>`:""}
      </div>
      <div class="blister" aria-hidden="true">${run.items.map((x,k)=>`<span class="${pillClass(x,k)}"></span>`).join("")}</div>
    </div>
    <div class="topic">${TOPICS[q.t]}</div>
    <p class="q">${esc(q.q)}</p>
    <div class="opts">${it.opts.map((o,k)=>{
      let c="opt";
      if (practice && answered){ if (o===q.a) c+=" ok"; else if (o===it.pick) c+=" bad"; }
      else if (o===it.pick) c+=" sel";
      return `<button class="${c}" data-k="${k}" ${practice&&answered?"disabled":""}><span class="k">${L[k]}</span><span>${esc(o)}</span></button>`;
    }).join("")}</div>
    ${practice&&answered?`<div class="fb ${it.pick===q.a?"ok":"bad"}" role="status">${it.pick===q.a?"To‘g‘ri":"Noto‘g‘ri. To‘g‘ri javob: "+esc(q.a)}</div>`:""}
    <button class="primary" id="next" ${answered?"":"disabled"}>${run.pos+1<total?"Keyingi savol":"Natijani ko‘rish"}</button>
    ${run.pos>0?`<button class="ghost" id="prev">‹ Oldingi savol</button>`:""}`;
  updTimer();
  app.querySelectorAll(".opt").forEach(b => b.onclick = () => {
    it.pick = it.opts[+b.dataset.k];
    if (practice) mark(it);
    show();
  });
  document.getElementById("next").onclick = () => { if (run.pos+1<total){ run.pos++; show(); window.scrollTo(0,0);} else finish(); };
  const pv = document.getElementById("prev"); if (pv) pv.onclick = () => { run.pos--; show(); window.scrollTo(0,0); };
  document.getElementById("quit").onclick = () => { if (confirm("Test to‘xtatilsinmi? Javoblar hisoblanmaydi.")) { run=null; home(); } };
}

function mark(it){
  const ok = it.pick===Q[it.i].a, w = new Set(store.wrong);
  ok ? w.delete(it.i) : w.add(it.i);
  store.wrong = [...w]; save();
}

function grade(p){ return p>=86?"A’lo (5)":p>=71?"Yaxshi (4)":p>=56?"Qoniqarli (3)":"Qoniqarsiz (2)"; }

function finish(){
  screen = "result"; arm();
  clearInterval(tick);
  if (run.mode==="imtihon") run.items.forEach(it => { if (it.pick!=null) mark(it); else { const w=new Set(store.wrong); w.add(it.i); store.wrong=[...w]; } });
  const total = run.items.length, right = run.items.filter(it => it.pick===Q[it.i].a).length;
  const pct = Math.round(right/total*100), secs = (Date.now()-run.t0)/1000;
  if (run.mode==="imtihon"){ store.best = Math.max(store.best||0, pct); }
  store.runs++; save();
  const bad = run.items.filter(it => it.pick!==Q[it.i].a);
  app.innerHTML = `
    <div class="score">${pct}%</div>
    <span class="grade">${grade(pct)}</span>
    <p class="sub" style="margin-top:12px">${total} tadan ${right} ta to‘g‘ri, sarflangan vaqt: ${fmt(secs)}</p>
    ${bad.length?`<h2>Xatolar (${bad.length})</h2><div class="review">${bad.map(it=>`
      <div class="ri"><p>${esc(Q[it.i].q)}</p>
      ${it.pick!=null?`<div class="y">Sizning javobingiz: ${esc(it.pick)}</div>`:`<div class="y">Javob berilmagan</div>`}
      <div class="c">To‘g‘ri javob: ${esc(Q[it.i].a)}</div></div>`).join("")}</div>`:`<h2>Barcha javoblar to‘g‘ri</h2>`}
    ${store.wrong.length?`<button class="primary" id="redo">Xatolar ustida ishlash (${store.wrong.length})</button>`:""}
    <button class="ghost" id="home">Bosh sahifa</button>`;
  run = null;
  const r = document.getElementById("redo"); if (r) r.onclick = () => { cfg.mode="xato"; start(); };
  document.getElementById("home").onclick = home;
  window.scrollTo(0,0);
}

/* ---------- Faollashtirish ---------- */
const TG = "PhD020010";
const _k = ["be642f797b0410fa","22d84c3e52cb9fb8"].map(x=>x.split("").reverse().join("")).join("");
function deviceId(){
  let id=null; try{ id=localStorage.getItem("tt-device"); }catch(e){}
  if(!id){ id=LIC.newId(); try{ localStorage.setItem("tt-device",id); }catch(e){} }
  return id;
}
function activated(){
  try{ const c=localStorage.getItem("tt-code"); return !!c && LIC.norm(c)===LIC.norm(LIC.code(_k,deviceId())); }catch(e){ return false; }
}
function lockScreen(msg){
  const id=deviceId();
  app.innerHTML=`<div class="lock">
    <h1>Testlarga kirish</h1>
    <p class="sub">Ilova bir martalik kod bilan ochiladi. Kod faqat shu qurilmada ishlaydi.</p>
    <ol class="steps">
      <li>Quyidagi qurilma raqamini nusxalang.</li>
      <li>Telegram orqali yuboring va kod oling.</li>
      <li>Kodni pastdagi maydonga kiriting.</li>
    </ol>
    <h2>Qurilma raqami</h2>
    <div class="idbox"><b id="did">${id}</b><button class="copy" id="cp">Nusxalash</button></div>
    <a class="tg" href="https://t.me/${TG}" target="_blank" rel="noopener">Telegram: @${TG}</a>
    <h2>Faollashtirish kodi</h2>
    <input class="field" id="code" inputmode="text" autocomplete="off" autocapitalize="characters" placeholder="XXXX-XXXX" maxlength="9">
    ${msg?`<p class="err" role="alert">${msg}</p>`:""}
    <button class="primary" id="act">Faollashtirish</button>
    <p class="small">Diqqat: brauzer ma’lumotlari tozalansa, qurilma raqami o‘zgaradi va yangi kod kerak bo‘ladi.</p>
  </div>`;
  document.getElementById("cp").onclick=async()=>{
    const b=document.getElementById("cp");
    try{ await navigator.clipboard.writeText(id); b.textContent="Nusxalandi"; }
    catch(e){ const r=document.createRange(); r.selectNodeContents(document.getElementById("did")); const s=getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent="Belgilandi"; }
  };
  const f=document.getElementById("code");
  f.oninput=()=>{ let v=LIC.norm(f.value).slice(0,8); f.value=v.length>4?v.slice(0,4)+"-"+v.slice(4):v; };
  document.getElementById("act").onclick=()=>{
    const v=LIC.norm(f.value);
    if(v.length!==8) return lockScreen("Kod 8 ta belgidan iborat bo‘lishi kerak.");
    if(v!==LIC.norm(LIC.code(_k,id))) return lockScreen("Kod noto‘g‘ri. Qurilma raqamini to‘g‘ri yuborganingizni tekshiring.");
    try{ localStorage.setItem("tt-code",v); }catch(e){}
    subjects();
  };
}

/* ---------- Fanlar ro'yxati ---------- */
let deferredInstall=null;
addEventListener("beforeinstallprompt",e=>{ e.preventDefault(); deferredInstall=e; const b=document.getElementById("inst"); if(b) b.hidden=false; });
function subjects(){
  screen = "subjects";
  if(SUBJECTS.length===1) return openSubject(SUBJECTS[0]);
  app.innerHTML=`<h1>Fanlar</h1><p class="sub">Fanni tanlang.</p>
    <div class="modes">${SUBJECTS.map((s,i)=>`<button class="mode" data-s="${i}"><span class="ic">${i+1}</span><div><b>${esc(s.name)}</b><span>${s.q.length} ta savol</span></div></button>`).join("")}</div>
    ${installHint()}`;
  app.querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>openSubject(SUBJECTS[+b.dataset.s]));
  bindInstall();
}
function installHint(){
  if (matchMedia("(display-mode: standalone)").matches) return "";
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  return `<div class="install">${ios?"Ilova kabi ishlatish uchun: Ulashish tugmasi, keyin «Bosh ekranga qo‘shish».":"Ilova kabi ishlatish uchun brauzer menyusidan «Bosh ekranga qo‘shish»ni tanlang."}
    <button class="ghost" id="inst" ${deferredInstall?"":"hidden"}>Telefonga o‘rnatish</button></div>`;
}
function bindInstall(){ const b=document.getElementById("inst"); if(b) b.onclick=async()=>{ if(!deferredInstall) return; deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall=null; b.hidden=true; }; }

if ("serviceWorker" in navigator) addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
activated() ? subjects() : lockScreen();
