const SYL_RAW = window.PERCORSO_SYL;
// default syllabus with stable lesson ids (level-position), so marks survive later edits
const SYL_DEFAULT = SYL_RAW.map(L=>{let n=0;return {lvl:L.lvl,blocks:L.blocks.map(b=>({name:b.name,lessons:b.lessons.map(t=>({id:L.lvl+"-"+(++n),t}))}))};});
const LEVELS = SYL_DEFAULT.map(l=>l.lvl);
let SYL = SYL_DEFAULT; let FLAT = {}; let SYL_CUSTOM=false;
function rebuild(syl){SYL=syl;FLAT={};syl.forEach(L=>{let i=0;FLAT[L.lvl]=[];L.blocks.forEach((b,bi)=>b.lessons.forEach((x,k)=>{
  FLAT[L.lvl].push({lvl:L.lvl,id:x.id,i,num:i+1,title:x.t,block:bi,blockName:b.name,rev:k===b.lessons.length-1});i++;}));});}
rebuild(SYL_DEFAULT);
const key = l=>l.id;
const clone=o=>JSON.parse(JSON.stringify(o));
function idxOf(lvl,id,num,fallback){const arr=FLAT[lvl]||[];let i=id?arr.findIndex(x=>x.id===id):-1;if(i<0&&num)i=Math.min(num,arr.length)-1;return i<0?fallback:i;}
function ends(s){const fa=FLAT[s.fromL]||[],fb=FLAT[s.toL]||[];
  const a=idxOf(s.fromL,s.fromId,s.fromN,0), b=idxOf(s.toL,s.toId,s.toN,fb.length-1);
  return {a,b,fromNum:a+1,toNum:b+1};}

function buildPath(s,withSkipped){
  const a=LEVELS.indexOf(s.fromL), b=LEVELS.indexOf(s.toL); const base=[]; const e=ends(s);
  for(let li=a;li<=b;li++){const arr=FLAT[LEVELS[li]];
    const st= li===a? e.a:0, en= li===b? e.b:arr.length-1;
    for(let i=st;i<=en;i++) base.push(arr[i]);}
  // per-student changes: renamed titles, removed lessons, extra lessons inserted after a lesson
  const ren=s.rename||{}, sk=s.skip||{}, ex=s.extra||{}; const out=[]; const seen=new Set();
  const push=l=>{if(seen.has(l.id))return;seen.add(l.id);
    const it={...l,title:ren[l.id]||l.title,renamed:!!ren[l.id],skipped:!!sk[l.id]};
    if(withSkipped||!it.skipped) out.push(it);
    (ex[l.id]||[]).forEach(x=>push({lvl:l.lvl,id:x.id,num:"+",title:x.t,block:l.block,blockName:l.blockName,rev:false,extra:true,anchor:l.id}));};
  // custom first lessons typed by the teacher (stored as extras anchored to "_start")
  const b0=base[0]||{lvl:s.fromL};
  (ex._start||[]).forEach(x=>push({lvl:b0.lvl,id:x.id,num:"+",title:x.t,block:b0.block,blockName:b0.blockName,rev:false,extra:true,anchor:"_start"}));
  base.forEach(push); return out;
}
const RANKS=[[0,"Principiante"],[.15,"Curioso"],[.35,"Esploratore"],[.6,"Viaggiatore"],[.85,"Quasi italiano"],[1,"Maestro"]];
function stats(s){
  const path=buildPath(s), marks=s.marks||{};
  let ok=0,pend=0,xp=0;
  path.forEach(l=>{const m=marks[key(l)];if(m&&m.s==="ok"){ok++;xp+=l.rev?25:10}else if(m&&m.s==="pend")pend++;});
  const total=path.length, pct= total? ok/total:0;
  let rank=RANKS[0][1]; RANKS.forEach(r=>{if(pct>=r[0])rank=r[1]});
  const cur=path.findIndex(l=>!(marks[key(l)]&&marks[key(l)].s==="ok"));
  const left= total-ok; const pw=Math.max(.5,+s.perWeek||2);
  const weeks= Math.ceil(left/pw); const eta=new Date(); eta.setDate(eta.getDate()+weeks*7);
  return {path,ok,pend,xp,total,pct,rank,cur,left,weeks,eta};
}
const MONTHS=["січня","лютого","березня","квітня","травня","червня","липня","серпня","вересня","жовтня","листопада","грудня"];
const fmtDate=d=>d.getDate()+" "+MONTHS[d.getMonth()]+" "+d.getFullYear();
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

const S={db:null,user:null,teacher:false,students:[],sel:null,code:null,demo:false,unsub:null};
const app=document.getElementById("app");
const sheet=document.getElementById("sheet");
function toast(t){const el=document.getElementById("toast");el.textContent=t;el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>el.hidden=true,2400);}
const lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
const lsSet=(k,v)=>{try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){}};
const BRAND='<div class="brand"><span class="logo">ITALICA</span><span class="hand">il mio percorso</span></div>';

function demoStudent(){
  const s={id:"demo",name:"Приклад учня",code:"DEMO",fromL:"A1",fromId:FLAT.A1[0].id,toL:"A2",toId:FLAT.A2[FLAT.A2.length-1].id,perWeek:2,goal:"Говорити впевнено в подорожі Італією",marks:{}};
  buildPath(s).slice(0,23).forEach(l=>s.marks[key(l)]={s:"ok"}); const p=buildPath(s); s.marks[key(p[23])]={s:"pend"};
  return s;
}

