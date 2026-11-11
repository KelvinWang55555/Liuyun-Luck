/* ============================================================
 * app.js — 周易占筮应用逻辑
 * ============================================================ */
(function(){
"use strict";

/* ---------- 工具 ---------- */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

function toast(msg){
  const t = $("#toast");
  t.textContent = msg; t.style.display = "block";
  clearTimeout(t._tm); t._tm = setTimeout(()=>t.style.display="none", 1800);
}

function fmtDate(d){
  const w = "日一二三四五六"[d.getDay()];
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 · 星期${w}`;
}

function hashStr(s){
  let h = 2166136261;
  for(let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0);
}

/* 画一爻：changed=true 时加动爻标记 */
function renderLines(bits, changedIdx){
  // changedIdx: 动爻位置(1-6，自下而上)，0 表示无
  let html = '<div class="gua-lines">';
  for(let i=0;i<6;i++){
    const yang = bits[i] === "1";
    const changed = changedIdx === i+1;
    if(yang){
      html += `<div class="line-yang ${changed?'changed':''}"></div>`;
    }else{
      html += `<div class="line-yin ${changed?'changed':''}"><span></span><span></span></div>`;
    }
  }
  return html + "</div>";
}

/* 本卦 → 变卦 */
function transformedBits(bits, changedIdx){
  if(!changedIdx) return null;
  const arr = bits.split("");
  arr[changedIdx-1] = arr[changedIdx-1] === "1" ? "0" : "1";
  return arr.join("");
}

function hexDetailHTML(h, changedIdx, showLines){
  let html = "";
  if(showLines) html += renderLines(h.gua, changedIdx);
  const elTxt = `上${h.up}(${BAGUA_PY[h.up]||""}·${TRIGRAM_EL[h.up]}) · 下${h.low}(${BAGUA_PY[h.low]||""}·${TRIGRAM_EL[h.low]}) · 第${h.n}卦`;
  html += `<div class="gua-title">
      <div class="sym">${h.sym}</div>
      <div class="fname">${h.full}</div>
      <div class="py-note">${HEX_PY[h.n] || ""}</div>
      <div class="trigrams">${elTxt}</div>
    </div>
    <div class="quote"><span class="tag">卦 辞</span><p>${annotateHard(h.ci)}</p></div>
    <div class="quote"><span class="tag">象 曰</span><p>${annotateHard(h.xiang)}</p></div>
    <p class="muted" style="margin-top:10px">${h.jian}</p>`;
  if(changedIdx){
    html += `<p class="muted" style="margin-top:8px">◉ 第 <b style="color:var(--verm)">${changedIdx}</b> 爻动 —— 事有变机，宜留意此爻所示之际遇。</p>`;
  }
  return html;
}

/* ---------- 占筮历史（localStorage） ---------- */
const HKEY = "zhouyi_history_v1";
function loadHist(){ try{ return JSON.parse(localStorage.getItem(HKEY)) || []; }catch(e){ return []; } }
function saveHist(h){ localStorage.setItem(HKEY, JSON.stringify(h.slice(0,100))); }
function addHist(type, h, changedIdx, intent){
  const list = loadHist();
  list.unshift({ t: Date.now(), type, n: h.n, name: h.full, sym: h.sym, yao: changedIdx||0, q: intent||"" });
  saveHist(list); renderHist();
}
function renderHist(){
  const list = loadHist();
  const wrap = $("#histList"), empty = $("#histEmpty");
  empty.style.display = list.length ? "none" : "block";
  wrap.innerHTML = list.slice(0,15).map(item=>{
    const d = new Date(item.t);
    const ds = `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
    return `<div class="hist-item" data-n="${item.n}">
      <span class="s">${item.sym}</span>
      <div class="info"><div class="n">${item.name}${item.yao?` · ${item.yao}爻动`:""}</div>
      <div class="d">${ds} · ${item.type}${item.q?" · 「"+item.q+"」":""}</div></div>
      <span class="muted" style="font-size:12px">›</span>
    </div>`;
  }).join("");
  wrap.querySelectorAll(".hist-item").forEach(el=>{
    el.onclick = ()=> showHex(Number(el.dataset.n));
  });
}

