/* ============================================================
 * bazi.js — 拼音表 + 生辰八字计算 + 五行运势匹配
 * ============================================================ */

/* ---------- 64 卦拼音（全名） ---------- */
const HEX_PY = {
  1:"qián wéi tiān", 2:"kūn wéi dì", 3:"shuǐ léi zhūn", 4:"shān shuǐ méng",
  5:"shuǐ tiān xū", 6:"tiān shuǐ sòng", 7:"dì shuǐ shī", 8:"shuǐ dì bǐ",
  9:"fēng tiān xiǎo xù", 10:"tiān zé lǚ", 11:"dì tiān tài", 12:"tiān dì pǐ",
  13:"tiān huǒ tóng rén", 14:"huǒ tiān dà yǒu", 15:"dì shān qiān", 16:"léi dì yù",
  17:"zé léi suí", 18:"shān fēng gǔ", 19:"dì zé lín", 20:"fēng dì guān",
  21:"huǒ léi shì hé", 22:"shān huǒ bì", 23:"shān dì bō", 24:"dì léi fù",
  25:"tiān léi wú wàng", 26:"shān tiān dà xù", 27:"shān léi yí", 28:"zé fēng dà guò",
  29:"kǎn wéi shuǐ", 30:"lí wéi huǒ", 31:"zé shān xián", 32:"léi fēng héng",
  33:"tiān shān dùn", 34:"léi tiān dà zhuàng", 35:"huǒ dì jìn", 36:"dì huǒ míng yí",
  37:"fēng huǒ jiā rén", 38:"huǒ zé kuí", 39:"shuǐ shān jiǎn", 40:"léi shuǐ jiě",
  41:"shān zé sǔn", 42:"fēng léi yì", 43:"zé tiān guài", 44:"tiān fēng gòu",
  45:"zé dì cuì", 46:"dì fēng shēng", 47:"zé shuǐ kùn", 48:"shuǐ fēng jǐng",
  49:"zé huǒ gé", 50:"huǒ fēng dǐng", 51:"zhèn wéi léi", 52:"gèn wéi shān",
  53:"fēng shān jiàn", 54:"léi zé guī mèi", 55:"léi huǒ fēng", 56:"huǒ shān lǚ",
  57:"xùn wéi fēng", 58:"duì wéi zé", 59:"fēng shuǐ huàn", 60:"shuǐ zé jié",
  61:"fēng zé zhōng fú", 62:"léi shān xiǎo guò", 63:"shuǐ huǒ jì jì", 64:"huǒ shuǐ wèi jì"
};

/* 卦辞生僻字注音 */
const HARD_CHARS = {
  "筮":"shì", "渎":"dú", "颙":"yóng", "虩":"xì", "鬯":"chàng", "咥":"dié",
  "繘":"jù", "汔":"qì", "羸":"léi", "簋":"guǐ", "曷":"hé", "桡":"ráo",
  "洊":"jiàn", "戮":"lù", "颙若":"yóng ruò", "廟":"miào", "假":"gé",
  "姤":"gòu", "夬":"guài", "睽":"kuí", "蹇":"jiǎn", "贲":"bì", "蛊":"gǔ",
  "噬嗑":"shì hé", "旹":"shí", "濡":"rú", "绤":"xì", "绹":"táo", "苋":"xiàn", "陆":"lù"
};
function annotateHard(s){
  return s.replace(/[筮渎颙虩鬯咥繘汔羸簋曷桡洊濡苋姤夬睽蹇贲蛊]/g, c => c + "（" + HARD_CHARS[c] + "）");
}

/* ---------- 八卦/五行常量 ---------- */
const TRIGRAM_EL = { "乾":"金", "兑":"金", "离":"火", "震":"木", "巽":"木", "坎":"水", "艮":"土", "坤":"土" };
const BAGUA_PY = { "乾":"qián", "兑":"duì", "离":"lí", "震":"zhèn", "巽":"xùn", "坎":"kǎn", "艮":"gèn", "坤":"kūn" };

const STEMS = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const STEMS_PY = ["jiǎ","yǐ","bǐng","dīng","wù","jǐ","gēng","xīn","rén","guǐ"];
const BRANCHES = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
const BRANCHES_PY = ["zǐ","chǒu","yín","mǎo","chén","sì","wǔ","wèi","shēn","yǒu","xū","hài"];
const ANIMALS = ["鼠","牛","虎","兔","龙","蛇","马","羊","猴","鸡","狗","猪"];
const ANIMALS_PY = ["shǔ","niú","hǔ","tù","lóng","shé","mǎ","yáng","hóu","jī","gǒu","zhū"];
const STEM_EL  = ["木","木","火","火","土","土","金","金","水","水"];
const BRANCH_EL = ["水","土","木","木","土","火","火","土","金","金","土","水"];
const ELEMENTS = ["木","火","土","金","水"];
const ELEMENT_PY = {"木":"mù","火":"huǒ","土":"tǔ","金":"jīn","水":"shuǐ"};

const GEN = {"木":"火","火":"土","土":"金","金":"水","水":"木"};   // 相生
const KE  = {"木":"土","土":"水","水":"火","火":"金","金":"木"};   // 相克