/* ---------- render: map ---------- */
function renderMap(s,mode){
  const st=stats(s); const P=2*Math.PI*56;
  const earned=[]; // badges: blocks and levels fully in path & done
  const byBlock={};
  st.path.forEach(l=>{const k=l.lvl+"|"+l.block;(byBlock[k]=byBlock[k]||{l,n:0,ok:0}).n++; const m=(s.marks||{})[key(l)]; if(m&&m.s==="ok")byBlock[k].ok++;});
  const lvls={}; st.path.forEach(l=>{(lvls[l.lvl]=lvls[l.lvl]||{n:0,ok:0}).n++; const m=(s.marks||{})[key(l)]; if(m&&m.s==="ok")lvls[l.lvl].ok++;});
  let badges=Object.values(byBlock).map(b=>`<div class="badge ${b.ok===b.n?"on":""}" title="${esc(b.l.blockName)}"><div class="medal">${b.ok===b.n?"★":Math.round(b.ok/b.n*100)+"%"}</div>${esc(b.l.lvl)} · ${esc(b.l.blockName)}</div>`).join("");
  badges=Object.keys(lvls).map(k=>`<div class="badge lvl ${lvls[k].ok===lvls[k].n?"on":""}"><div class="medal">${k}</div>Рівень ${k}</div>`).join("")+badges;
  const back = mode==="teacher"
    ? `<div class="backrow"><button class="btn ghost small" data-act="back">← Усі учні</button><div class="row"><span class="pill lv">код: ${esc(s.code)}</span>${st.pend?`<button class="btn small" data-act="confirmAll">Підтвердити ${st.pend}</button>`:""}<button class="btn ghost small" data-act="edit">Редагувати</button></div></div>`
    : mode==="demo"? `<div class="backrow"><span class="pill ex">Приклад: так учень бачить свою карту</span><button class="btn ghost small" data-act="back">← Назад</button></div>`
    : `<div class="backrow"><span class="note">Натисни на наступний урок, коли пройдеш його. Викладач підтвердить.</span><button class="btn ghost small" data-act="logout">Інший код</button></div>`;
  app.innerHTML = BRAND + back + `
  <section class="hero">
    <div class="ring"><svg viewBox="0 0 132 132"><circle cx="66" cy="66" r="56" fill="none" stroke="var(--line)" stroke-width="12"/>
      <circle cx="66" cy="66" r="56" fill="none" stroke="var(--red)" stroke-width="12" stroke-linecap="round" stroke-dasharray="${P}" stroke-dashoffset="${P*(1-st.pct)}"/></svg>
      <b><span>${Math.round(st.pct*100)}%<small>ШЛЯХУ</small></span></b></div>
    <div>
      <div class="rank">${st.rank}</div>
      <h1>${esc(s.name)}</h1>
      <div class="ab"><span class="pt">A · <b>${s.fromL}</b> урок ${ends(s).fromNum}</span><span>→</span><span class="pt">B · <b>${s.toL}</b> урок ${ends(s).toNum}</span></div>
      ${s.goal?`<p class="note" style="margin:8px 0 0">Мета: ${esc(s.goal)}</p>`:""}
    </div>
  </section>
  <section class="stats">
    <div class="stat"><div class="k">Пройдено</div><div class="v">${st.ok} / ${st.total}</div><div class="s">уроків на шляху</div></div>
    <div class="stat"><div class="k">Досвід</div><div class="v">${st.xp} XP</div><div class="s">10 за урок, 25 за повторення</div></div>
    <div class="stat"><div class="k">Залишилось</div><div class="v">${st.left}</div><div class="s">${st.pend?st.pend+" чекає підтвердження":"уроків до точки B"}</div></div>
    <div class="stat"><div class="k">Фініш</div><div class="v" style="font-size:18px">${st.left?"≈ "+fmtDate(st.eta):"Готово!"}</div><div class="s">${s.perWeek} ${+s.perWeek===1?"урок":(+s.perWeek<5&&Number.isInteger(+s.perWeek)?"уроки":"уроків")} на тиждень</div></div>
  </section>
  <section class="card" style="display:flex;flex-direction:column;gap:12px"><h3 style="font-size:15px">Нагороди</h3><div class="badges">${badges}</div></section>
  <section class="road" id="road"></section>`;
  S.mapPath = mode==="teacher"? buildPath(s,true) : st.path;
  drawRoad(s,st,mode);
}

function drawRoad(s,st,mode){
  const road=document.getElementById("road"); const W=road.clientWidth||700;
  const ROW=86, amp=Math.min(150,W*.22), cx=W/2; let y=70; const items=[]; const pts=[];
  items.push(`<div class="endpt" style="left:${cx}px;top:${y}px"><div class="flag">A</div><small>старт</small></div>`); y+=90;
  let lastL=null,lastB=null,j=0;
  const curId=st.cur>=0? st.path[st.cur].id : null; let curIdx=-1;
  S.mapPath.forEach((l,i)=>{
    if(l.lvl!==lastL){ if(lastL!==null) y+=20; items.push(`<div class="lvgate" style="top:${y}px"><span class="stamp ${LEVELS.indexOf(l.lvl)%2?"red":""}">${l.lvl}</span></div>`); y+=70; lastL=l.lvl; lastB=null; }
    if(l.block!==lastB){ items.push(`<div class="blk" style="top:${y}px"><span>Блок ${l.block+1} · ${esc(l.blockName)}</span></div>`); y+=56; lastB=l.block; }
    const x=cx+amp*Math.sin(j*0.85); j++;
    const m=(s.marks||{})[key(l)]; const isCur=l.id===curId; if(isCur)curIdx=i;
    const cls=l.skipped?"skip":m&&m.s==="ok"?"ok":m&&m.s==="pend"?"pend":isCur?"cur":"";
    pts.push([x,y]);
    const sym= cls==="ok"?"✓": cls==="pend"?"…": l.extra?"+": l.num;
    items.push(`<button class="node ${l.rev?"rev":""} ${cls}" style="left:${x}px;top:${y}px" data-i="${i}" aria-label="${esc(l.lvl+" урок "+l.num+": "+l.title)}"><span>${sym}</span></button>`);
    const right = x<=cx; const lx= right? x+40 : x-40;
    items.push(`<div class="lbl ${right?"r":"l"}" style="top:${y}px;${right?`left:${lx}px`:`right:${W-lx}px`}"><b>${l.extra?l.lvl+" · ДОДАТКОВИЙ":l.lvl+" · "+l.num}${l.rev?" · ЧЕКПОІНТ":""}${l.skipped?" · ПРИБРАНО":""}</b>${esc(l.title)}</div>`);
    if(isCur) items.push(`<div class="here" style="left:${x}px;top:${y}px">${mode==="teacher"?"зараз тут":"ти тут"}</div>`);
    y+=ROW;
  });
  y+=10; items.push(`<div class="endpt b" style="left:${cx}px;top:${y}px"><div class="flag">B</div><small>${s.toL} · ціль</small></div>`); y+=70;
  road.style.height=y+"px";
  // road line
  let d=`M ${cx} 70 `; let prev=[cx,70];
  const all=[...pts,[cx,y-70]];
  all.forEach(p=>{const my=(prev[1]+p[1])/2; d+=`C ${prev[0]} ${my}, ${p[0]} ${my}, ${p[0]} ${p[1]} `; prev=p;});
  const doneN=st.ok;
  let dDone=`M ${cx} 70 `; prev=[cx,70];
  for(let k=0;k<pts.length && (curIdx===-1? st.cur===-1 : k<curIdx);k++){const p=pts[k];const my=(prev[1]+p[1])/2;dDone+=`C ${prev[0]} ${my}, ${p[0]} ${my}, ${p[0]} ${p[1]} `;prev=p;}
  road.innerHTML=`<svg class="path" width="${W}" height="${y}" viewBox="0 0 ${W} ${y}"><path d="${d}" fill="none" stroke="var(--line)" stroke-width="10" stroke-linecap="round" stroke-dasharray="2 16"/><path d="${dDone}" fill="none" stroke="var(--red)" stroke-width="10" stroke-linecap="round" opacity=".85"/></svg>`+items.join("");
}