/* ---------- 卦典弹层 ---------- */
function showHex(n, changedIdx, showLines){
  const h = HEXAGRAMS.find(x=>x.n===n);
  const sheet = $("#sheet");
  sheet.innerHTML = `
    <button class="close-x" onclick="document.getElementById('modal').classList.remove('show')">✕</button>
    ${hexDetailHTML(h, changedIdx||0, showLines!==false)}
    ${renderBian(h, changedIdx||0)}`;
  $("#modal").classList.add("show");
}
function renderBian(h, changedIdx){
  if(!changedIdx) return "";
  const t = GUA_MAP[transformedBits(h.gua, changedIdx)];
  if(!t) return "";
  return `<div style="border-top:1px dashed var(--line);margin-top:14px;padding-top:12px">
    <h2 style="font-size:15px;letter-spacing:4px;color:var(--verm);margin-bottom:10px">变 之 卦</h2>
    <div class="gua-title"><div class="sym">${t.sym}</div>
      <div class="fname">${t.full}</div>
      <div class="py-note">${HEX_PY[t.n] || ""}</div></div>
    <div class="quote"><span class="tag">卦 辞</span><p>${annotateHard(t.ci)}</p></div>
    <p class="muted" style="margin-top:8px">${t.jian}</p></div>`;
}

/* ---------- 标签页 ---------- */
$$("nav button").forEach(b=>{
  b.onclick = ()=>{
    $$("nav button").forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
    $$(".panel").forEach(p=>p.classList.remove("active"));
    $("#panel-"+b.dataset.panel).classList.add("active");
    if(b.dataset.panel==="news") loadNews();
    window.scrollTo(0,0);
  };
});

/* ---------- 每日一卦：以日期为种子的确定性卦 ---------- */
function dailyHex(){
  const d = new Date();
  const key = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
  const h = hashStr(key + "|zhouyi");
  const n = h % 64 + 1;
  const yao = Math.floor(h / 64) % 6 + 1;
  return { hex: HEXAGRAMS.find(x=>x.n===n), yao };
}
function renderDaily(){
  const {hex, yao} = dailyHex();
  let html = hexDetailHTML(hex, yao, true);
  const b = loadBirth();
  if(b){
    const bazi = computeBazi(b.y, b.m, b.d, b.h);
    const rel = hexToDaymaster(hex, bazi);
    const score = fitScore(hex, bazi);
    html += `<div style="border-top:1px dashed var(--line);margin-top:14px;padding-top:10px">
      <div class="lucky-row" style="justify-content:center">
        <span class="chip">与您八字契合 <b>${score}</b> 分</span>
        <span class="chip">卦属${TRIGRAM_EL[hex.up]} · ${rel.key}日主${bazi.dayMaster}</span>
      </div>
      <p class="muted" style="margin-top:8px;text-align:center">${rel.desc} —— ${rel.act}</p>
    </div>`;
  }
  $("#dailyBody").innerHTML = html;
  $("#dailyDetail").onclick = ()=> showHex(hex.n, yao, false);
}

/* ---------- 金钱课 ---------- */
let tossCount = 0, tossBits = "", tossChanged = [];
const YAO_NAMES = ["初","二","三","四","五","上"];
function tossOnce(){
  const coins = $$("#coins .coin");
  coins.forEach(c=>{ c.classList.remove("flip"); void c.offsetWidth; c.classList.add("flip"); });
  let sum = 0, faces = [];
  coins.forEach(c=>{
    const yang = Math.random() < 0.5;   // 阳面=3 阴面=2
    sum += yang ? 3 : 2;
    faces.push(yang ? "阳" : "阴");
    c.textContent = yang ? "阳" : "阴";
  });
  const v = sum; // 6=老阴(变) 7=少阳 8=少阴 9=老阳(变)
  const bit = (v===7 || v===9) ? "1" : "0";
  const changed = (v===6 || v===9);
  tossBits += bit;
  tossChanged.push({pos: tossCount+1, v, changed, faces});
  tossCount++;
  const name = v===6?"老阴●":v===7?"少阳":v===8?"少阴":"老阳●";
  $("#tossLog").innerHTML = `第 ${tossCount} 爻（${YAO_NAMES[tossCount-1]}爻位）：${faces.join(" + ")} → <b style="color:var(--verm)">${name}</b>`;
  if(tossCount >= 6){
    const h = GUA_MAP[tossBits];
    const changedPos = tossChanged.filter(x=>x.changed).map(x=>x.pos);
    const cp = changedPos.length ? changedPos[0] : 0;
    $("#coinResult").innerHTML = `
      <div style="border-top:1px dashed var(--line);margin-top:14px;padding-top:14px">
        ${hexDetailHTML(h, cp, true)}
        ${renderBian(h, cp)}
        ${changedPos.length>1?`<p class="muted" style="margin-top:6px">（多爻动：第 ${changedPos.join("、")} 爻。以本卦卦辞为主断，兼看变卦。）</p>`:""}
      </div>`;
    addHist("金钱课", h, cp, "");
    $("#tossBtn").style.display = "none";
    $("#tossReset").style.display = "inline-block";
    tossCount = 0; tossBits = ""; tossChanged = [];
  }
}
$("#tossBtn").onclick = tossOnce;
$("#tossReset").onclick = ()=>{
  $("#coinResult").innerHTML = ""; $("#tossLog").textContent = "";
  $("#tossBtn").style.display = "inline-block"; $("#tossReset").style.display = "none";
  $$("#coins .coin").forEach(c=>c.textContent="💰");
};