const ELEMENT_LUCKY = {
  "木":{"color":"青、绿","dir":"东方","nums":"3、8","food":"酸味、绿叶蔬菜","scene":"公园草木、清晨散步"},
  "火":{"color":"红、紫、橙","dir":"南方","nums":"2、7","food":"苦味、温热食物","scene":"阳光、灯明之处"},
  "土":{"color":"黄、棕、米","dir":"本地、中部","nums":"5、0","food":"甘味、根茎谷物","scene":"山地田园、居家环境"},
  "金":{"color":"白、金、银","dir":"西方","nums":"6、9","food":"辛味、白色食物","scene":"金属器物、整洁空间"},
  "水":{"color":"黑、蓝、灰","dir":"北方","nums":"1、6","food":"咸味、汤水饮品","scene":"江边湖畔、夜间静处"}
};

/* 五行与日主关系文案（a=日主, b=对象五行） */
function elementRelation(a, b){
  if (a === b)           return {key:"同我",  desc:"气场相合，平顺自主",  act:"宜按既定计划稳步推进，相信自己的判断"};
  if (GEN[a] === b)      return {key:"我生",  desc:"耗泄输出，费力劳神",  act:"宜节制付出、保存精力，防为他人作嫁"};
  if (GEN[b] === a)      return {key:"生我",  desc:"滋养助力，贵人气旺",  act:"宜顺势接受帮助，主动请教与结缘"};
  if (KE[a] === b)       return {key:"我克",  desc:"可掌控驾驭",          act:"宜主动出击、管理事务，掌控局面"};
  return                    {key:"克我",  desc:"压力受制，阻力较大",  act:"宜守不宜攻，避其锋芒，缓图后进"};
}

/* ---------- 日柱锚点：1949-10-01 = 甲子日（百度百科/万年历多源一致） ---------- */
const DAY_ANCHOR = Date.UTC(1949, 9, 1);

/* 立春近似：2 月 4 日（误差 ±1 天，仅影响交界日出生者） */
function solarYear(y, m, d){ return (m < 2 || (m === 2 && d < 4)) ? y - 1 : y; }

/* 月支：以近似节气日划分（寅=2 ... 子=0 ...） */
function monthBranch(y, m, d){
  if (m === 1)  return d >= 6 ? 1 : 0;          // 小寒后丑月，前为子月
  if (m === 2)  return d >= 4 ? 2 : 1;          // 立春后寅月，前为丑月
  const t = [[3,6,3],[4,5,4],[5,6,5],[6,6,6],[7,7,7],[8,8,8],[9,8,9],[10,8,10],[11,7,11],[12,7,0]];
  for (const [mm, dd, br] of t){ if (m === mm && d >= dd) return br; }
  // 未到该月节气 → 上一支
  const prev = {3:2,4:3,5:4,6:5,7:6,8:7,9:8,10:9,11:10,12:11};
  return prev[m];
}

function computeBazi(y, m, d, hour){
  const sy = solarYear(y, m, d);
  const yStem = ((sy - 4) % 10 + 10) % 10;
  const yBranch = ((sy - 4) % 12 + 12) % 12;
  const mBranch = monthBranch(y, m, d);
  const mIdx = (mBranch - 2 + 12) % 12;                       // 寅月起 0
  const mStem = (yStem * 2 + 2 + mIdx) % 10;                  // 五虎遁
  const utc = Date.UTC(y, m - 1, d);
  const dayIdx = Math.floor((utc - DAY_ANCHOR) / 86400000) % 60;
  const dStem = dayIdx % 10, dBranch = dayIdx % 12;
  let hStem = null, hBranch = null;
  if (hour !== null && hour !== undefined && hour >= 0 && hour <= 23){
    hBranch = Math.floor((hour + 1) / 2) % 12;
    hStem = (dStem * 2 + hBranch) % 10;                       // 五鼠遁
  }
  const counts = {"木":0,"火":0,"土":0,"金":0,"水":0};
  const pillars = [
    {stem:yStem, branch:yBranch}, {stem:mStem, branch:mBranch},
    {stem:dStem, branch:dBranch}
  ];
  if (hStem !== null) pillars.push({stem:hStem, branch:hBranch});
  pillars.forEach(p => { counts[STEM_EL[p.stem]]++; counts[BRANCH_EL[p.branch]]++; });
  const dm = STEM_EL[dStem];
  const support = counts[dm] + counts[GEN[dm]];
  const weak = support * 2 < (hStem !== null ? 8 : 6);        // 简版旺衰判断
  const keMe = ELEMENTS.find(e => KE[e] === dm);
  const fav = weak ? [GEN[dm], dm] : [KE[dm], keMe];
  return {
    pillars, counts, dayMaster: dm, weak, favorable: fav,
    zodiac: ANIMALS[yBranch], zodiacPy: ANIMALS_PY[yBranch],
    yStem, yBranch, dStem, dBranch
  };
}

/* 今日卦与命主的契合度（0-100） */
function fitScore(hex, bazi){
  const fav = bazi.favorable;
  const els = [TRIGRAM_EL[hex.low], TRIGRAM_EL[hex.up]];
  let sum = 0;
  els.forEach(e => {
    let s;
    if (fav.includes(e)) s = 92;                    // 卦五行即喜用神
    else if (fav.includes(GEN[e])) s = 80;          // 卦生喜用
    else if (GEN[fav[0]] === e || GEN[fav[1]] === e) s = 72; // 喜用生卦
    else if (KE[e] === fav[0] || KE[e] === fav[1] || KE[fav[0]] === e || KE[fav[1]] === e) s = 55;
    else s = 68;
    sum += s;
  });
  return Math.round(sum / 2);
}

/* 今日卦五行与日主的关系（取上卦为主） */
function hexToDaymaster(hex, bazi){
  return elementRelation(bazi.dayMaster, TRIGRAM_EL[hex.up]);
}