/* ---------- sheet for a lesson ---------- */
function openLesson(i){
  const s=current(); if(!s) return; const l=S.mapPath[i]; const m=(s.marks||{})[key(l)]; const state=m?m.s:"none";
  const mode=S.teacher&&!S.demo?"teacher":S.demo?"demo":"student";
  let acts="";
  let edit="";
  if(mode==="teacher"){
    edit=`<div class="edbox"><p class="k">Зміни лише для учня: ${esc(s.name)}</p>
      <label class="f">Назва уроку<input id="e-title" value="${esc(l.title)}"></label>
      <div class="row"><button class="btn ghost small" data-act="e-rename" data-i="${i}">Зберегти назву</button>${l.renamed?`<button class="btn ghost small" data-act="e-unrename" data-i="${i}">Повернути назву з силабусу</button>`:""}</div>
      <label class="f">Новий урок одразу після цього<input id="e-new" placeholder="напр. Розмовний клуб: подорожі"></label>
      <div class="row"><button class="btn blue small" data-act="e-insert" data-i="${i}">Вставити урок</button>
      ${l.extra?`<button class="btn ghost small" data-act="e-delx" data-i="${i}">Видалити цей урок</button>`: l.skipped?`<button class="btn ghost small" data-act="e-unskip" data-i="${i}">Повернути на карту</button>`:`<button class="btn ghost small" data-act="e-skip" data-i="${i}">Прибрати з карти учня</button>`}</div></div>`;
    acts = l.skipped? `<span class="pill pend">Прибрано з карти: учень цей урок не бачить</span>` : state==="ok" ? `<button class="btn ghost" data-act="mark" data-i="${i}" data-v="none">Зняти позначку</button>`
      : `<button class="btn" data-act="mark" data-i="${i}" data-v="ok">${state==="pend"?"Підтвердити урок":"Позначити пройденим"}</button>${state==="pend"?`<button class="btn ghost" data-act="mark" data-i="${i}" data-v="none">Відхилити</button>`:""}`;
  } else if(mode==="student"){
    acts = state==="ok" ? `<span class="pill lv">Пройдено ✓ підтверджено викладачем</span>`
      : state==="pend" ? `<span class="pill pend">Чекає підтвердження</span><button class="btn ghost" data-act="mark" data-i="${i}" data-v="none">Скасувати</button>`
      : `<button class="btn" data-act="mark" data-i="${i}" data-v="pend">Я пройшов цей урок</button>`;
  } else acts=`<span class="pill ex">У прикладі позначки не зберігаються</span>`;
  sheet.innerHTML=`<div class="in"><div class="row" style="justify-content:space-between"><span class="pill lv">${l.lvl} · ${l.extra?"додатковий урок":"урок "+l.num}${l.rev?" · чекпоінт":""}</span><button class="btn ghost small" data-act="close">Закрити</button></div>
    <h2 style="font-size:20px">${esc(l.title)}</h2><p class="note" style="margin:0">Блок ${l.block+1}: ${esc(l.blockName)} · ${l.rev?"+25":"+10"} XP</p><div class="row">${acts}</div>${edit}</div>`;
  sheet.hidden=false;
}
function closeSheet(){sheet.hidden=true}

function current(){ if(S.demo) return S.demoS; return S.students.find(x=>x.id===S.sel)||null; }