/* ---------- 数字起卦（梅花易数） ---------- */
function numDivine(){
  const upN = Number($("#numUp").value), downN = Number($("#numDown").value);
  let yaoN = $("#numYao").value ? Number($("#numYao").value) : 0;
  if(!upN || !downN || upN<1 || downN<1){ toast("请输入上、下卦数"); return; }
  const up = BAGUA[((upN-1) % 8) + 1], down = BAGUA[((downN-1) % 8) + 1];
  if(!yaoN){
    const d = new Date();
    const shi = Math.floor(((d.getHours()+1) % 24) / 2) + 1; // 时辰序 1-12
    yaoN = ((upN + downN + shi - 1) % 6) + 1;
  }
  yaoN = ((yaoN-1) % 6) + 1;
  const bits = down.bits + up.bits;
  const h = GUA_MAP[bits];
  const intent = $("#intentText").value.trim();
  $("#numResult").innerHTML = `
    <div style="border-top:1px dashed var(--line);margin-top:14px;padding-top:14px">
      <p class="muted" style="text-align:center">上卦${up.sym}${up.name} · 下卦${down.sym}${down.name} · ${yaoN}爻动${intent?` · 所问：「${intent}」`:""}</p>
      ${hexDetailHTML(h, yaoN, true)}
      ${renderBian(h, yaoN)}
    </div>`;
  addHist("数字起卦", h, yaoN, intent);
}

/* 心问一签：以意图文本+时间为种子 */
function quickDivine(){
  const q = $("#intentText").value.trim() || "";
  const seed = q + "|" + Date.now();
  const h = hashStr(seed);
  const n = h % 64 + 1, yao = Math.floor(h/64) % 6 + 1;
  const hex = HEXAGRAMS.find(x=>x.n===n);
  const intent = $("#intentText").value.trim();
  $("#numResult").innerHTML = `
    <div style="border-top:1px dashed var(--line);margin-top:14px;padding-top:14px">
      ${intent?`<p class="muted" style="text-align:center">所问：「${intent}」</p>`:""}
      ${hexDetailHTML(hex, yao, true)}
      ${renderBian(hex, yao)}
    </div>`;
  addHist("心问一签", hex, yao, intent);
}
$("#numBtn").onclick = numDivine;
$("#quickBtn").onclick = quickDivine;

/* ---------- 卦典网格 ---------- */
function renderGrid(){
  $("#guaGrid").innerHTML = HEXAGRAMS.map(h=>
    `<div class="cell" data-n="${h.n}"><div class="s">${h.sym}</div><div class="nm">${h.full}</div></div>`
  ).join("");
  $$("#guaGrid .cell").forEach(c=> c.onclick = ()=> showHex(Number(c.dataset.n)));
}

/* ---------- 清空历史 ---------- */
$("#clearHist").onclick = ()=>{
  if(confirm("确定清空所有占筮记录？")){ saveHist([]); renderHist(); toast("已清空"); }
};

/* ---------- 命理：生辰八字 + 个人化运势 ---------- */
const BKEY = "zhouyi_birth_v1";
function loadBirth(){ try{ return JSON.parse(localStorage.getItem(BKEY)) || null; }catch(e){ return null; } }