async function editLesson(a,i){
  const s=current(); const l=S.mapPath[i]; const ref=S.db.collection("students").doc(s.id); const ex=clone(s.extra||{});
  const findX=id=>{for(const k in ex){const j=(ex[k]||[]).findIndex(x=>x.id===id); if(j>=0) return [k,j];} return null;};
  let patch=null, msg="Збережено";
  if(a==="e-rename"){const t=document.getElementById("e-title").value.trim(); if(!t) return;
    if(l.extra){const [k,j]=findX(l.id); ex[k][j].t=t; patch={extra:{[k]:ex[k]}};} else patch={rename:{[l.id]:t}}; msg="Назву змінено";}
  if(a==="e-unrename"){patch={rename:{[l.id]:null}}; msg="Назва як у силабусі";}
  if(a==="e-insert"){const t=document.getElementById("e-new").value.trim(); if(!t){document.getElementById("e-new").focus();return;}
    const arr=(ex[l.id]||[]).slice(); arr.unshift({id:"x"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),t}); patch={extra:{[l.id]:arr}}; msg="Урок додано";}
  if(a==="e-skip"){patch={skip:{[l.id]:true}}; msg="Урок прибрано з карти учня";}
  if(a==="e-unskip"){patch={skip:{[l.id]:false}}; msg="Урок повернуто";}
  if(a==="e-delx"){const [k,j]=findX(l.id); const kids=ex[l.id]||[]; ex[k].splice(j,1,...kids); patch={extra:{[k]:ex[k],[l.id]:[]}}; msg="Урок видалено";}
  if(!patch) return; closeSheet();
  try{await ref.update(patch); toast(msg);}catch(e){toast("Не вдалося зберегти.");}
}
async function setMark(i,v){
  const s=current(); const l=S.mapPath[i]; const k=key(l);
  closeSheet();
  if(S.demo){return;}
  try{
    const ref=S.db.collection("students").doc(s.id);
    await ref.update({marks:{[k]: v==="none"? {s:"none",t:Date.now()} : {s:v,t:Date.now()}}});
    toast(v==="ok"?"Урок зараховано":v==="pend"?"Надіслано викладачу на підтвердження":"Позначку знято");
  }catch(e){toast(e&&e.status===403?"Цей урок уже підтвердив викладач.":"Не вдалося зберегти. Спробуйте ще раз.");}
}
async function confirmAll(){
  const s=current(); const st=stats(s); const patch={};
  st.path.forEach(l=>{const m=(s.marks||{})[key(l)]; if(m&&m.s==="pend")patch[key(l)]={s:"ok",t:Date.now()};});
  try{await S.db.collection("students").doc(s.id).update({marks:patch});toast("Підтверджено");}catch(e){toast("Не вдалося зберегти.");}
}