const EL_COLORS = {"木":"#4a7c3f","火":"#a63a2b","土":"#9a7b2e","金":"#8a8f98","水":"#33608c"};

function initBirthForm(){
  // 时辰下拉
  const sel = $("#birthHour");
  const HOURS = [];
  for(let h=0;h<24;h++) HOURS.push(h);
  const BR_NAME = ["子(23-1)","丑(1-3)","寅(3-5)","卯(5-7)","辰(7-9)","巳(9-11)","午(11-13)","未(13-15)","申(15-17)","酉(17-19)","戌(19-21)","亥(21-23)"];
  let opts = "";
  HOURS.forEach(h=>{
    const br = Math.floor((h+1)/2)%12;
    opts += `<option value="${h}">${String(h).padStart(2,"0")}点 · ${BR_NAME[br]}时</option>`;
  });
  sel.insertAdjacentHTML("beforeend", opts);

  const saved = loadBirth();
  if(saved){
    $("#birthDate").value = `${saved.y}-${String(saved.m).padStart(2,"0")}-${String(saved.d).padStart(2,"0")}`;
    sel.value = saved.h === null ? "-1" : saved.h;
    $("#birthClear").style.display = "inline-block";
    renderDestiny();
  }
}

function saveBirth(){
  const v = $("#birthDate").value;
  if(!v){ toast("请先选择出生日期"); return; }
  const [y,m,d] = v.split("-").map(Number);
  const hv = $("#birthHour").value;
  const h = hv === "-1" ? null : Number(hv);
  localStorage.setItem(BKEY, JSON.stringify({y,m,d,h}));
  $("#birthClear").style.display = "inline-block";
  toast("已保存（仅存本机）");
  renderDestiny();
  renderDaily();   // 每日一卦同步显示契合度
}

function renderDestiny(){
  const b = loadBirth();
  const box = $("#destinyResult");
  if(!b){ box.innerHTML = ""; $("#destinyDaily").innerHTML = ""; return; }
  const bazi = computeBazi(b.y, b.m, b.d, b.h);
  const maxCnt = Math.max(...Object.values(bazi.counts));
  const bars = ELEMENTS.map(e=>{
    const c = bazi.counts[e];
    const fav = bazi.favorable.includes(e) ? " ★喜" : (e === bazi.dayMaster ? " ·日主" : "");
    return `<div class="el-bar">
      <div class="lab">${e}<i>${ELEMENT_PY[e]}</i></div>
      <div class="track"><div class="fill" style="width:${maxCnt?Math.round(c/maxCnt*100):0}%;background:${EL_COLORS[e]}"></div></div>
      <div class="cnt">${c} 个${fav}</div>
    </div>`;
  }).join("");

  const pz = bazi.pillars.map((p,i)=>{
    const label = ["年柱","月柱","日柱","时柱"][i];
    const note = i===2 ? " · 日主" : "";
    return `<div class="p"><div class="t">${STEMS[p.stem]}${BRANCHES[p.branch]}</div>
      <div class="py">${STEMS_PY[p.stem]} ${BRANCHES_PY[p.branch]}</div>
      <div class="n">${label}${note}</div></div>`;
  }).join("");

  const luck = bazi.favorable.map(e=>{
    const L = ELEMENT_LUCKY[e];
    return `<span class="chip"><b>${e}</b>：${L.color} · ${L.dir}方 · 数 ${L.nums}</span>`;
  }).join("");

  const missing = ELEMENTS.filter(e=>bazi.counts[e]===0);

  box.innerHTML = `
    <div class="card">
      <h2>四 柱 八 字</h2>
      <div class="pillar">${pz}</div>
      <p class="muted" style="text-align:center">生肖：${bazi.zodiac}（${bazi.zodiacPy}） · 日主五行：<b style="color:var(--verm)">${bazi.dayMaster}</b>${bazi.weak?"（偏弱）":"（偏强）"}</p>
      ${missing.length?`<p class="muted" style="margin-top:6px">五行缺：${missing.map(e=>`${e}(${ELEMENT_PY[e]})`).join("、")}</p>`:""}
      ${b.h===null?`<p class="muted" style="margin-top:6px;font-size:12px">※ 时辰未填，以上为三柱（年·月·日），补填时辰可得完整八字。</p>`:""}
      <p class="muted" style="margin-top:6px;font-size:11px">※ 年柱以立春（2月4日）为界，月柱按节气近似划分，交界日出生者或有±1日误差。</p>
    </div>
    <div class="card">
      <h2>五 行 分 布</h2>
      ${bars}
      <h2 style="margin-top:16px">喜 用 神（简版推算）</h2>
      <div class="lucky-row">${luck}</div>
      <p class="muted" style="margin-top:8px">宜多用「${bazi.favorable.join("、")}」属性之色彩方位数字；忌用其相克之属。数字起卦时也可优先以喜用对应的先天卦数起卦。</p>
    </div>`;

  renderDestinyDaily();
}