/* ---------- teacher ---------- */
const NONE="__none";
function folderOf(s){return s.teacher&&(S.teachers||[]).includes(s.teacher)?s.teacher:NONE;}
function renderFolders(){
  const T=S.teachers||[]; const groups=T.map(n=>({key:n,name:n})); if(S.students.some(s=>folderOf(s)===NONE)) groups.push({key:NONE,name:"Без викладача"});
  const cards=groups.map(g=>{const list=S.students.filter(s=>folderOf(s)===g.key); const pend=list.reduce((a,s)=>a+stats(s).pend,0);
    return `<div class="scard folder"><button class="fopen" data-act="folder" data-f="${esc(g.key)}"><span class="ficon">📁</span><span class="nm">${esc(g.name)}</span>
      <span class="note">${list.length} ${plural(list.length,"учень","учні","учнів")}</span>${pend?`<span class="pill pend">${pend} на перевірку</span>`:""}</button>
      ${g.key!==NONE&&!list.length?`<button class="btn ghost small" data-act="fdel" data-f="${esc(g.key)}">Видалити папку</button>`:""}</div>`;}).join("");
  app.innerHTML=BRAND+`<div class="backrow"><h1 style="font-size:26px;font-weight:800">Викладачі</h1><div class="row"><button class="btn ghost small" data-act="demo">Подивитись приклад</button><button class="btn ghost small" data-act="syl">Силабус</button></div></div>
  <div class="slist">${cards}</div>
  <form class="row" id="fnew"><input id="fnew-n" placeholder="напр. Маестра Олена" style="flex:1;min-width:180px"><button class="btn" type="submit">+ Нова папка викладача</button></form>
  <p class="note">Учні відкривають <b>italica-test.onrender.com/percorso</b> і вводять свій код. Реєстрація не потрібна.</p>
  <div class="row"><a class="btn ghost small" href="/api/admin/percorso/export" download>Завантажити резервну копію</a>
  <label class="btn ghost small" for="imp">Імпортувати з файлу</label><input id="imp" type="file" accept=".json,application/json" hidden></div>`;
  document.getElementById("fnew").onsubmit=async ev=>{ev.preventDefault(); const n=document.getElementById("fnew-n").value.trim(); if(!n)return;
    if(T.includes(n)){toast("Така папка вже є");return;}
    try{await S.db.setTeachers([...T,n]); toast("Папку додано");}catch(e){toast("Не вдалося зберегти.");}};
}
function plural(n,a,b,c){const m=n%10,h=n%100; return m===1&&h!==11?a: m>=2&&m<=4&&(h<12||h>14)?b:c;}
function renderTeacher(){
  if(S.folder==null) return renderFolders();
  const fname=S.folder===NONE?"Без викладача":S.folder;
  const cards=S.students.filter(s=>folderOf(s)===S.folder).slice().sort((a,b)=>String(a.name).localeCompare(b.name,"uk")).map(s=>{const st=stats(s);
    return `<button class="scard" data-act="open" data-id="${esc(s.id)}"><div class="row" style="justify-content:space-between"><span class="nm">${esc(s.name)}</span>${st.pend?`<span class="pill pend">${st.pend} на перевірку</span>`:""}</div>
    <div class="row"><span class="pill lv">${s.fromL} → ${s.toL}</span><span class="note">${st.ok}/${st.total} уроків · ${st.rank}</span></div>
    <div class="bar"><i style="width:${Math.round(st.pct*100)}%"></i></div><span class="note">код учня: <b>${esc(s.code)}</b></span></button>`;}).join("");
  const has=S.students.some(s=>folderOf(s)===S.folder);
  app.innerHTML=BRAND+`<div class="backrow"><button class="btn ghost small" data-act="folders">← Усі викладачі</button></div>
  <div class="backrow"><h1 style="font-size:26px;font-weight:800">📁 ${esc(fname)}</h1><div class="row"><button class="btn" data-act="new">+ Новий учень</button></div></div>
  ${has?`<div class="slist">${cards}</div>`:`<div class="card gate"><div class="hand">Поки порожньо</div><p class="muted" style="max-width:440px;margin:0">Додайте першого учня: вкажіть точку А (з якого уроку починає) і точку B (до якого рівня йде). Карта шляху побудується з силабусів A1–B2 автоматично, а учень отримає код для входу.</p><button class="btn" data-act="new">+ Новий учень</button></div>`}
  <p class="note">Учні відкривають <b>italica-test.onrender.com/percorso</b> і вводять свій код. Реєстрація не потрібна.</p>`;
}
function lvlOpts(sel){return LEVELS.map(l=>`<option ${l===sel?"selected":""}>${l}</option>`).join("")}
function lessonOpts(lvl,sel){return FLAT[lvl].map(l=>`<option value="${esc(l.id)}" ${l.id===sel?"selected":""}>${l.num}. ${esc(l.title)}</option>`).join("")}
function renderForm(s){
  const e=s?{...s,fromId:FLAT[s.fromL][ends(s).a].id,toId:FLAT[s.toL][ends(s).b].id}:{name:"",fromL:"A1",fromId:FLAT.A1[0].id,toL:"A2",toId:FLAT.A2[FLAT.A2.length-1].id,perWeek:2,goal:""};
  app.innerHTML=BRAND+`<div class="backrow"><button class="btn ghost small" data-act="${s?"openSel":"back"}">← Назад</button></div>
  <form class="card" id="sf" style="display:flex;flex-direction:column;gap:16px">
    <h1 style="font-size:24px;font-weight:800">${s?"Редагувати учня":"Новий учень"}</h1>
    <div class="grid2"><label class="f">Ім'я учня<input id="f-name" required value="${esc(e.name)}" placeholder="напр. Олена"></label>
      <label class="f">Уроків на тиждень<input id="f-pw" type="number" min="0.5" max="7" step="0.5" value="${esc(e.perWeek)}"></label></div>
    <label class="f">Викладач (папка)<select id="f-t">${(S.teachers||[]).map(n=>`<option ${n===(s?s.teacher:S.folder)?"selected":""}>${esc(n)}</option>`).join("")}<option value="" ${(s?!(S.teachers||[]).includes(s.teacher):!(S.teachers||[]).includes(S.folder))?"selected":""}>— без викладача —</option></select></label>
    <fieldset class="card" style="background:var(--blue-soft);border:0;display:flex;flex-direction:column;gap:10px"><legend class="pill lv" style="background:var(--paper)">Точка А · звідки стартує</legend>
      <div class="grid2"><label class="f">Рівень<select id="f-fl">${lvlOpts(e.fromL)}</select></label><label class="f">З уроку<select id="f-fn">${lessonOpts(e.fromL,e.fromId)}</select></label></div>
      <label class="f">Або своя тема першого уроку (не обов'язково)<input id="f-st" value="${esc(((e.extra||{})._start||[])[0]?.t||"")}" placeholder="напр. Passato prossimo: повторення"></label>
      <span class="note">Якщо впишете тему, вона стане першим уроком на карті, а далі шлях піде з вибраного уроку.</span>
      <span class="note">Підказка: рівень з тесту /livello — це ваша точка А.</span></fieldset>
    <fieldset class="card" style="background:var(--red-soft);border:0;display:flex;flex-direction:column;gap:10px"><legend class="pill ex" style="background:var(--paper)">Точка B · куди йде</legend>
      <div class="grid2"><label class="f">Рівень<select id="f-tl">${lvlOpts(e.toL)}</select></label><label class="f">До уроку<select id="f-tn">${lessonOpts(e.toL,e.toId)}</select></label></div></fieldset>
    <label class="f">Мета учня (бачить на своїй карті)<textarea id="f-goal" placeholder="напр. Склади іспит CILS B1 до червня">${esc(e.goal)}</textarea></label>
    <p class="note" id="f-sum"></p>
    <div class="row" style="justify-content:space-between"><div class="row"><button class="btn" type="submit">${s?"Зберегти":"Створити карту"}</button></div>
      ${s?`<span id="delwrap"><button class="btn ghost small" type="button" data-act="askdel">Видалити учня</button></span>`:""}</div>
  </form>`;
  const f=id=>document.getElementById(id);
  const startArr=()=>{const t=f("f-st").value.trim(); const cur=((e.extra||{})._start||[]).slice();
    if(t){ if(cur.length) cur[0]={...cur[0],t}; else cur.unshift({id:"x"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),t}); }
    else if(cur.length) cur.shift();
    return cur;};
  const sync=()=>{const tmp={fromL:f("f-fl").value,fromId:f("f-fn").value,toL:f("f-tl").value,toId:f("f-tn").value,perWeek:+f("f-pw").value||2,extra:{...(e.extra||{}),_start:startArr()}};
    const en=ends(tmp); const ok= LEVELS.indexOf(tmp.toL)>LEVELS.indexOf(tmp.fromL) || (tmp.toL===tmp.fromL && en.b>=en.a);
    f("f-sum").textContent= ok? `Шлях: ${buildPath(tmp).length} уроків. При ${tmp.perWeek} на тиждень це ≈ ${Math.ceil(buildPath(tmp).length/tmp.perWeek)} тижнів.` : "Точка B має бути далі за точку А.";
    return ok;};
  f("f-fl").onchange=()=>{const L=f("f-fl").value;f("f-fn").innerHTML=lessonOpts(L,FLAT[L][0].id);sync()};
  f("f-tl").onchange=()=>{const L=f("f-tl").value;f("f-tn").innerHTML=lessonOpts(L,FLAT[L][FLAT[L].length-1].id);sync()};
  ["f-fn","f-tn","f-pw","f-st"].forEach(id=>f(id).oninput=sync); sync();
  f("sf").onsubmit=async ev=>{ev.preventDefault(); if(!sync()) return;
    const data={name:f("f-name").value.trim(),fromL:f("f-fl").value,fromId:f("f-fn").value,toL:f("f-tl").value,toId:f("f-tn").value,perWeek:+f("f-pw").value||2,goal:f("f-goal").value.trim(),teacher:f("f-t").value,extra:{_start:startArr()}};
    if(!data.name){f("f-name").focus();return;}
    try{
      if(s){await S.db.collection("students").doc(s.id).update(data); S.sel=s.id;}
      else{const code=genCode(); const ref=S.db.collection("students").doc(); await ref.set({...data,code,marks:{},created:Date.now()}); S.sel=ref.id;}
      S.folder=data.teacher||NONE; toast(s?"Збережено":"Карту створено"); S.view="map"; render();
    }catch(e){toast("Не вдалося зберегти. Перевірте доступ.");}
  };
}
function genCode(){const A="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let c;do{c=Array.from({length:5},()=>A[Math.floor(Math.random()*A.length)]).join("")}while(S.students.some(s=>s.code===c));return c;}

/* ---------- student ---------- */
function renderCode(msg){
  app.innerHTML=BRAND+`<form class="card gate" id="cf"><div class="hand">Ciao!</div><h1>Твоя карта навчання</h1>
  <p class="muted" style="margin:0;max-width:380px">Введи код, який дав тобі викладач, і побачиш свій шлях від точки А до точки B.</p>
  <input id="code" class="codein" maxlength="5" autocomplete="off" placeholder="•••••" aria-label="Код учня">
  ${msg?`<p class="note" style="color:var(--red)">${esc(msg)}</p>`:""}
  <button class="btn" type="submit">Відкрити карту</button></form>`;
  document.getElementById("cf").onsubmit=ev=>{ev.preventDefault();const c=document.getElementById("code").value.trim().toUpperCase();if(!c)return;S.code=c;lsSet("italica-code",c);S.loaded=false;app.querySelector("#cf button").disabled=true;S.db.refresh(true);};
}

/* ---------- syllabus editor ---------- */
function renderSyl(){
  const L=S.draft.find(x=>x.lvl===S.slvl); let n=0;
  const tabs=LEVELS.map(l=>`<button class="btn small ${l===S.slvl?"":"ghost"}" data-act="s-tab" data-l="${l}">${l}</button>`).join("");
  const blocks=L.blocks.map((b,bi)=>`<section class="card syb"><div class="row" style="justify-content:space-between"><label class="f" style="flex:1 1 260px">Блок ${bi+1}<input data-bname="${bi}" value="${esc(b.name)}"></label>
      <div class="row"><button class="btn ghost small" type="button" data-act="s-bup" data-b="${bi}" ${bi?"":"disabled"} aria-label="Блок вище">↑</button><button class="btn ghost small" type="button" data-act="s-bdn" data-b="${bi}" ${bi<L.blocks.length-1?"":"disabled"} aria-label="Блок нижче">↓</button>${b.lessons.length?"":`<button class="btn ghost small" type="button" data-act="s-bdel" data-b="${bi}">Видалити блок</button>`}</div></div>
    <ol class="syl">${b.lessons.map((x,k)=>{n++;const last=k===b.lessons.length-1;return `<li class="sylrow ${last?"chk":""}"><span class="sn">${n}</span><input data-b="${bi}" data-k="${k}" value="${esc(x.t)}" aria-label="Урок ${n}">
      <span class="sbtn"><button type="button" class="btn ghost small" data-act="s-up" data-b="${bi}" data-k="${k}" aria-label="Вище">↑</button><button type="button" class="btn ghost small" data-act="s-dn" data-b="${bi}" data-k="${k}" aria-label="Нижче">↓</button><button type="button" class="btn ghost small" data-act="s-add" data-b="${bi}" data-k="${k}" aria-label="Вставити урок нижче">+</button><button type="button" class="btn ghost small" data-act="s-del" data-b="${bi}" data-k="${k}" aria-label="Видалити урок">✕</button></span></li>`}).join("")}</ol>
    <button class="btn ghost small" type="button" data-act="s-add" data-b="${bi}" data-k="${b.lessons.length-1}">+ урок у кінець блоку</button></section>`).join("");
  app.innerHTML=BRAND+`<div class="backrow"><button class="btn ghost small" data-act="s-exit">← Учні</button><div class="row">${S.dirty?`<span class="pill pend">є незбережені зміни</span>`:""}<button class="btn" data-act="s-save" ${S.dirty?"":"disabled"}>Зберегти силабус</button></div></div>
  <div class="card" style="display:flex;flex-direction:column;gap:12px"><h1 style="font-size:24px;font-weight:800">Силабус</h1>
    <p class="note" style="margin:0">Змінюйте назви, вставляйте нові уроки (+), прибирайте зайві (✕) і пересувайте стрілками. Останній урок кожного блоку на карті стає чекпоінтом. Пройдені уроки учнів зберігаються: позначки прив'язані до самого уроку, а не до його номера.</p>
    <div class="row">${tabs}</div>
    <p class="note" style="margin:0">${S.slvl}: ${L.blocks.reduce((a,b)=>a+b.lessons.length,0)} уроків · ${L.blocks.length} блоків${SYL_CUSTOM?" · використовується ваша редакція":" · початковий силабус з Miro"}</p></div>
  ${blocks}
  <div class="row"><button class="btn ghost" data-act="s-badd">+ Новий блок</button><span id="resetwrap"><button class="btn ghost small" data-act="s-reset">Повернути початковий силабус</button></span></div>`;
}
function sylAct(a,t){
  const L=S.draft.find(x=>x.lvl===S.slvl); const bi=+t.dataset.b, k=+t.dataset.k; const B=L.blocks[bi];
  const y=window.scrollY; const mark=()=>{S.dirty=true;renderSyl();window.scrollTo(0,y);};
  if(a==="s-tab"){S.slvl=t.dataset.l;renderSyl();return;}
  if(a==="s-exit"){S.view="list";render();return;}
  if(a==="s-up"&&k>0){[B.lessons[k-1],B.lessons[k]]=[B.lessons[k],B.lessons[k-1]];return mark();}
  if(a==="s-up"&&k===0&&bi>0){L.blocks[bi-1].lessons.push(B.lessons.shift());return mark();}
  if(a==="s-dn"&&k<B.lessons.length-1){[B.lessons[k+1],B.lessons[k]]=[B.lessons[k],B.lessons[k+1]];return mark();}
  if(a==="s-dn"&&k===B.lessons.length-1&&bi<L.blocks.length-1){L.blocks[bi+1].lessons.unshift(B.lessons.pop());return mark();}
  if(a==="s-add"){B.lessons.splice(k+1,0,{id:S.slvl+"-x"+Date.now().toString(36)+Math.random().toString(36).slice(2,5),t:"Новий урок"});mark();
    const inp=app.querySelector(`input[data-b="${bi}"][data-k="${k+1}"]`); if(inp){inp.focus();inp.select();} return;}
  if(a==="s-del"){B.lessons.splice(k,1);return mark();}
  if(a==="s-bup"&&bi>0){[L.blocks[bi-1],L.blocks[bi]]=[L.blocks[bi],L.blocks[bi-1]];return mark();}
  if(a==="s-bdn"&&bi<L.blocks.length-1){[L.blocks[bi+1],L.blocks[bi]]=[L.blocks[bi],L.blocks[bi+1]];return mark();}
  if(a==="s-bdel"){L.blocks.splice(bi,1);return mark();}
  if(a==="s-badd"){L.blocks.push({name:"Новий блок",lessons:[{id:S.slvl+"-x"+Date.now().toString(36),t:"Новий урок"}]});return mark();}
  if(a==="s-save"){if(S.draft.some(l=>!l.blocks.some(b=>b.lessons.length))){toast("У кожному рівні має бути хоча б один урок");return;}
    S.db.doc("config/syllabus").set({levels:S.draft,updated:Date.now()}).then(()=>{S.dirty=false;toast("Силабус збережено");rebuild(clone(S.draft));SYL_CUSTOM=true;renderSyl();}).catch(()=>toast("Не вдалося зберегти силабус."));return;}
  if(a==="s-reset"){document.getElementById("resetwrap").innerHTML=`<span class="note">Повернути силабус з Miro? Ваші зміни зникнуть.</span> <button class="btn small" data-act="s-reset2">Так</button> <button class="btn ghost small" data-act="s-reset0">Ні</button>`;return;}
  if(a==="s-reset0"){renderSyl();return;}
  if(a==="s-reset2"){S.db.doc("config/syllabus").delete().then(()=>{rebuild(SYL_DEFAULT);SYL_CUSTOM=false;S.draft=clone(SYL_DEFAULT);S.dirty=false;toast("Повернуто початковий силабус");renderSyl();}).catch(()=>toast("Не вдалося."));return;}
}
document.addEventListener("input",ev=>{const t=ev.target; if(S.view!=="syl"||!S.draft) return; const L=S.draft.find(x=>x.lvl===S.slvl);
  if(t.dataset.bname!==undefined){L.blocks[+t.dataset.bname].name=t.value;}
  else if(t.dataset.k!==undefined){L.blocks[+t.dataset.b].lessons[+t.dataset.k].t=t.value;} else return;
  if(!S.dirty){S.dirty=true;const btn=app.querySelector('[data-act="s-save"]');if(btn)btn.disabled=false;}});

/* ---------- router ---------- */
function render(){
  if(S.demo){renderMap(S.demoS,"demo");return;}
  if(!S.db){app.innerHTML=BRAND+`<div class="card gate"><h1>Увійдіть, щоб побачити карту</h1><p class="muted" style="margin:0;max-width:420px">Карта зберігається в акаунті школи. Відкрийте сторінку, увійшовши в Claude, з посиланням, яке надіслав викладач.</p><button class="btn ghost" data-act="demo">Подивитись приклад</button></div>`;return;}
  if(S.teacher){
    if(S.view==="form") return renderForm(S.editing?current():null);
    if(S.view==="syl") return renderSyl();
    const s=current(); if(S.view==="map"&&s) return renderMap(s,"teacher");
    return renderTeacher();
  }
  if(!S.code) return renderCode();
  const s=S.students.find(x=>x.code===S.code);
  if(!s){ if(S.loaded) return renderCode("Такого коду немає. Перевір літери або спитай викладача."); return; }
  S.sel=s.id; renderMap(s,"student");
}

document.addEventListener("click",ev=>{
  const t=ev.target.closest("[data-act],.node"); if(!t) return;
  if(t.classList.contains("node")) return openLesson(+t.dataset.i);
  const a=t.dataset.act;
  if(a==="close") return closeSheet();
  if(a==="mark") return setMark(+t.dataset.i,t.dataset.v);
  if(a&&a.startsWith("e-")) return editLesson(a,+t.dataset.i);
  if(a==="demo"){S.demo=true;S.demoS=demoStudent();return render();}
  if(a==="back"){S.demo=false;S.view="list";S.sel=S.teacher?null:S.sel;return render();}
  if(a==="open"){const o=S.students.find(x=>x.id===t.dataset.id); if(o) S.folder=folderOf(o); S.sel=t.dataset.id;S.view="map";return render();}
  if(a==="folder"){S.folder=t.dataset.f;S.view="list";return render();}
  if(a==="folders"){S.folder=null;S.view="list";return render();}
  if(a==="fdel"){const n=t.dataset.f; S.db.setTeachers((S.teachers||[]).filter(x=>x!==n)).then(()=>toast("Папку видалено")).catch(()=>toast("Не вдалося зберегти."));return;}
  if(a==="openSel"){S.view="map";return render();}
  if(a==="new"){S.editing=false;S.view="form";return render();}
  if(a==="edit"){S.editing=true;S.view="form";return render();}
  if(a==="confirmAll") return confirmAll();
  if(a==="syl"){S.draft=clone(SYL);S.slvl=S.slvl||"A1";S.dirty=false;S.view="syl";return render();}
  if(a&&a.startsWith("s-")) return sylAct(a,t);
  if(a==="logout"){S.code=null;lsSet("italica-code",null);return render();}
  if(a==="askdel"){document.getElementById("delwrap").innerHTML=`<span class="note">Видалити карту назавжди?</span> <button class="btn small" type="button" data-act="del">Так, видалити</button> <button class="btn ghost small" type="button" data-act="canceldel">Ні</button>`;return;}
  if(a==="canceldel"){document.getElementById("delwrap").innerHTML=`<button class="btn ghost small" type="button" data-act="askdel">Видалити учня</button>`;return;}
  if(a==="del"){const id=S.sel;S.db.collection("students").doc(id).delete().then(()=>{S.sel=null;S.view="list";toast("Учня видалено");render();}).catch(()=>toast("Не вдалося видалити."));return;}
});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeSheet();});
document.addEventListener("change",async ev=>{if(ev.target.id!=="imp"||!ev.target.files[0])return;
  try{const data=JSON.parse(await ev.target.files[0].text());
    const r=await fetch("/api/admin/percorso/import",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data),credentials:"same-origin"});
    if(!r.ok)throw 0; const j=await r.json(); toast("Імпортовано учнів: "+j.count); S.db.refresh(true);
  }catch(e){toast("Не вдалося прочитати файл. Потрібен JSON з резервної копії.");}});
let rT,lastW=window.innerWidth; window.addEventListener("resize",()=>{clearTimeout(rT);rT=setTimeout(()=>{if(window.innerWidth!==lastW&&document.getElementById("road")){lastW=window.innerWidth;render();}},200);});

/* ---------- server adapter (same shape as the old store API) ---------- */
function makeDb(mode){
  const T=mode==="teacher"; let students=[], syl=null, lastS="", lastY=""; const subs=[], ysubs=[];
  const api=async(method,url,body)=>{const r=await fetch(url,{method,headers:{"Content-Type":"application/json"},body:body?JSON.stringify(body):undefined,credentials:"same-origin"});
    if(!r.ok){const e=new Error("http "+r.status);e.status=r.status;throw e;} return r.status===204?null:r.json();};
  const fire=(force)=>{const a=JSON.stringify([students,S.teachers||[]]), b=JSON.stringify(syl);
    if(force||a!==lastS){lastS=a; subs.forEach(f=>f({docs:students.map(x=>({id:x.id,data:()=>x}))}));}
    if(force||b!==lastY){lastY=b; ysubs.forEach(f=>f({exists:!!syl,data:()=>({levels:syl})}));}};
  async function refresh(force){
    try{
      if(T){const r=await api("GET","/api/admin/percorso/all"); students=r.students; syl=r.syllabus; S.teachers=r.teachers||[];}
      else{ if(!S.code){students=[]; const r=await api("GET","/api/percorso/syllabus"); syl=r.syllabus;}
        else{const r=await api("GET","/api/percorso/s/"+encodeURIComponent(S.code)).catch(e=>{if(e.status===404)return {student:null,syllabus:syl};throw e;}); students=r.student?[r.student]:[]; syl=r.syllabus;} }
      fire(force);
    }catch(e){ if(force) subs.forEach(f=>f({docs:students.map(x=>({id:x.id,data:()=>x}))})); }
  }
  const newId=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,10);
  const db={
    refresh,
    setTeachers:async list=>{await api("PUT","/api/admin/percorso/teachers",{teachers:list}); await refresh(true);},
    collection:()=>({
      doc:(id)=>{id=id||newId(); return {id,
        set:async d=>{await api("PUT","/api/admin/percorso/students/"+id,d); await refresh();},
        update:async p=>{ if(T){await api("PATCH","/api/admin/percorso/students/"+id,p);}
          else{const k=Object.keys(p.marks||{})[0]; await api("POST","/api/percorso/s/"+encodeURIComponent(S.code)+"/mark",{lesson:k,v:p.marks[k].s});}
          await refresh();},
        delete:async()=>{await api("DELETE","/api/admin/percorso/students/"+id); await refresh();}};},
      onSnapshot:(f)=>{subs.push(f); refresh(true); return ()=>{};}
    }),
    doc:()=>({
      set:async d=>{await api("PUT","/api/admin/percorso/syllabus",d); await refresh();},
      delete:async()=>{await api("DELETE","/api/admin/percorso/syllabus"); await refresh();},
      onSnapshot:(f)=>{ysubs.push(f); return ()=>{};}
    })
  };
  setInterval(()=>{ if(document.visibilityState==="visible" && S.view!=="form" && S.view!=="syl") refresh(); },30000);
  return db;
}

(async function boot(){
  S.code=lsGet("italica-code");
  const mode=window.PERCORSO_MODE||"student"; S.teacher= mode==="teacher";
  const db=makeDb(mode); S.db=db;
  S.view="list"; render();
  db.doc("config/syllabus").onSnapshot(d=>{const v=d.exists&&d.data(); if(v&&Array.isArray(v.levels)&&v.levels.length){rebuild(v.levels);SYL_CUSTOM=true;}else{rebuild(SYL_DEFAULT);SYL_CUSTOM=false;}
    if(S.view!=="syl") render();},()=>{});
  db.collection("students").onSnapshot(snap=>{
    S.students=snap.docs.map(d=>({id:d.id,...d.data()})); S.loaded=true;
    render();
  },err=>{app.innerHTML=BRAND+`<div class="card gate"><h1>Не вдалося відкрити базу</h1><p class="muted">Оновіть сторінку. Якщо не допоможе, напишіть викладачу.</p></div>`;});
})();