function renderDestinyDaily(){
  const b = loadBirth();
  const box = $("#destinyDaily");
  if(!b){ box.innerHTML = ""; return; }
  const bazi = computeBazi(b.y, b.m, b.d, b.h);
  const {hex} = dailyHex();
  const score = fitScore(hex, bazi);
  const rel = hexToDaymaster(hex, bazi);
  const rel2 = elementRelation(bazi.dayMaster, TRIGRAM_EL[hex.low]);
  const L1 = ELEMENT_LUCKY[bazi.favorable[0]];
  box.innerHTML = `
    <div class="card">
      <h2>今 日 运 势（个人化）</h2>
      <div class="score-ring">
        <svg width="110" height="110">
          <circle cx="55" cy="55" r="48" fill="none" stroke="var(--paper2)" stroke-width="10"/>
          <circle cx="55" cy="55" r="48" fill="none" stroke="var(--verm)" stroke-width="10"
            stroke-dasharray="${(score/100*301).toFixed(0)} 301" stroke-linecap="round"/>
        </svg>
        <div class="num"><b>${score}</b><span>契合度</span></div>
      </div>
      <p class="muted" style="text-align:center">今日卦「${hex.full}」上卦属${TRIGRAM_EL[hex.up]}（${rel.key}）· 下卦属${TRIGRAM_EL[hex.low]}（${rel2.key}）</p>
      <div class="quote"><span class="tag">运 势</span><p>${rel.desc}。${rel.act}。</p></div>
      <div class="quote"><span class="tag">开 运 提 示</span><p>幸运色：${L1.color}；有利方位：${L1.dir}；吉利数字：${L1.nums}；宜往：${L1.scene}。</p></div>
      <p class="muted" style="margin-top:6px;font-size:11px">※ 以上为传统命理简化推演，仅供自娱参考，不作决策依据。</p>
    </div>`;
}

$("#birthSave").onclick = saveBirth;
$("#birthClear").onclick = ()=>{
  localStorage.removeItem(BKEY);
  $("#birthClear").style.display = "none";
  $("#birthDate").value = ""; $("#birthHour").value = "-1";
  renderDestiny(); renderDaily(); toast("已删除生辰信息");
};

/* ---------- 热点新闻 ---------- */
async function loadNews(){
  const box = $("#newsBody");
  try{
    const res = await fetch("news.json?t=" + Date.now(), {cache:"no-store"});
    if(!res.ok) throw new Error("http " + res.status);
    const data = await res.json();
    const items = data.items || [];
    if(!items.length) throw new Error("empty");
    box.innerHTML = `<div class="news-date">${data.date || ""} · 更新于北京时间</div>` +
      items.map((it,i)=>`<div class="news-item"><span class="idx">${i+1}</span>${it.url?`<a href="${it.url}" target="_blank" rel="noopener">${it.title}</a>`:`${it.title}`}</div>`).join("");
  }catch(e){
    box.innerHTML = `<p class="muted">暂无热点数据。<br>部署到 GitHub Pages 并等待 Actions 定时任务运行后（每天上午自动更新），此处会显示每日热点。<br><br>本页其余功能（起卦、卦典、历史）均可正常离线使用。</p>`;
  }
}

/* ---------- 初始化 ---------- */
$("#todayStr").textContent = fmtDate(new Date());
renderDaily(); renderGrid(); renderHist(); initBirthForm();
$("#modal").onclick = e=>{ if(e.target.id==="modal") e.target.classList.remove("show"); };
})();
