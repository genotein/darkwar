const { useState, useEffect } = React;


// ═══════════════════════════════════════════════════════
// 1. 데이터 정의
// ═══════════════════════════════════════════════════════

// 3종 자원
const RESOURCE_TYPES = {
  energy:  { id: "energy",  label: "에너지",  icon: "⚡", color: "#f59e0b", bg: "#fef3c7" },
  knowledge:{ id:"knowledge",label:"지식",    icon: "📘", color: "#3b82f6", bg: "#eff6ff" },
  talent:  { id: "talent",  label: "재능",    icon: "🎵", color: "#a855f7", bg: "#f5f3ff" },
};

// 이벤트 타임 설정
const EVENT_TIMES = [
  { id:"morning_rush", label:"아침 이벤트", start:6, end:8,   mult:2, icon:"🌅", days:"all" },
  { id:"night_bonus",  label:"저녁 이벤트", start:19,end:21,  mult:2, icon:"🌙", days:"all" },
  { id:"weekend_bonus",label:"주말 보너스", start:0, end:24,  mult:1.5, icon:"🎉", days:"weekend" },
];

function getActiveEvent() {
  const now = new Date();
  const hour = now.getHours();
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;
  let best = null;
  for (const ev of EVENT_TIMES) {
    const dayOk = ev.days === "all" || (ev.days === "weekend" && isWeekend);
    const timeOk = hour >= ev.start && hour < ev.end;
    if (dayOk && timeOk) {
      if (!best || ev.mult > best.mult) best = ev;
    }
  }
  return best;
}

// 퀘스트 카테고리 (자원 획득 연결)
const QUEST_GROUPS = {
  morning: {
    label: "아침 루틴", icon: "🌅", color: "#f59e0b", resource: "energy", bonusPts: 20, bonusRes: 5,
    allowedEvents: ["morning_rush", "weekend_bonus"],
    tasks: [
      { id:"wake",      label:"⏰ 6시 기상",           pts:10, res:2 },
      { id:"brush_am",  label:"🦷 양치질",              pts:5,  res:1 },
      { id:"wash",      label:"🚿 세수",                pts:5,  res:1 },
      { id:"lotion",    label:"🧴 로션 바르기",          pts:5,  res:1 },
      { id:"milk",      label:"🥛 우유 한 컵",           pts:10, res:2 },
      { id:"breakfast", label:"🍳 균형 잡힌 아침식사",   pts:15, res:3 },
    ],
  },
  homework: {
    label: "숙제 퀘스트", icon: "📚", color: "#3b82f6", resource: "knowledge", bonusPts: 20, bonusRes: 5,
    allowedEvents: ["night_bonus", "weekend_bonus"],
    tasks: [
      { id:"hw_done",   label:"📝 학교 숙제 완료",       pts:20, res:4 },
      { id:"hw_check",  label:"✅ 숙제 다시 확인",       pts:10, res:2 },
      { id:"bag_ready", label:"🎒 내일 가방 미리 준비",  pts:10, res:2 },
    ],
  },
  study: {
    label: "추가 학습", icon: "🧠", color: "#6366f1", resource: "knowledge", bonusPts: 30, bonusRes: 8,
    allowedEvents: ["night_bonus", "weekend_bonus"],
    tasks: [
      { id:"math",    label:"➕ 수학 20분",  pts:25, res:5 },
      { id:"english", label:"🔤 영어 20분",  pts:25, res:5 },
      { id:"korean",  label:"📖 국어 20분",  pts:25, res:5 },
    ],
  },
  health: {
    label: "건강 퀘스트", icon: "💪", color: "#10b981", resource: "energy", bonusPts: 25, bonusRes: 6,
    allowedEvents: ["morning_rush", "night_bonus", "weekend_bonus"],
    tasks: [
      { id:"exercise", label:"🏃 운동 30분",         pts:20, res:5 },
      { id:"lunch",    label:"🥗 균형 잡힌 점심",    pts:10, res:2 },
      { id:"dinner",   label:"🍽️ 균형 잡힌 저녁",   pts:10, res:2 },
      { id:"sleep",    label:"😴 제시간에 취침",      pts:15, res:3 },
    ],
  },
  music: {
    label: "음악·창의", icon: "🎵", color: "#a855f7", resource: "talent", bonusPts: 20, bonusRes: 6,
    allowedEvents: ["weekend_bonus"],
    tasks: [
      { id:"music_practice", label:"🎹 음악 연습 20분",   pts:20, res:6 },
      { id:"creative",       label:"🎨 창의 활동 10분",   pts:10, res:3 },
    ],
  },
  night: {
    label: "저녁 루틴", icon: "🌙", color: "#64748b", resource: "energy", bonusPts: 15, bonusRes: 4,
    allowedEvents: ["night_bonus", "weekend_bonus"],
    tasks: [
      { id:"brush_pm", label:"🦷 저녁 양치",          pts:5,  res:1 },
      { id:"shower",   label:"🚿 샤워",               pts:10, res:2 },
      { id:"diary",    label:"📓 오늘 하루 돌아보기",  pts:15, res:3 },
    ],
  },
};

// ── 스킬 트리 정의 ──────────────────────────────────────
const SKILL_TREES = {
  life: {
    label:"생활 스킬", icon:"🏠", color:"#f59e0b", resource:"energy",
    levels:[
      { lv:1, name:"루틴 입문",    missions:["아침 루틴 3일 연속 완료","저녁 루틴 3일 연속 완료"],            reward:"⚡+10 보너스" },
      { lv:2, name:"생활 리듬",    missions:["아침 루틴 7일 연속 완료","저녁 루틴 5일 연속 완료"],            reward:"아침 이벤트 타임 +30분 연장" },
      { lv:3, name:"습관의 달인",  missions:["아침+저녁 루틴 14일 연속 완료","다이어리 10회 작성"],           reward:"⚡ 생성량 +20%" },
      { lv:4, name:"자기 관리 전문가",missions:["모든 루틴 21일 연속","수면 미션 20회 달성"],                 reward:"보상 상점 에너지 전환율 +10%" },
      { lv:5, name:"생활의 왕",    missions:["아침+저녁 30일 연속","루틴 완벽 달성 20회"],                    reward:"스페셜 보상 20P 할인" },
    ],
  },
  math: {
    label:"수학 스킬", icon:"➕", color:"#3b82f6", resource:"knowledge",
    levels:[
      { lv:1, name:"수 감각",      missions:["수학 20분 5회 달성","수학 10문제 중 5문제 한 번에 통과 3회"],   reward:"📘+5 보너스" },
      { lv:2, name:"계산력",       missions:["수학 20분 10회 달성","수학 10문제 중 7문제 한 번에 통과 3회"],  reward:"수학 미션 조건 -1문제 완화" },
      { lv:3, name:"논리력",       missions:["수학 20분 20회 달성","수학 10문제 중 9문제 한 번에 통과 2회"],  reward:"📘 생성량 +15%" },
      { lv:4, name:"문제 해결사",  missions:["수학 20분 30회","수학 만점(10/10) 5회"],                         reward:"지식 부스터 1회 획득" },
      { lv:5, name:"수학 영웅",    missions:["수학 20분 50회","수학 만점 10회 달성"],                           reward:"추가 학습 보너스 포인트 +50%" },
    ],
  },
  korean: {
    label:"국어 스킬", icon:"📖", color:"#ec4899", resource:"knowledge",
    levels:[
      { lv:1, name:"독해 입문",    missions:["국어 20분 5회 달성","받아쓰기 10개 중 7개 이상 2회"],           reward:"📘+5 보너스" },
      { lv:2, name:"어휘력",       missions:["국어 20분 10회 달성","일기 5회 작성"],                            reward:"국어 미션 20분→15분 완화" },
      { lv:3, name:"독서가",       missions:["국어 20분 20회 달성","책 1권 완독 2회"],                          reward:"📘 생성량 +15%" },
      { lv:4, name:"표현의 달인",  missions:["국어 20분 30회","창작 글쓰기 5편"],                               reward:"지식 부스터 1회 획득" },
      { lv:5, name:"국어 영웅",    missions:["국어 20분 50회","독서 감상문 10편"],                              reward:"추가 학습 포인트 +50%" },
    ],
  },
  english: {
    label:"영어 스킬", icon:"🔤", color:"#06b6d4", resource:"knowledge",
    levels:[
      { lv:1, name:"알파벳 마스터",missions:["영어 20분 5회 달성","단어 10개 외우기 3회"],                     reward:"📘+5 보너스" },
      { lv:2, name:"문장 조립가",  missions:["영어 20분 10회 달성","영어 문장 5개 만들기 3회"],                reward:"영어 미션 20분→15분 완화" },
      { lv:3, name:"회화 도전자",  missions:["영어 20분 20회 달성","영어로 일기 3회 쓰기"],                    reward:"📘 생성량 +15%" },
      { lv:4, name:"영어 사용자",  missions:["영어 20분 30회","영어 동화책 3권 완독"],                          reward:"지식 부스터 1회 획득" },
      { lv:5, name:"영어 영웅",    missions:["영어 20분 50회","영어 말하기 10분 5회"],                          reward:"추가 학습 포인트 +50%" },
    ],
  },
  fitness: {
    label:"체력 스킬", icon:"🏃", color:"#10b981", resource:"energy",
    levels:[
      { lv:1, name:"활동 시작",    missions:["운동 30분 3회 달성","줄넘기 50개 연속 1회"],                     reward:"⚡+5 보너스" },
      { lv:2, name:"체력 단련",    missions:["운동 30분 7회 달성","줄넘기 100개 연속 1회"],                    reward:"운동 미션 30분→20분 완화" },
      { lv:3, name:"스포츠 파이터",missions:["운동 30분 15회 달성","플랭크 1분 유지 3회"],                     reward:"⚡ 생성량 +15%" },
      { lv:4, name:"체력왕",       missions:["운동 30분 25회","턱걸이 5개 또는 팔굽혀펴기 20개"],              reward:"에너지 부스터 1회 획득" },
      { lv:5, name:"슈퍼 운동선수",missions:["운동 30분 40회","좋아하는 운동 대회 1회 참가"],                  reward:"건강 퀘스트 보너스 +50%" },
    ],
  },
  sport: {
    label:"운동 기술 스킬", icon:"⚽", color:"#f97316", resource:"energy",
    levels:[
      { lv:1, name:"기초 기술",    missions:["특정 운동 기술 연습 3회","운동 기술 동영상 보고 따라하기 2회"],  reward:"⚡+5 보너스" },
      { lv:2, name:"기술 연마",    missions:["특정 운동 기술 연습 7회","친구와 함께 운동 2회"],               reward:"🎵+3 재능 보너스" },
      { lv:3, name:"기술 달인",    missions:["특정 운동 기술 연습 15회","부모님 앞에서 기술 시연 2회"],        reward:"⚡ 생성량 +10%" },
      { lv:4, name:"팀 플레이어",  missions:["팀 스포츠 5회 참여","운동 기술 동생/친구에게 가르치기 1회"],    reward:"에너지 부스터 1회 획득" },
      { lv:5, name:"운동 마스터",  missions:["운동 기술 20회 연습","운동 대회 또는 발표 1회"],                 reward:"건강+운동 포인트 +30%" },
    ],
  },
  music_skill: {
    label:"음악 스킬", icon:"🎵", color:"#a855f7", resource:"talent",
    levels:[
      { lv:1, name:"악기 입문",    missions:["음악 연습 20분 3회 달성","곡 1소절 외워 연주 1회"],             reward:"🎵+5 보너스" },
      { lv:2, name:"리듬 감각",    missions:["음악 연습 20분 7회 달성","곡 1절 완주 1회"],                    reward:"음악 미션 20분→15분 완화" },
      { lv:3, name:"연주자",       missions:["음악 연습 20분 15회 달성","곡 전체 완주 2회"],                  reward:"🎵 생성량 +15%" },
      { lv:4, name:"음악 표현가",  missions:["음악 연습 20분 25회","가족 앞에서 연주 1회"],                   reward:"재능 부스터 1회 획득" },
      { lv:5, name:"음악 영웅",    missions:["음악 연습 20분 40회","발표회 또는 녹음 1회"],                   reward:"재능 퀘스트 포인트 +50%" },
    ],
  },
  nutrition: {
    label:"5대 영양소 스킬", icon:"🥗", color:"#84cc16", resource:"energy",
    levels:[
      { lv:1, name:"영양 인식",    missions:["균형 식사 5회 달성","5대 영양소 이름 외우기 1회"],              reward:"⚡+5 보너스" },
      { lv:2, name:"식단 탐험가",  missions:["균형 식사 10회 달성","채소 3가지 이상 먹기 5회"],              reward:"식사 미션 포인트 +30%" },
      { lv:3, name:"건강 식습관",  missions:["균형 식사 20회 달성","인스턴트 거부 5회"],                      reward:"⚡ 생성량 +10%" },
      { lv:4, name:"영양 전문가",  missions:["균형 식사 30회","직접 음식 준비 참여 3회"],                     reward:"에너지 부스터 1회 획득" },
      { lv:5, name:"건강의 왕",    missions:["균형 식사 50회","영양 일지 2주 기록"],                           reward:"건강 퀘스트 보너스 +50%" },
    ],
  },
};

// 주간 스킬 레벨 캡 (주당 최대 올릴 수 있는 총 레벨)
const WEEKLY_SKILL_CAP = 3;

// ── 생존전비 스타일 보상 (1/2/3단계) ──────────────────
const REWARD_TIERS = [
  {
    tier: 1, label: "1단계 보상", icon: "🥉", color: "#94a3b8",
    desc: "소소한 즐거움",
    rewards: [
      { id:"yt30",     label:"유튜브 30분",       pts:30, res:{ energy:0,knowledge:0,talent:0 } },
      { id:"yt60",     label:"유튜브 1시간",       pts:55, res:{ energy:0,knowledge:0,talent:0 } },
      { id:"game30",   label:"컴퓨터 게임 30분",  pts:40, res:{ energy:0,knowledge:0,talent:0 } },
      { id:"nintendo30",label:"닌텐도 30분",       pts:40, res:{ energy:0,knowledge:0,talent:0 } },
    ],
  },
  {
    tier: 2, label: "2단계 보상", icon: "🥈", color: "#fbbf24",
    desc: "조금 더 특별한 보상",
    rewards: [
      { id:"game60",   label:"컴퓨터 게임 1시간", pts:70, res:{ energy:0,knowledge:0,talent:0 } },
      { id:"nintendo60",label:"닌텐도 1시간",      pts:70, res:{ energy:0,knowledge:0,talent:0 } },
      { id:"boardgame",label:"보드게임 한 판",     pts:50, res:{ energy:0,knowledge:0,talent:0 } },
      { id:"together", label:"같이 하고 싶은 것",  pts:60, res:{ energy:0,knowledge:0,talent:0 } },
    ],
  },
  {
    tier: 3, label: "3단계 보상", icon: "🥇", color: "#f97316",
    desc: "최고의 특별 보상",
    rewards: [
      { id:"trip",     label:"가족 나들이 선택권",  pts:0,  res:{ energy:50,knowledge:50,talent:50 } },
      { id:"bigbuy",   label:"원하는 것 구매 (협의)",pts:0, res:{ energy:80,knowledge:80,talent:80 } },
      { id:"special",  label:"✨ 스페셜 이벤트",    pts:0,  res:{ energy:60,knowledge:60,talent:30 } },
    ],
  },
];

// ── 일일 보상 게이지 설정 ──────────────────────────────
const DAILY_REWARD_TIERS = [
  {
    tier: 1,
    label: "1단계",
    requiredPts: 30,
    color: "#94a3b8",
    glow: "#64748b",
    mult: 1,
    items: [
      { id:"r_yt30",    label:"유튜브 30분",       icon:"📺" },
      { id:"r_game30",  label:"컴퓨터 게임 30분",  icon:"💻" },
      { id:"r_nd30",    label:"닌텐도 30분",        icon:"🎮" },
      { id:"r_entv30",  label:"영어 TV 30분",       icon:"🇺🇸" },
      { id:"r_krtv30",  label:"한국어 TV 30분",     icon:"📡" },
      { id:"r_board",   label:"보드게임 1판",       icon:"🎲" },
    ],
  },
  {
    tier: 2,
    label: "2단계",
    requiredPts: 70,
    color: "#fbbf24",
    glow: "#f59e0b",
    mult: 2,
    items: [
      { id:"r_yt30",    label:"유튜브 30분",       icon:"📺" },
      { id:"r_game30",  label:"컴퓨터 게임 30분",  icon:"💻" },
      { id:"r_nd30",    label:"닌텐도 30분",        icon:"🎮" },
      { id:"r_entv30",  label:"영어 TV 30분",       icon:"🇺🇸" },
      { id:"r_krtv30",  label:"한국어 TV 30분",     icon:"📡" },
      { id:"r_board",   label:"보드게임 1판",       icon:"🎲" },
    ],
  },
  {
    tier: 3,
    label: "3단계",
    requiredPts: 120,
    color: "#f97316",
    glow: "#ea580c",
    mult: 3,
    items: [
      { id:"r_yt30",    label:"유튜브 30분",       icon:"📺" },
      { id:"r_game30",  label:"컴퓨터 게임 30분",  icon:"💻" },
      { id:"r_nd30",    label:"닌텐도 30분",        icon:"🎮" },
      { id:"r_entv30",  label:"영어 TV 30분",       icon:"🇺🇸" },
      { id:"r_krtv30",  label:"한국어 TV 30분",     icon:"📡" },
      { id:"r_board",   label:"보드게임 1판",       icon:"🎲" },
    ],
  },
];

// 랜덤 3개 뽑기 (중복 허용)
function pickRandomRewards(tierItems, count) {
  const picks = [];
  for (let i = 0; i < count; i++) {
    picks.push(tierItems[Math.floor(Math.random() * tierItems.length)]);
  }
  return picks;
}


// ── 업그레이드 (자원 소비) ─────────────────────────────
const UPGRADES = {
  rewards: [
    { id:"upg_yt_30to45",   label:"유튜브 30분 → 45분",         cost:{ energy:30,knowledge:0,talent:0 }, applied:false },
    { id:"upg_yt_45to60",   label:"유튜브 45분 → 60분",         cost:{ energy:50,knowledge:0,talent:0 }, applied:false },
    { id:"upg_game_30to45", label:"게임 30분 → 45분",           cost:{ energy:20,knowledge:10,talent:0 }, applied:false },
    { id:"upg_game_45to60", label:"게임 45분 → 60분",           cost:{ energy:40,knowledge:20,talent:0 }, applied:false },
    { id:"upg_nintendo_45", label:"닌텐도 30분 → 45분",         cost:{ energy:20,knowledge:0,talent:10 }, applied:false },
  ],
  boost: [
    { id:"upg_math_ease",   label:"수학 미션 -1문제 완화 (1주)", cost:{ energy:0, knowledge:30,talent:0 }, weekly:true },
    { id:"upg_eng_ease",    label:"영어 미션 15분으로 완화 (1주)",cost:{ energy:0, knowledge:25,talent:0 }, weekly:true },
    { id:"upg_music_ease",  label:"음악 미션 15분으로 완화 (1주)",cost:{ energy:0, knowledge:0, talent:25 }, weekly:true },
    { id:"upg_2x_extend",   label:"이벤트 타임 30분 연장 (1회)", cost:{ energy:30,knowledge:0, talent:0 }, weekly:true },
  ],
};

// ─── GitHub API 동기화 ──────────────────────────────────
// 설정: 관리자 모드에서 입력하거나 아래 직접 기재
const GH_CONFIG_KEY = "dw_github_config";

function loadGhConfig() {
  try { const c = localStorage.getItem(GH_CONFIG_KEY); if (c) return JSON.parse(c); } catch {}
  return { token:"", owner:"", repo:"", issueNumber:1 };
}

async function ghFetch(cfg, method, body) {
  const { token, owner, repo, issueNumber } = cfg;
  if (!token || !owner || !repo) throw new Error("GitHub 설정 없음");
  const url = `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`;
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github+json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`GitHub API 오류: ${res.status}`);
  return res.json();
}

async function loadFromGitHub(ghCfg) {
  const issue = await ghFetch(ghCfg, "GET");
  const body = issue.body || "";
  const match = body.match(/```json\n([\s\S]*?)\n```/);
  if (!match) return null;
  return JSON.parse(match[1]);
}

async function saveToGitHub(ghCfg, data) {
  const json = JSON.stringify(data, null, 2);
  const body = `<!-- 다크워 생존 일지 데이터 저장소 -->\n\`\`\`json\n${json}\n\`\`\``;
  await ghFetch(ghCfg, "PATCH", { body });
}

// ─── localStorage 키 ────────────────────────────────────
const KEY = "dw_advanced_v1";

function todayStr() { return new Date().toISOString().slice(0,10); }
function weekStr() {
  const d = new Date(), day = d.getDay();
  const diff = d.getDate() - day + (day===0?-6:1);
  return new Date(new Date().setDate(diff)).toISOString().slice(0,10);
}

function initState() {
  return {
    points: 0,
    resources: { energy:0, knowledge:0, talent:0 },
    completedByDay: {},
    skillLevels: {},
    skillProgress: {},
    weeklySkillUps: {},
    upgrades: {},
    weeklyBoosts: {},
    totalPts: 0,
    history: [],
    rewardInventory: {},
    dailyGaugePts: 0,           // 오늘의 게이지 포인트 (매일 리셋)
    dailyGaugeDate: "",         // 마지막 게이지 날짜
    dailyTiersCleared: [],      // 오늘 클리어한 단계 [1,2,3]
    inventory: {},              // { "r_yt30": 3, "r_game30": 1 }
  };
}

// ═══════════════════════════════════════════════════════
// 2. 메인 앱
// ═══════════════════════════════════════════════════════

const ADMIN_PW = "1234"; // ← 비밀번호 여기서 변경

function App() {
  // GitHub 설정
  const [ghCfg, setGhCfg] = useState(loadGhConfig);
  const [syncStatus, setSyncStatus] = useState("idle"); // idle | loading | saving | ok | error
  const [syncMsg, setSyncMsg] = useState("");

  // 앱 데이터
  const [state, setState] = useState(() => {
    try { const s = localStorage.getItem(KEY); if (s) return JSON.parse(s); } catch {}
    return initState();
  });
  const [tab, setTab] = useState("daily");
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [openSkill, setOpenSkill] = useState(null);
  const [openGroup, setOpenGroup] = useState(null);

  // ── 관리자 모드 상태 ──
  const [adminMode, setAdminMode] = useState(false);
  const [adminPwInput, setAdminPwInput] = useState("");
  const [adminPwError, setAdminPwError] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  // 앱 설정
  const CFG_KEY = "dw_config_v1";
  const [cfg, setCfg] = useState(() => {
    try {
      const c = localStorage.getItem(CFG_KEY);
      if (c) return JSON.parse(c);
    } catch {}
    return {
      questGroups: JSON.parse(JSON.stringify(QUEST_GROUPS)),
      eventTimes: JSON.parse(JSON.stringify(EVENT_TIMES)),
      rewardTiers: JSON.parse(JSON.stringify(REWARD_TIERS)),
      weeklySkillCap: WEEKLY_SKILL_CAP,
      skillTrees: JSON.parse(JSON.stringify(SKILL_TREES)),
    };
  });

  // ── localStorage 캐시 (오프라인 백업용) ──
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  useEffect(() => {
    try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch {}
  }, [cfg]);

  // ── GitHub에서 초기 로딩 ──
  useEffect(() => {
    if (!ghCfg.token || !ghCfg.owner || !ghCfg.repo) return;
    setSyncStatus("loading");
    setSyncMsg("GitHub에서 데이터 불러오는 중...");
    loadFromGitHub(ghCfg).then(data => {
      if (data) {
        if (data.state) setState(data.state);
        if (data.cfg)   setCfg(data.cfg);
        setSyncStatus("ok");
        setSyncMsg("동기화 완료 ✅");
      } else {
        setSyncStatus("ok");
        setSyncMsg("새 데이터로 시작해요");
      }
    }).catch(err => {
      setSyncStatus("error");
      setSyncMsg("불러오기 실패: " + err.message);
    });
  }, [ghCfg.token, ghCfg.owner, ghCfg.repo, ghCfg.issueNumber]);

  // ── GitHub에 자동 저장 (state/cfg 변경 후 2초 디바운스) ──
  useEffect(() => {
    if (!ghCfg.token || !ghCfg.owner || !ghCfg.repo) return;
    if (syncStatus === "loading") return;
    const timer = setTimeout(() => {
      setSyncStatus("saving");
      setSyncMsg("저장 중...");
      saveToGitHub(ghCfg, { state, cfg }).then(() => {
        setSyncStatus("ok");
        setSyncMsg("저장됨 ✅ " + new Date().toLocaleTimeString("ko-KR"));
      }).catch(err => {
        setSyncStatus("error");
        setSyncMsg("저장 실패: " + err.message);
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, [state, cfg]);

  function saveGhCfg(next) {
    setGhCfg(next);
    try { localStorage.setItem(GH_CONFIG_KEY, JSON.stringify(next)); } catch {}
  }

  function updateCfg(path, value) {
    setCfg(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split(".");
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  }

  function adminLogin() {
    if (adminPwInput === ADMIN_PW) {
      setAdminMode(true);
      setShowAdminLogin(false);
      setAdminPwInput("");
      setAdminPwError(false);
    } else {
      setAdminPwError(true);
      setAdminPwInput("");
    }
  }

  const today = todayStr();
  const week  = weekStr();

  // cfg 기반으로 동적 계산
  const activeEventTimes = cfg.eventTimes;
  function getActiveEventFromCfg() {
    const now = new Date();
    const hour = now.getHours();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    let best = null;
    for (const ev of activeEventTimes) {
      const dayOk = ev.days === "all" || (ev.days === "weekend" && isWeekend);
      const timeOk = hour >= ev.start && hour < ev.end;
      if (dayOk && timeOk) {
        if (!best || ev.mult > best.mult) best = ev;
      }
    }
    return best;
  }
  const activeEvent = getActiveEventFromCfg();
  // ── 날짜 자동 갱신 ──
  useEffect(() => {
    const lastDate = state.dailyGaugeDate || state.lastActiveDate || "";
    if (lastDate && lastDate !== today) {
      // 날짜가 바뀌었으면 일일 게이지 리셋
      setState(s => ({
        ...s,
        dailyGaugePts: 0,
        dailyGaugeDate: today,
        dailyTiersCleared: [],
        lastActiveDate: today,
      }));
    } else if (!lastDate) {
      setState(s => ({ ...s, lastActiveDate: today }));
    }
  }, [today]);
  const completed = state.completedByDay[today] || [];

  function showToast(msg, type="success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }

  // 오늘 모든 태스크 목록 (cfg 기반)
  const allTasks = Object.values(cfg.questGroups).flatMap(g => g.tasks);

  // 포인트 배율 — 카테고리별 허용 이벤트만 적용
  function getMultiplierForGroup(groupKey) {
    const group = cfg.questGroups[groupKey];
    const allowed = group.allowedEvents || [];
    if (!activeEvent) return 1;
    if (!allowed.includes(activeEvent.id)) return 1;
    return activeEvent.mult;
  }

  // 태스크 토글
  function toggleTask(groupKey, taskId, pts, res, resource) {
    const already = completed.includes(taskId);
    const mult = already ? 1 : getMultiplierForGroup(groupKey);
    const earnedPts = Math.round(pts * mult);
    const earnedRes = Math.round(res * mult);
    const diff = already ? -pts : earnedPts;
    const resDiff = already ? -res : earnedRes;

    const group = cfg.questGroups[groupKey];
    const newCompleted = already
      ? completed.filter(x => x !== taskId)
      : [...completed, taskId];

    // 카테고리 완료 보너스 체크
    let bonusPts = 0, bonusRes = 0;
    if (!already) {
      const allGroupDone = group.tasks.every(t => newCompleted.includes(t.id));
      const wasDone = group.tasks.every(t => completed.includes(t.id));
      if (allGroupDone && !wasDone) {
        bonusPts = group.bonusPts;
        bonusRes = group.bonusRes;
        setTimeout(() => showToast(`🎉 ${group.label} 완전 클리어! +${bonusPts}P +${bonusRes}${RESOURCE_TYPES[resource].icon}`, "bonus"), 300);
      }
    }

        setState(s => {
      // ── 기존 포인트/자원 처리 ──
      const newPoints = Math.max(0, s.points + diff + bonusPts);
      const newTotalPts = Math.max(0, s.totalPts + diff + bonusPts);
      const newResources = {
        ...s.resources,
        [resource]: Math.max(0, (s.resources[resource]||0) + resDiff + bonusRes),
      };
      const newCompleted2 = already
        ? completed.filter(x => x !== taskId)
        : [...completed, taskId];

      // ── 일일 게이지 처리 ──
      const gaugeDate = s.dailyGaugeDate || "";
      const isNewDay = gaugeDate !== today;
      const prevGaugePts = isNewDay ? 0 : (s.dailyGaugePts || 0);
      const prevCleared = isNewDay ? [] : (s.dailyTiersCleared || []);

      const earnedGauge = already ? 0 : Math.round(pts * mult);
      const newGaugePts = already
        ? Math.max(0, prevGaugePts - pts)
        : prevGaugePts + earnedGauge;

      // 새로 클리어된 단계 확인 + 인벤토리에 보상 추가
      let newInventory = { ...(s.inventory||{}) };
      let newCleared = [...prevCleared];
      let newlyCleared = [];

      DAILY_REWARD_TIERS.forEach(tier => {
        const wasCleared = prevCleared.includes(tier.tier);
        const nowCleared = newGaugePts >= tier.requiredPts;
        if (!wasCleared && nowCleared) {
          newCleared.push(tier.tier);
          newlyCleared.push(tier);
          // 랜덤 보상 3개 × 단계 배수 뽑아서 인벤토리에 추가
          const picks = pickRandomRewards(tier.items, 3 * tier.mult);
          picks.forEach(item => {
            newInventory[item.id] = (newInventory[item.id]||0) + 1;
          });
        }
      });

      // 클리어 알림 (타임아웃으로 토스트)
      if (newlyCleared.length > 0) {
        newlyCleared.forEach(tier => {
          setTimeout(() => showToast(
            `🎉 ${tier.label} 달성! 보상 ${3*tier.mult}개 획득!`, "bonus"
          ), 400);
        });
      }

      return {
        ...s,
        points: newPoints,
        totalPts: newTotalPts,
        resources: newResources,
        completedByDay: { ...s.completedByDay, [today]: newCompleted2 },
        history: already ? s.history : [...s.history,
          { date:today, taskId, pts:earnedPts, res:earnedRes, resource, mult }],
        dailyGaugePts: newGaugePts,
        dailyGaugeDate: today,
        dailyTiersCleared: newCleared,
        inventory: newInventory,
      };
    });


    if (!already) showToast(`+${earnedPts}P  +${earnedRes}${RESOURCE_TYPES[resource].icon}${mult>1? ` ×${mult}!`:""}`, "success");
  }

  // 스킬 미션 토글
  function toggleSkillMission(skillKey, levelIdx, missionIdx) {
    const skill = cfg.skillTrees[skillKey];
    const currentLv = state.skillLevels[skillKey] || 0;
    if (levelIdx !== currentLv) return; // 현재 레벨 미션만 진행 가능

    const progressKey = `${skillKey}_${levelIdx}`;
    const prev = state.skillProgress[progressKey] || skill.levels[levelIdx].missions.map(()=>false);
    const updated = prev.map((v,i) => i===missionIdx ? !v : v);

    // 레벨업 체크
    const canLevelUp = updated.every(Boolean);
    const weekUps = state.weeklySkillUps[week] || 0;
    const skillCap = cfg.weeklySkillCap;

    setState(s => {
      const newProgress = { ...s.skillProgress, [progressKey]: updated };
      let newLevels = { ...s.skillLevels };
      let newWeeklyUps = { ...s.weeklySkillUps };
      let resBonus = {};

      if (canLevelUp && weekUps < skillCap) {
        newLevels[skillKey] = levelIdx + 1;
        newWeeklyUps[week] = (weekUps||0) + 1;
        resBonus[skill.resource] = (s.resources[skill.resource]||0) + 20;
        setTimeout(() => showToast(`🌟 ${skill.label} Lv.${levelIdx+2} 달성! ⚡+20`, "levelup"), 200);
      } else if (canLevelUp && weekUps >= skillCap) {
        setTimeout(() => showToast(`이번 주 스킬 업 한도(${skillCap}회) 도달! 다음 주에 계속하세요`, "warn"), 200);
      }

      return {
        ...s,
        skillProgress: newProgress,
        skillLevels: newLevels,
        weeklySkillUps: newWeeklyUps,
        resources: resBonus[skill.resource] !== undefined
          ? { ...s.resources, [skill.resource]: resBonus[skill.resource] }
          : s.resources,
      };
    });
  }

  // 업그레이드 구매
  function buyUpgrade(upg, type) {
    const cost = upg.cost;
    const canAfford = Object.entries(cost).every(([r,v]) => (state.resources[r]||0) >= v);
    if (!canAfford) { showToast("자원이 부족해요 😢", "error"); return; }
    setModal({ type:"upgrade", upg, upType:type });
  }

  function confirmUpgrade() {
    const { upg, upType } = modal;
    setState(s => {
      const newRes = { ...s.resources };
      Object.entries(upg.cost).forEach(([r,v]) => { newRes[r] = Math.max(0,(newRes[r]||0)-v); });
      if (upType === "rewards") {
        return { ...s, resources:newRes, upgrades:{ ...s.upgrades, [upg.id]:true } };
      } else {
        const weekBoosts = s.weeklyBoosts[week] || [];
        return { ...s, resources:newRes, weeklyBoosts:{ ...s.weeklyBoosts, [week]:[...weekBoosts, upg.id] } };
      }
    });
    setModal(null);
    showToast(`✅ ${upg.label} 업그레이드 완료!`, "success");
  }

  // 보상 교환
  function redeemReward(reward, tier) {
    if (tier < 3) {
      if (state.points < reward.pts) { showToast("포인트 부족 😢","error"); return; }
      setModal({ type:"redeem", reward, tier });
    } else {
      const resReq = reward.res;
      const canAfford = Object.entries(resReq).every(([r,v]) => (state.resources[r]||0) >= v);
      if (!canAfford) { showToast("자원이 부족해요 😢","error"); return; }
      setModal({ type:"redeem", reward, tier });
    }
  }

  function confirmRedeem() {
    const { reward, tier } = modal;
    setState(s => {
      const newInv = { ...s.rewardInventory, [reward.id]: ((s.rewardInventory||{})[reward.id]||0) + 1 };
      if (tier < 3) {
        return { ...s, points: s.points - reward.pts, rewardInventory: newInv };
      } else {
        const newRes = { ...s.resources };
        Object.entries(reward.res).forEach(([r,v]) => { newRes[r]=Math.max(0,(newRes[r]||0)-v); });
        return { ...s, resources:newRes, rewardInventory: newInv };
      }
    });
    setModal(null);
    showToast(`🎉 ${reward.label} 보상 사용!`, "special");
  }

  // ── 오늘 통계 ──
  const todayPts = completed.reduce((sum,id)=>{
    const t=allTasks.find(x=>x.id===id); return sum+(t?t.pts:0);
  },0);
  const todayMax = allTasks.reduce((s,t)=>s+t.pts,0);
  const todayPct = todayMax ? Math.round(todayPts/todayMax*100) : 0;

  const weekUpsLeft = cfg.weeklySkillCap - (state.weeklySkillUps[week]||0);

  // ── 렌더 ──────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:"#080f1a", color:"#f1f5f9",
                  fontFamily:"'Segoe UI',system-ui,sans-serif", overflowX:"hidden" }}>

      {/* ── 헤더 ── */}
      <Header state={state} todayPct={todayPct} todayPts={todayPts}
              todayMax={todayMax} activeEvent={activeEvent}
              onAdminClick={()=>adminMode?setAdminMode(false):setShowAdminLogin(true)}
              adminMode={adminMode} />

      {/* ── 동기화 상태 바 ── */}
      {ghCfg.token && ghCfg.owner && ghCfg.repo && (
        <div style={{
          background: syncStatus==="error" ? "#2d0a0a"
                    : syncStatus==="saving" ? "#0a1a2e"
                    : syncStatus==="loading" ? "#0a1a2e"
                    : "#0a1a0a",
          borderBottom: `1px solid ${syncStatus==="error"?"#7f1d1d":syncStatus==="ok"?"#14532d":"#1e3a5f"}`,
          padding:"4px 14px", display:"flex", alignItems:"center", gap:8,
        }}>
          <span style={{ fontSize:10 }}>
            {syncStatus==="loading"?"⏳":syncStatus==="saving"?"💾":syncStatus==="error"?"❌":"✅"}
          </span>
          <span style={{ fontSize:10, color: syncStatus==="error"?"#f87171":syncStatus==="ok"?"#34d399":"#60a5fa" }}>
            {syncMsg || "GitHub 연동됨"}
          </span>
        </div>
      )}
      {!ghCfg.token && (
        <div style={{ background:"#1a1000", borderBottom:"1px solid #78350f",
                      padding:"4px 14px", display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:10 }}>⚠️</span>
          <span style={{ fontSize:10, color:"#fbbf24" }}>
            GitHub 미연동 — 관리자 → GitHub 설정에서 연결하세요
          </span>
        </div>
      )}

      {/* ── 자원 바 ── */}
      <ResourceBar resources={state.resources} />

      {/* ── 이벤트 타임라인 (상시 표시) ── */}
      <EventTimeline activeEvent={activeEvent} eventTimes={cfg.eventTimes} />

      {/* ── 탭 ── */}
      <div style={{ maxWidth:560,margin:"0 auto",padding:"6px 14px 0" }}>
        <div style={{ display:"flex", gap:4 }}>
          {[
            ["daily","📅 오늘"],
            ["skills","🌳 스킬"],
            ["reward","🎁 보상"],
            ["bag","🎒 주머니"],
            ["upgrade","⚙️ 업그레이드"],
            ...(adminMode ? [["admin","🔧 관리자"]] : []),
          ].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} style={{
              flex:1, padding:"8px 2px", fontSize:11, fontWeight:700,
              borderRadius:8, border:"none", cursor:"pointer",
              background: tab===k ? (k==="admin"?"#dc2626":"#f59e0b") : (k==="admin"?"#2d0a0a":"#1e293b"),
              color: tab===k?"#0f172a": (k==="admin"?"#f87171":"#94a3b8"),
              transition:"all 0.2s",
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* ── 탭 콘텐츠 ── */}
      <div style={{ maxWidth:560, margin:"0 auto", padding:"8px 14px 80px" }}>

        {/* ── 오늘 퀘스트 ── */}
        {tab==="daily" && (
          <div>
            {Object.entries(cfg.questGroups).map(([gKey, group])=>{
              const res = RESOURCE_TYPES[group.resource];
              const doneCount = group.tasks.filter(t=>completed.includes(t.id)).length;
              const allDone = doneCount === group.tasks.length;
              const isOpen = openGroup === gKey;
              return (
                <div key={gKey} style={{ marginTop:10 }}>
                  {/* 그룹 헤더 */}
                  <button onClick={()=>setOpenGroup(isOpen?null:gKey)}
                    style={{ width:"100%", display:"flex", alignItems:"center", gap:10,
                             padding:"12px 14px", borderRadius:12, border:"none", cursor:"pointer",
                             background: allDone?"#1a2e1a":"#131e30",
                             borderLeft:`3px solid ${group.color}`, textAlign:"left" }}>
                    <span style={{ fontSize:18 }}>{group.icon}</span>
                    <span style={{ flex:1, fontWeight:800, color:"#f1f5f9", fontSize:14 }}>{group.label}</span>
                    <span style={{ fontSize:11, color:res.color, fontWeight:700 }}>
                      +{group.bonusPts}P 보너스 {doneCount}/{group.tasks.length}
                    </span>
                    <span style={{ fontSize:10, color:"#64748b" }}>{isOpen?"▲":"▼"}</span>
                  </button>

                  {/* 세부 태스크 */}
                  {isOpen && (
                    <div style={{ paddingLeft:8, marginTop:4, display:"flex", flexDirection:"column", gap:5 }}>
                      {group.tasks.map(task=>{
                        const done = completed.includes(task.id);
                        const mult = !done ? getMultiplierForGroup(gKey) : 1;
                        const allowed = group.allowedEvents || [];

                        // 이 카테고리에 허용된 이벤트만 뱃지로 표시
                        const isWeekend = new Date().getDay()===0||new Date().getDay()===6;
                        const applicableEvents = cfg.eventTimes.filter(ev=>
                          allowed.includes(ev.id) &&
                          (ev.days==="all" || (ev.days==="weekend" && isWeekend))
                        );

                        return (
                          <button key={task.id} onClick={()=>toggleTask(gKey,task.id,task.pts,task.res,group.resource)}
                            style={{ display:"flex", alignItems:"center", gap:10,
                                     padding:"10px 12px", borderRadius:9,
                                     border:`1px solid ${done?group.color+"60":"#1e293b"}`,
                                     background: done?group.color+"15":"#131e30",
                                     cursor:"pointer", textAlign:"left" }}>
                            <div style={{ width:20,height:20,borderRadius:5,flexShrink:0,
                                          border:`2px solid ${done?group.color:"#334155"}`,
                                          background:done?group.color:"transparent",
                                          display:"flex",alignItems:"center",justifyContent:"center",
                                          fontSize:11,color:"#0f172a",fontWeight:900 }}>
                              {done?"✓":""}
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <span style={{ fontSize:13, color:done?"#64748b":"#f1f5f9",
                                             textDecoration:done?"line-through":"none" }}>
                                {task.label}
                              </span>
                              {/* 이벤트 타임 뱃지 */}
                              {!done && (
                                <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginTop:4 }}>
                                  {applicableEvents.map(ev=>{
                                    const now = new Date().getHours();
                                    const isActive = now>=ev.start && now<ev.end;
                                    return (
                                      <span key={ev.id} style={{
                                        fontSize:10, fontWeight:700, padding:"2px 6px",
                                        borderRadius:99,
                                        background: isActive
                                          ? "linear-gradient(90deg,#7c3aed,#2563eb)"
                                          : "#1e293b",
                                        color: isActive ? "#fde68a" : "#64748b",
                                        border: isActive ? "none" : "1px solid #334155",
                                      }}>
                                        {ev.icon} {ev.start}~{ev.end}시 ×{ev.mult}
                                        {isActive ? " 진행중!" : ""}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                            <div style={{ textAlign:"right", flexShrink:0 }}>
                              <div style={{ fontSize:12, fontWeight:800,
                                            color: mult>1?"#fde68a":done?"#475569":"#fbbf24" }}>
                                +{Math.round(task.pts*mult)}P{mult>1?` ×${mult}`:""}
                              </div>
                              <div style={{ fontSize:10, color:res.color }}>
                                +{Math.round(task.res*mult)}{res.icon}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                      {/* 카테고리 완료 보너스 표시 */}
                      <div style={{ padding:"8px 12px", borderRadius:8,
                                    background:"#0f172a", border:"1px dashed #334155",
                                    fontSize:11, color:"#64748b", textAlign:"center" }}>
                        {allDone
                          ? `✅ 카테고리 완료! +${group.bonusPts}P +${group.bonusRes}${res.icon} 획득됨`
                          : `📦 전체 완료 보너스: +${group.bonusPts}P +${group.bonusRes}${res.icon}`}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── 스킬 트리 탭 ── */}
        {tab==="skills" && (
          <div>
            <div style={{ padding:"10px 0 6px", fontSize:12, color:"#94a3b8" }}>
              이번 주 스킬 업 가능: <span style={{ color:"#fbbf24", fontWeight:800 }}>{weekUpsLeft}회</span> / {cfg.weeklySkillCap}회 남음
            </div>
            {Object.entries(cfg.skillTrees).map(([sKey, skill])=>{
              const curLv = state.skillLevels[sKey] || 0;
              const maxLv = skill.levels.length;
              const res = RESOURCE_TYPES[skill.resource];
              const isOpen = openSkill === sKey;
              return (
                <div key={sKey} style={{ marginTop:10 }}>
                  <button onClick={()=>setOpenSkill(isOpen?null:sKey)}
                    style={{ width:"100%", display:"flex", alignItems:"center", gap:10,
                             padding:"12px 14px", borderRadius:12, border:"none", cursor:"pointer",
                             background:"#131e30", borderLeft:`3px solid ${skill.color}`,
                             textAlign:"left" }}>
                    <span style={{ fontSize:20 }}>{skill.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:800, color:"#f1f5f9", fontSize:14 }}>{skill.label}</div>
                      <div style={{ fontSize:11, color:"#64748b" }}>Lv.{curLv} / {maxLv}</div>
                    </div>
                    {/* 레벨 별 */}
                    <div style={{ display:"flex", gap:3 }}>
                      {skill.levels.map((_,i)=>(
                        <div key={i} style={{ width:8,height:8,borderRadius:99,
                                              background:i<curLv?skill.color:"#1e293b",
                                              border:`1px solid ${i<curLv?skill.color:"#334155"}` }}/>
                      ))}
                    </div>
                    <span style={{ fontSize:10, color:"#64748b" }}>{isOpen?"▲":"▼"}</span>
                  </button>

                  {isOpen && (
                    <div style={{ paddingLeft:8, marginTop:4 }}>
                      {skill.levels.map((lv, lvIdx)=>{
                        const isCurrentLv = lvIdx === curLv;
                        const isDoneLv = lvIdx < curLv;
                        const progressKey = `${sKey}_${lvIdx}`;
                        const missionProg = state.skillProgress[progressKey] || lv.missions.map(()=>false);
                        return (
                          <div key={lvIdx} style={{ marginBottom:8, padding:"12px 12px",
                                                    borderRadius:10, background: isDoneLv?"#0d1a0d":isCurrentLv?"#131e30":"#0b1120",
                                                    border:`1px solid ${isDoneLv?skill.color+"50":isCurrentLv?skill.color+"30":"#1a2233"}`,
                                                    opacity: isDoneLv||isCurrentLv?1:0.45 }}>
                            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8 }}>
                              <span style={{ fontSize:14,fontWeight:900,color:isDoneLv?"#34d399":isCurrentLv?skill.color:"#334155" }}>
                                {isDoneLv?"✅":isCurrentLv?"▶":"🔒"} Lv.{lvIdx+1}
                              </span>
                              <span style={{ fontSize:13,fontWeight:800,color:isDoneLv?"#94a3b8":"#f1f5f9" }}>{lv.name}</span>
                              <span style={{ marginLeft:"auto",fontSize:10,color:"#64748b" }}>보상: {lv.reward}</span>
                            </div>
                            {lv.missions.map((m, mIdx)=>(
                              <button key={mIdx}
                                onClick={()=>isCurrentLv&&toggleSkillMission(sKey,lvIdx,mIdx)}
                                disabled={!isCurrentLv}
                                style={{ display:"flex",alignItems:"center",gap:8,
                                         width:"100%",padding:"7px 8px",marginBottom:4,
                                         borderRadius:7, border:"none", cursor:isCurrentLv?"pointer":"default",
                                         background: missionProg[mIdx]?"#1a2e1a":"#0f172a", textAlign:"left" }}>
                                <div style={{ width:16,height:16,borderRadius:4,flexShrink:0,
                                              border:`2px solid ${missionProg[mIdx]?skill.color:"#334155"}`,
                                              background:missionProg[mIdx]?skill.color:"transparent",
                                              display:"flex",alignItems:"center",justifyContent:"center",
                                              fontSize:9,color:"#0f172a",fontWeight:900 }}>
                                  {missionProg[mIdx]?"✓":""}
                                </div>
                                <span style={{ fontSize:12, color:missionProg[mIdx]?"#64748b":"#cbd5e1",
                                               textDecoration:missionProg[mIdx]?"line-through":"none" }}>{m}</span>
                              </button>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── 보상 탭 ── */}
        {tab==="reward" && (
          <div style={{ paddingBottom:80 }}>
            <DailyRewardGauge state={state} today={today} />
          </div>
        )}

        {/* ── 주머니(인벤토리) 탭 ── */}
        {tab==="bag" && (
          <div style={{ paddingBottom:80 }}>
            <InventoryPanel state={state} setState={setState} showToast={showToast} />
          </div>
        )}

        {/* ── 업그레이드 탭 ── */}
        {tab==="upgrade" && (
          <div>
            <div style={{ marginTop:10,fontSize:12,color:"#64748b",marginBottom:12 }}>
              자원을 소비해 보상을 강화하거나 미션 조건을 완화할 수 있어요.
            </div>

            <div style={{ fontSize:13,fontWeight:800,color:"#f59e0b",marginBottom:8 }}>
              🏅 보상 강화 업그레이드 (영구)
            </div>
            {UPGRADES.rewards.map(upg=>{
              const bought = state.upgrades[upg.id];
              const canAfford = !bought && Object.entries(upg.cost).every(([r,v])=>(state.resources[r]||0)>=v);
              const costLabel = Object.entries(upg.cost).filter(([,v])=>v>0)
                .map(([r,v])=>`${RESOURCE_TYPES[r].icon}${v}`).join(" ");
              return (
                <button key={upg.id} onClick={()=>!bought&&buyUpgrade(upg,"rewards")}
                  style={{ display:"flex",alignItems:"center",gap:12,width:"100%",
                           padding:"12px 14px",borderRadius:10,border:"none",cursor:bought?"default":"pointer",
                           background:bought?"#0d1a0d":"#131e30",
                           borderLeft:`3px solid ${bought?"#34d399":canAfford?"#f59e0b":"#334155"}`,
                           marginBottom:6, opacity:bought||canAfford?1:0.5 }}>
                  <div style={{ flex:1,textAlign:"left" }}>
                    <div style={{ fontSize:13,fontWeight:700,color:bought?"#34d399":"#f1f5f9" }}>{upg.label}</div>
                    <div style={{ fontSize:11,color:"#64748b" }}>비용: {costLabel}</div>
                  </div>
                  <div style={{ fontSize:12,fontWeight:800,color:bought?"#34d399":canAfford?"#fbbf24":"#475569" }}>
                    {bought?"✅ 완료":"구매"}
                  </div>
                </button>
              );
            })}

            <div style={{ fontSize:13,fontWeight:800,color:"#3b82f6",marginTop:16,marginBottom:8 }}>
              ⚡ 스킬 부스터 (이번 주 한정)
            </div>
            {UPGRADES.boost.map(upg=>{
              const weekBoosts = state.weeklyBoosts[week] || [];
              const bought = weekBoosts.includes(upg.id);
              const canAfford = !bought && Object.entries(upg.cost).every(([r,v])=>(state.resources[r]||0)>=v);
              const costLabel = Object.entries(upg.cost).filter(([,v])=>v>0)
                .map(([r,v])=>`${RESOURCE_TYPES[r].icon}${v}`).join(" ");
              return (
                <button key={upg.id} onClick={()=>!bought&&buyUpgrade(upg,"boost")}
                  style={{ display:"flex",alignItems:"center",gap:12,width:"100%",
                           padding:"12px 14px",borderRadius:10,border:"none",cursor:bought?"default":"pointer",
                           background:bought?"#0d1520":"#131e30",
                           borderLeft:`3px solid ${bought?"#3b82f6":canAfford?"#3b82f6":"#334155"}`,
                           marginBottom:6, opacity:bought||canAfford?1:0.5 }}>
                  <div style={{ flex:1,textAlign:"left" }}>
                    <div style={{ fontSize:13,fontWeight:700,color:bought?"#60a5fa":"#f1f5f9" }}>{upg.label}</div>
                    <div style={{ fontSize:11,color:"#64748b" }}>비용: {costLabel} · 이번 주만 적용</div>
                  </div>
                  <div style={{ fontSize:12,fontWeight:800,color:bought?"#60a5fa":canAfford?"#fbbf24":"#475569" }}>
                    {bought?"✅ 적용중":"구매"}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ── 관리자 탭 ── */}
        {tab==="admin" && adminMode && (
          <AdminPanel cfg={cfg} setCfg={setCfg} updateCfg={updateCfg} state={state} setState={setState} showToast={showToast} KEY={KEY} CFG_KEY={"dw_config_v1"} ghCfg={ghCfg} saveGhCfg={saveGhCfg} syncStatus={syncStatus} syncMsg={syncMsg} />
        )}
      </div>

      {/* ── 관리자 로그인 모달 ── */}
      {showAdminLogin && (
        <div style={{ position:"fixed",inset:0,background:"#000c",display:"flex",
                      alignItems:"center",justifyContent:"center",zIndex:300 }}
             onClick={()=>{setShowAdminLogin(false);setAdminPwError(false);setAdminPwInput("");}}>
          <div style={{ background:"#1e293b",borderRadius:16,padding:28,width:280,
                        border:"1px solid #334155" }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontSize:20,textAlign:"center",marginBottom:4 }}>🔐</div>
            <div style={{ fontSize:15,fontWeight:800,color:"#f1f5f9",textAlign:"center",marginBottom:16 }}>
              관리자 모드
            </div>
            <input
              type="password"
              value={adminPwInput}
              onChange={e=>{ setAdminPwInput(e.target.value); setAdminPwError(false); }}
              onKeyDown={e=>e.key==="Enter"&&adminLogin()}
              placeholder="비밀번호 입력"
              autoFocus
              style={{ width:"100%",padding:"10px 12px",borderRadius:8,border:"none",
                       background:"#0f172a",color:"#f1f5f9",fontSize:14,
                       outline: adminPwError?"2px solid #ef4444":"2px solid #334155",
                       boxSizing:"border-box" }}
            />
            {adminPwError && (
              <div style={{ fontSize:11,color:"#f87171",marginTop:6,textAlign:"center" }}>
                비밀번호가 틀렸어요 🔒
              </div>
            )}
            <div style={{ display:"flex",gap:8,marginTop:16 }}>
              <button onClick={()=>{setShowAdminLogin(false);setAdminPwError(false);setAdminPwInput("");}}
                style={{ flex:1,padding:10,borderRadius:9,border:"none",background:"#334155",
                         color:"#94a3b8",cursor:"pointer",fontWeight:700 }}>취소</button>
              <button onClick={adminLogin}
                style={{ flex:1,padding:10,borderRadius:9,border:"none",background:"#dc2626",
                         color:"#fff",cursor:"pointer",fontWeight:800 }}>입장</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 모달 ── */}
      {modal && (
        <div style={{ position:"fixed",inset:0,background:"#000a",display:"flex",
                      alignItems:"center",justifyContent:"center",zIndex:200 }}
             onClick={()=>setModal(null)}>
          <div style={{ background:"#1e293b",borderRadius:16,padding:24,
                        maxWidth:300,width:"90%",border:"1px solid #334155" }}
               onClick={e=>e.stopPropagation()}>
            {modal.type==="redeem" && <>
              <div style={{ textAlign:"center",fontSize:13,color:"#94a3b8" }}>보상 교환</div>
              <div style={{ textAlign:"center",fontSize:18,fontWeight:800,color:"#f1f5f9",marginTop:8 }}>
                {modal.reward.label}
              </div>
              <div style={{ textAlign:"center",fontSize:13,color:"#fbbf24",marginTop:4 }}>
                {modal.tier<3?`${modal.reward.pts}P 차감`
                  :Object.entries(modal.reward.res).filter(([,v])=>v>0)
                    .map(([r,v])=>`${RESOURCE_TYPES[r].icon}${v}`).join("  ")}
              </div>
              <div style={{ display:"flex",gap:10,marginTop:20 }}>
                <button onClick={()=>setModal(null)} style={{ flex:1,padding:11,borderRadius:9,border:"none",background:"#334155",color:"#94a3b8",cursor:"pointer",fontWeight:700 }}>취소</button>
                <button onClick={confirmRedeem} style={{ flex:1,padding:11,borderRadius:9,border:"none",background:"#f59e0b",color:"#0f172a",cursor:"pointer",fontWeight:800 }}>교환!</button>
              </div>
            </>}
            {modal.type==="upgrade" && <>
              <div style={{ textAlign:"center",fontSize:13,color:"#94a3b8" }}>업그레이드 구매</div>
              <div style={{ textAlign:"center",fontSize:16,fontWeight:800,color:"#f1f5f9",marginTop:8 }}>
                {modal.upg.label}
              </div>
              <div style={{ textAlign:"center",fontSize:13,color:"#fbbf24",marginTop:4 }}>
                {Object.entries(modal.upg.cost).filter(([,v])=>v>0)
                  .map(([r,v])=>`${RESOURCE_TYPES[r].icon}${v}`).join("  ")} 차감
              </div>
              <div style={{ display:"flex",gap:10,marginTop:20 }}>
                <button onClick={()=>setModal(null)} style={{ flex:1,padding:11,borderRadius:9,border:"none",background:"#334155",color:"#94a3b8",cursor:"pointer",fontWeight:700 }}>취소</button>
                <button onClick={confirmUpgrade} style={{ flex:1,padding:11,borderRadius:9,border:"none",background:"#3b82f6",color:"#fff",cursor:"pointer",fontWeight:800 }}>구매!</button>
              </div>
            </>}
          </div>
        </div>
      )}

      {/* ── 토스트 ── */}
      {toast && (
        <div style={{ position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",
                      background: toast.type==="error"?"#ef4444"
                                : toast.type==="levelup"?"#7c3aed"
                                : toast.type==="bonus"?"#f97316"
                                : toast.type==="special"?"#a855f7"
                                : toast.type==="warn"?"#d97706"
                                : "#10b981",
                      color:"#fff",padding:"10px 20px",borderRadius:99,
                      fontSize:13,fontWeight:800,zIndex:300,
                      boxShadow:"0 4px 24px #0008",whiteSpace:"nowrap" }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ── 서브 컴포넌트 ──────────────────────────────────────

function Header({ state, todayPct, todayPts, todayMax, activeEvent, onAdminClick, adminMode }) {
  const LEVELS = [
    { lv:1,name:"생존자 견습생",min:0,   icon:"🥚" },
    { lv:2,name:"기지 건설자",  min:200, icon:"🏠" },
    { lv:3,name:"탐험대원",     min:500, icon:"🗺️" },
    { lv:4,name:"전투 훈련생",  min:1000,icon:"⚔️" },
    { lv:5,name:"기지 수호자",  min:2000,icon:"🛡️" },
    { lv:6,name:"영웅 지원자",  min:3500,icon:"🦸" },
    { lv:7,name:"다크워 영웅",  min:5500,icon:"🌟" },
  ];
  const curLv = [...LEVELS].reverse().find(l=>state.totalPts>=l.min) || LEVELS[0];
  const nextLv = LEVELS.find(l=>state.totalPts<l.min);
  const lvPct = nextLv
    ? Math.round((state.totalPts-curLv.min)/(nextLv.min-curLv.min)*100)
    : 100;

  return (
    <div style={{ background:"linear-gradient(135deg,#0f1c2e 0%,#080f1a 100%)",
                  borderBottom:"1px solid #1e293b", padding:"14px 14px 10px" }}>
      <div style={{ maxWidth:560, margin:"0 auto" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div>
            <div style={{ fontSize:10,color:"#475569",letterSpacing:2,textTransform:"uppercase" }}>
              DARK WAR · 생존 일지
            </div>
            <div style={{ fontSize:18,fontWeight:900,color:"#f8fafc",marginTop:2 }}>
              {curLv.icon} {curLv.name}
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
            <button onClick={onAdminClick} style={{
              padding:"4px 10px", borderRadius:99, border:"none", cursor:"pointer",
              background: adminMode?"#dc2626":"#1e293b",
              color: adminMode?"#fef2f2":"#475569",
              fontSize:10, fontWeight:700,
            }}>
              {adminMode ? "🔓 관리자 ON" : "🔒 관리자"}
            </button>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:10,color:"#64748b" }}>보유 포인트</div>
              <div style={{ fontSize:26,fontWeight:900,color:"#fbbf24",lineHeight:1 }}>
                {state.points.toLocaleString()}<span style={{ fontSize:12,color:"#f59e0b" }}>P</span>
              </div>
            </div>
          </div>
        </div>

        {/* 레벨 바 */}
        <div style={{ marginTop:10 }}>
          <div style={{ display:"flex",justifyContent:"space-between",fontSize:10,color:"#475569",marginBottom:3 }}>
            <span>Lv.{curLv.lv} · 누적 {state.totalPts.toLocaleString()}P</span>
            {nextLv&&<span>→ {nextLv.name}: {nextLv.min.toLocaleString()}P</span>}
          </div>
          <div style={{ background:"#0f172a",borderRadius:99,height:6,overflow:"hidden" }}>
            <div style={{ width:`${lvPct}%`,height:"100%",
                          background:"linear-gradient(90deg,#f59e0b,#fbbf24)",
                          borderRadius:99,transition:"width 0.6s ease" }}/>
          </div>
        </div>

        {/* 오늘 진행률 */}
        <div style={{ marginTop:8 }}>
          <div style={{ display:"flex",justifyContent:"space-between",fontSize:10,color:"#475569",marginBottom:3 }}>
            <span>오늘 퀘스트</span>
            <span style={{ color:"#34d399" }}>{todayPts}/{todayMax}P ({todayPct}%)</span>
          </div>
          <div style={{ background:"#0f172a",borderRadius:99,height:6,overflow:"hidden" }}>
            <div style={{ width:`${todayPct}%`,height:"100%",
                          background:"linear-gradient(90deg,#10b981,#34d399)",
                          borderRadius:99,transition:"width 0.6s ease" }}/>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResourceBar({ resources }) {
  return (
    <div style={{ background:"#0d1520",borderBottom:"1px solid #1e293b",
                  padding:"8px 14px" }}>
      <div style={{ maxWidth:560,margin:"0 auto",display:"flex",gap:0 }}>
        {Object.values(RESOURCE_TYPES).map((r,i)=>(
          <div key={r.id} style={{ flex:1,textAlign:"center",
                                   borderRight: i<2?"1px solid #1e293b":"none",
                                   padding:"2px 0" }}>
            <div style={{ fontSize:11,fontWeight:800,color:r.color }}>
              {r.icon} {r.label}
            </div>
            <div style={{ fontSize:20,fontWeight:900,color:"#f8fafc",lineHeight:1.2 }}>
              {resources[r.id]||0}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 이벤트 타임라인 컴포넌트 (상시 표시) ──────────────
function EventTimeline({ activeEvent, eventTimes }) {
  const now = new Date();
  const hour = now.getHours();
  const minutes = now.getMinutes();
  const currentDecimal = hour + minutes / 60;
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;

  const TOTAL = 24;
  const BAR_EVENTS = eventTimes.filter(
    ev => ev.days === "all" || (ev.days === "weekend" && isWeekend)
  );

  // 현재 시각 포인터 위치 (%)
  const nowPct = (currentDecimal / TOTAL) * 100;

  // 가독성 좋은 시각 포맷
  function fmtH(h) {
    if (h === 0 || h === 24) return "자정";
    if (h === 12) return "정오";
    return h < 12 ? `오전${h}시` : `오후${h-12}시`;
  }

  // 다음 이벤트 계산
  const upcoming = BAR_EVENTS
    .filter(ev => ev.start > hour || (ev.start <= hour && ev.end > hour))
    .sort((a,b) => {
      const aStart = a.start > hour ? a.start : a.end; // 현재 진행중이면 종료시각 기준
      const bStart = b.start > hour ? b.start : b.end;
      return aStart - bStart;
    });
  const nextEvent = upcoming[0];

  return (
    <div style={{ maxWidth:560, margin:"0 auto", padding:"8px 14px 4px" }}>
      <div style={{ background:"#0d1520", borderRadius:12, border:"1px solid #1e293b",
                    padding:"10px 12px" }}>

        {/* 제목 행 */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                      marginBottom:8 }}>
          <span style={{ fontSize:11, fontWeight:800, color:"#94a3b8",
                         letterSpacing:1, textTransform:"uppercase" }}>
            ⏰ 오늘의 이벤트 타임
          </span>
          {nextEvent && (
            <span style={{ fontSize:10, color: activeEvent?.id===nextEvent.id?"#fde68a":"#64748b" }}>
              {activeEvent?.id===nextEvent.id
                ? `🔴 진행중 · ${nextEvent.end}시 종료`
                : `다음: ${nextEvent.icon} ${fmtH(nextEvent.start)}`}
            </span>
          )}
        </div>

        {/* 타임라인 바 */}
        <div style={{ position:"relative", height:28, borderRadius:6,
                      background:"#131e30", overflow:"visible", marginBottom:6 }}>

          {/* 이벤트 구간 색칠 */}
          {BAR_EVENTS.map(ev => {
            const left = (ev.start / TOTAL) * 100;
            const width = ((ev.end - ev.start) / TOTAL) * 100;
            const isActive = hour >= ev.start && hour < ev.end;
            return (
              <div key={ev.id} style={{
                position:"absolute", top:0, bottom:0,
                left:`${left}%`, width:`${width}%`,
                background: isActive
                  ? "linear-gradient(90deg,#7c3aed99,#2563eb99)"
                  : "#1e3a5f55",
                borderRadius:4,
                border: isActive ? "1px solid #7c3aed" : "1px solid #1e3a5f",
                display:"flex", alignItems:"center", justifyContent:"center",
                overflow:"hidden",
              }}>
                <span style={{ fontSize:10, fontWeight:800,
                                color: isActive ? "#fde68a" : "#475569",
                                whiteSpace:"nowrap" }}>
                  {ev.icon} ×{ev.mult}
                </span>
              </div>
            );
          })}

          {/* 현재 시각 포인터 */}
          <div style={{
            position:"absolute", top:-3, bottom:-3,
            left:`${nowPct}%`,
            width:2, background:"#f87171", borderRadius:99,
            transform:"translateX(-50%)",
            zIndex:10,
            boxShadow:"0 0 6px #f8717188",
          }}/>
          {/* 현재 시각 라벨 */}
          <div style={{
            position:"absolute", top:-18,
            left:`clamp(24px, ${nowPct}%, calc(100% - 24px))`,
            transform:"translateX(-50%)",
            fontSize:9, fontWeight:800, color:"#f87171",
            whiteSpace:"nowrap", zIndex:11,
          }}>
            {String(hour).padStart(2,"0")}:{String(minutes).padStart(2,"0")}
          </div>
        </div>

        {/* 이벤트 범례 칩 */}
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {BAR_EVENTS.map(ev => {
            const isActive = hour >= ev.start && hour < ev.end;
            return (
              <div key={ev.id} style={{
                display:"flex", alignItems:"center", gap:4,
                padding:"3px 8px", borderRadius:99, fontSize:10, fontWeight:700,
                background: isActive ? "linear-gradient(90deg,#7c3aed,#2563eb)" : "#1e293b",
                color: isActive ? "#fde68a" : "#64748b",
                border: isActive ? "none" : "1px solid #334155",
              }}>
                <span>{ev.icon}</span>
                <span>{ev.label}</span>
                <span style={{ color: isActive?"#c4b5fd":"#475569" }}>
                  {fmtH(ev.start)}~{fmtH(ev.end)}
                </span>
                <span style={{ fontWeight:900, color: isActive?"#fff":"#64748b" }}>
                  ×{ev.mult}
                </span>
                {isActive && (
                  <span style={{ background:"#fde68a22", color:"#fde68a",
                                 borderRadius:99, padding:"1px 5px", fontSize:9 }}>
                    NOW
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// 관리자 패널
// ═══════════════════════════════════════════════════════
function AdminPanel({ cfg, setCfg, updateCfg, state, setState, showToast, KEY, CFG_KEY, ghCfg, saveGhCfg, syncStatus, syncMsg }) {
  const [section, setSection] = useState("quests");
  const [editingTask, setEditingTask] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editingReward, setEditingReward] = useState(null);
  const [editingSkillMission, setEditingSkillMission] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [ghForm, setGhForm] = useState({ ...ghCfg });

  const INPUT = { background:"#0f172a", border:"1px solid #334155", borderRadius:6,
                  color:"#f1f5f9", padding:"6px 8px", fontSize:12, width:"100%", boxSizing:"border-box" };
  const LABEL = { fontSize:10, color:"#64748b", marginBottom:3, display:"block" };
  const SECTION_BTN = (k) => ({
    padding:"6px 10px", borderRadius:7, border:"none", cursor:"pointer", fontSize:11, fontWeight:700,
    background: section===k?"#dc2626":"#1e293b", color: section===k?"#fff":"#64748b",
  });

  const sections = [
    ["github","☁️ GitHub"],
    ["quests","📅 퀘스트"], ["events","⏰ 이벤트"], ["rewards","🎁 보상"],
    ["skills","🌳 스킬"], ["manual","🎲 수동 조정"], ["reset","⚠️ 초기화"],
  ];

  return (
    <div style={{ paddingTop:10 }}>
      {/* 관리자 섹션 탭 */}
      <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:14 }}>
        {sections.map(([k,l]) => (
          <button key={k} onClick={()=>setSection(k)} style={SECTION_BTN(k)}>{l}</button>
        ))}
      </div>

      {/* ── GitHub 설정 ── */}
      {section==="github" && (
        <div>
          {/* 현재 동기화 상태 */}
          <div style={{ padding:"10px 12px", borderRadius:10, marginBottom:14,
                        background: syncStatus==="error"?"#2d0a0a":syncStatus==="ok"?"#0a1a0a":"#0a1a2e",
                        border:`1px solid ${syncStatus==="error"?"#7f1d1d":syncStatus==="ok"?"#14532d":"#1e3a5f"}` }}>
            <div style={{ fontSize:12, fontWeight:800,
                          color: syncStatus==="error"?"#f87171":syncStatus==="ok"?"#34d399":"#60a5fa" }}>
              {syncStatus==="loading"?"⏳ 불러오는 중...":syncStatus==="saving"?"💾 저장 중...":syncStatus==="error"?"❌ "+syncMsg:syncStatus==="ok"?"✅ "+syncMsg:"⚪ GitHub 미연결"}
            </div>
          </div>

          {/* 설정 안내 */}
          <div style={{ padding:"12px 14px", borderRadius:10, background:"#0d1520",
                        border:"1px solid #1e293b", marginBottom:14, fontSize:11, color:"#64748b",
                        lineHeight:1.8 }}>
            <div style={{ fontWeight:800, color:"#94a3b8", marginBottom:6 }}>📋 설정 방법</div>
            <div>1. GitHub에서 <span style={{color:"#60a5fa"}}>비공개 저장소</span> 새로 만들기 (예: darkwar-data)</div>
            <div>2. 저장소에 <span style={{color:"#60a5fa"}}>Issue #1</span> 하나 만들기 (제목은 아무거나)</div>
            <div>3. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)</div>
            <div>4. <span style={{color:"#fbbf24"}}>repo</span> 권한 체크 후 토큰 발급</div>
            <div>5. 아래에 입력 후 저장</div>
          </div>

          {/* 입력 폼 */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div>
              <span style={LABEL}>GitHub 사용자명 (owner)</span>
              <input value={ghForm.owner} onChange={e=>setGhForm(f=>({...f,owner:e.target.value}))}
                placeholder="예: myusername" style={INPUT} />
            </div>
            <div>
              <span style={LABEL}>데이터 저장소 이름 (repo)</span>
              <input value={ghForm.repo} onChange={e=>setGhForm(f=>({...f,repo:e.target.value}))}
                placeholder="예: darkwar-data" style={INPUT} />
            </div>
            <div>
              <span style={LABEL}>Issue 번호</span>
              <input type="number" value={ghForm.issueNumber} min={1}
                onChange={e=>setGhForm(f=>({...f,issueNumber:Number(e.target.value)}))}
                style={{ ...INPUT, width:80 }} />
            </div>
            <div>
              <span style={LABEL}>Personal Access Token 🔑</span>
              <input type="password" value={ghForm.token}
                onChange={e=>setGhForm(f=>({...f,token:e.target.value}))}
                placeholder="ghp_xxxxxxxxxxxx" style={INPUT} />
              <div style={{ fontSize:9, color:"#475569", marginTop:3 }}>
                토큰은 이 기기의 localStorage에만 저장돼요. GitHub에 전송되지 않아요.
              </div>
            </div>
            <button onClick={()=>{
              saveGhCfg(ghForm);
              showToast("GitHub 설정 저장됨 ✅ 잠시 후 동기화돼요", "success");
            }} style={{ padding:"11px", borderRadius:9, border:"none",
                        background:"#2563eb", color:"#fff", cursor:"pointer",
                        fontWeight:800, fontSize:13 }}>
              연결하기
            </button>
            {ghCfg.token && (
              <button onClick={()=>{
                const empty = { token:"", owner:"", repo:"", issueNumber:1 };
                saveGhCfg(empty);
                setGhForm(empty);
                showToast("GitHub 연결 해제됨", "warn");
              }} style={{ padding:"9px", borderRadius:9, border:"1px solid #334155",
                          background:"transparent", color:"#94a3b8", cursor:"pointer",
                          fontWeight:700, fontSize:12 }}>
                연결 해제
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── 퀘스트 편집 ── */}
      {section==="quests" && (
        <div>
          <div style={{ fontSize:12, color:"#94a3b8", marginBottom:10 }}>
            각 카테고리의 퀘스트 항목, 포인트, 자원량, 완료 보너스를 수정할 수 있어요.
          </div>
          {Object.entries(cfg.questGroups).map(([gKey, group]) => (
            <div key={gKey} style={{ marginBottom:16, background:"#0d1520", borderRadius:10,
                                     padding:"12px", border:`1px solid ${group.color}40` }}>
              {/* 카테고리 헤더 편집 */}
              <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:8 }}>
                <span style={{ fontSize:16 }}>{group.icon}</span>
                <span style={{ fontWeight:800, color:"#f1f5f9", fontSize:13, flex:1 }}>{group.label}</span>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontSize:10, color:"#64748b" }}>완료보너스</span>
                  <input type="number" value={group.bonusPts} min={0} max={999}
                    onChange={e=>updateCfg(`questGroups.${gKey}.bonusPts`, Number(e.target.value))}
                    style={{ ...INPUT, width:48, textAlign:"center" }} />
                  <span style={{ fontSize:10, color:"#64748b" }}>P</span>
                </div>
              </div>

              {/* 이벤트 배정 토글 */}
              <div style={{ marginBottom:10, padding:"8px 10px", background:"#0f172a",
                            borderRadius:8, border:"1px solid #1e293b" }}>
                <div style={{ fontSize:10, color:"#64748b", marginBottom:6, fontWeight:700 }}>
                  ⏰ 적용할 이벤트 선택
                </div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {cfg.eventTimes.map(ev => {
                    const allowed = group.allowedEvents || [];
                    const isOn = allowed.includes(ev.id);
                    return (
                      <button key={ev.id} onClick={()=>{
                        const cur = group.allowedEvents || [];
                        const next = isOn ? cur.filter(x=>x!==ev.id) : [...cur, ev.id];
                        updateCfg(`questGroups.${gKey}.allowedEvents`, next);
                      }} style={{
                        padding:"4px 10px", borderRadius:99, border:"none", cursor:"pointer",
                        fontSize:10, fontWeight:700,
                        background: isOn ? "linear-gradient(90deg,#7c3aed,#2563eb)" : "#1e293b",
                        color: isOn ? "#fde68a" : "#475569",
                      }}>
                        {ev.icon} {ev.label} ×{ev.mult}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* 태스크 목록 */}
              {group.tasks.map((task, tIdx) => (
                <div key={task.id} style={{ display:"flex", alignItems:"center", gap:6,
                                            marginBottom:6, padding:"6px 8px", borderRadius:7,
                                            background:"#131e30" }}>
                  {editingTask?.gKey===gKey && editingTask?.tIdx===tIdx ? (
                    <div style={{ flex:1, display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
                      <input value={editingTask.data.label}
                        onChange={e=>setEditingTask(t=>({...t,data:{...t.data,label:e.target.value}}))}
                        style={{ ...INPUT, flex:2, minWidth:120 }} placeholder="미션 이름" />
                      <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                        <span style={{ fontSize:10, color:"#64748b" }}>P</span>
                        <input type="number" value={editingTask.data.pts} min={1} max={999}
                          onChange={e=>setEditingTask(t=>({...t,data:{...t.data,pts:Number(e.target.value)}}))}
                          style={{ ...INPUT, width:44, textAlign:"center" }} />
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                        <span style={{ fontSize:10, color:"#64748b" }}>자원</span>
                        <input type="number" value={editingTask.data.res} min={0} max={99}
                          onChange={e=>setEditingTask(t=>({...t,data:{...t.data,res:Number(e.target.value)}}))}
                          style={{ ...INPUT, width:44, textAlign:"center" }} />
                      </div>
                      <button onClick={()=>{
                        const newTasks = [...group.tasks];
                        newTasks[tIdx] = { ...newTasks[tIdx], ...editingTask.data };
                        updateCfg(`questGroups.${gKey}.tasks`, newTasks);
                        setEditingTask(null);
                        showToast("저장됐어요 ✅");
                      }} style={{ padding:"4px 10px", borderRadius:6, border:"none", background:"#10b981",
                                  color:"#fff", cursor:"pointer", fontSize:11, fontWeight:700 }}>저장</button>
                      <button onClick={()=>setEditingTask(null)}
                        style={{ padding:"4px 8px", borderRadius:6, border:"none", background:"#334155",
                                 color:"#94a3b8", cursor:"pointer", fontSize:11 }}>취소</button>
                    </div>
                  ) : (
                    <>
                      <span style={{ flex:1, fontSize:12, color:"#f1f5f9" }}>{task.label}</span>
                      <span style={{ fontSize:11, color:"#fbbf24", fontWeight:700 }}>{task.pts}P</span>
                      <span style={{ fontSize:10, color:"#94a3b8" }}>자원{task.res}</span>
                      <button onClick={()=>setEditingTask({gKey, tIdx, data:{label:task.label, pts:task.pts, res:task.res}})}
                        style={{ padding:"3px 8px", borderRadius:5, border:"none", background:"#1e3a5f",
                                 color:"#60a5fa", cursor:"pointer", fontSize:10, fontWeight:700 }}>수정</button>
                      <button onClick={()=>{
                        if (group.tasks.length <= 1) { showToast("최소 1개는 있어야 해요","error"); return; }
                        const newTasks = group.tasks.filter((_,i)=>i!==tIdx);
                        updateCfg(`questGroups.${gKey}.tasks`, newTasks);
                        showToast("삭제됐어요");
                      }} style={{ padding:"3px 6px", borderRadius:5, border:"none", background:"#2d0a0a",
                                  color:"#f87171", cursor:"pointer", fontSize:10 }}>✕</button>
                    </>
                  )}
                </div>
              ))}
              {/* 새 태스크 추가 */}
              <button onClick={()=>{
                const newId = `custom_${gKey}_${Date.now()}`;
                const newTasks = [...group.tasks, { id:newId, label:"새 미션", pts:10, res:2 }];
                updateCfg(`questGroups.${gKey}.tasks`, newTasks);
                setEditingTask({ gKey, tIdx:newTasks.length-1, data:{ label:"새 미션", pts:10, res:2 } });
              }} style={{ width:"100%", padding:"7px", borderRadius:7, border:"1px dashed #334155",
                          background:"transparent", color:"#64748b", cursor:"pointer", fontSize:11, marginTop:4 }}>
                + 새 퀘스트 추가
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── 이벤트 타임 편집 ── */}
      {section==="events" && (
        <div>
          <div style={{ fontSize:12, color:"#94a3b8", marginBottom:10 }}>
            이벤트 타임의 시간대와 배율을 수정할 수 있어요.
          </div>
          {cfg.eventTimes.map((ev, eIdx) => (
            <div key={ev.id} style={{ marginBottom:10, padding:"12px", background:"#0d1520",
                                      borderRadius:10, border:"1px solid #1e293b" }}>
              {editingEvent?.eIdx===eIdx ? (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  <div style={{ display:"flex", gap:8 }}>
                    <div style={{ flex:1 }}>
                      <span style={LABEL}>이름</span>
                      <input value={editingEvent.data.label}
                        onChange={e=>setEditingEvent(v=>({...v,data:{...v.data,label:e.target.value}}))}
                        style={INPUT} />
                    </div>
                    <div style={{ width:50 }}>
                      <span style={LABEL}>아이콘</span>
                      <input value={editingEvent.data.icon}
                        onChange={e=>setEditingEvent(v=>({...v,data:{...v.data,icon:e.target.value}}))}
                        style={{ ...INPUT, textAlign:"center" }} />
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <div style={{ flex:1 }}>
                      <span style={LABEL}>시작 (0-23)</span>
                      <input type="number" value={editingEvent.data.start} min={0} max={23}
                        onChange={e=>setEditingEvent(v=>({...v,data:{...v.data,start:Number(e.target.value)}}))}
                        style={INPUT} />
                    </div>
                    <div style={{ flex:1 }}>
                      <span style={LABEL}>종료 (1-24)</span>
                      <input type="number" value={editingEvent.data.end} min={1} max={24}
                        onChange={e=>setEditingEvent(v=>({...v,data:{...v.data,end:Number(e.target.value)}}))}
                        style={INPUT} />
                    </div>
                    <div style={{ flex:1 }}>
                      <span style={LABEL}>배율 (×)</span>
                      <input type="number" value={editingEvent.data.mult} min={1.1} max={5} step={0.1}
                        onChange={e=>setEditingEvent(v=>({...v,data:{...v.data,mult:Number(e.target.value)}}))}
                        style={INPUT} />
                    </div>
                  </div>
                  <div>
                    <span style={LABEL}>요일</span>
                    <div style={{ display:"flex", gap:6 }}>
                      {["all","weekend"].map(d=>(
                        <button key={d} onClick={()=>setEditingEvent(v=>({...v,data:{...v.data,days:d}}))}
                          style={{ padding:"5px 12px", borderRadius:6, border:"none", cursor:"pointer",
                                   background:editingEvent.data.days===d?"#3b82f6":"#1e293b",
                                   color:editingEvent.data.days===d?"#fff":"#64748b", fontSize:11 }}>
                          {d==="all"?"매일":"주말만"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={()=>{
                      const newEv = [...cfg.eventTimes];
                      newEv[eIdx] = { ...newEv[eIdx], ...editingEvent.data };
                      updateCfg("eventTimes", newEv);
                      setEditingEvent(null);
                      showToast("이벤트 타임 저장됐어요 ✅");
                    }} style={{ flex:1,padding:8,borderRadius:7,border:"none",background:"#10b981",color:"#fff",cursor:"pointer",fontWeight:700 }}>저장</button>
                    <button onClick={()=>setEditingEvent(null)}
                      style={{ flex:1,padding:8,borderRadius:7,border:"none",background:"#334155",color:"#94a3b8",cursor:"pointer" }}>취소</button>
                  </div>
                </div>
              ) : (
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:18 }}>{ev.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, color:"#f1f5f9", fontSize:13 }}>{ev.label}</div>
                    <div style={{ fontSize:11, color:"#64748b" }}>
                      {ev.start}~{ev.end}시 · ×{ev.mult} · {ev.days==="all"?"매일":"주말만"}
                    </div>
                  </div>
                  <button onClick={()=>setEditingEvent({eIdx, data:{...ev}})}
                    style={{ padding:"4px 10px",borderRadius:6,border:"none",background:"#1e3a5f",
                             color:"#60a5fa",cursor:"pointer",fontSize:11,fontWeight:700 }}>수정</button>
                  <button onClick={()=>{
                    const newEv = cfg.eventTimes.filter((_,i)=>i!==eIdx);
                    updateCfg("eventTimes", newEv);
                    showToast("삭제됐어요");
                  }} style={{ padding:"4px 6px",borderRadius:5,border:"none",background:"#2d0a0a",color:"#f87171",cursor:"pointer",fontSize:10 }}>✕</button>
                </div>
              )}
            </div>
          ))}
          <button onClick={()=>{
            const newEv = [...cfg.eventTimes, { id:`ev_${Date.now()}`, label:"새 이벤트", start:12, end:14, mult:1.5, icon:"⭐", days:"all" }];
            updateCfg("eventTimes", newEv);
            setEditingEvent({ eIdx:newEv.length-1, data: newEv[newEv.length-1] });
          }} style={{ width:"100%",padding:8,borderRadius:8,border:"1px dashed #334155",
                      background:"transparent",color:"#64748b",cursor:"pointer",fontSize:11,marginTop:4 }}>
            + 새 이벤트 타임 추가
          </button>
        </div>
      )}

      {/* ── 보상 편집 ── */}
      {section==="rewards" && (
        <div>
          <div style={{ fontSize:12, color:"#94a3b8", marginBottom:10 }}>
            보상 항목과 필요 포인트를 수정할 수 있어요.
          </div>
          {cfg.rewardTiers.map((tier, tierIdx) => (
            <div key={tier.tier} style={{ marginBottom:16, background:"#0d1520", borderRadius:10,
                                          padding:"12px", border:`1px solid ${tier.color}40` }}>
              <div style={{ fontSize:13, fontWeight:800, color:tier.color, marginBottom:8 }}>
                {tier.icon} {tier.label}
              </div>
              {tier.rewards.map((reward, rIdx) => (
                <div key={reward.id} style={{ display:"flex", alignItems:"center", gap:6,
                                              marginBottom:6, padding:"7px 8px", borderRadius:7, background:"#131e30" }}>
                  {editingReward?.tierIdx===tierIdx && editingReward?.rIdx===rIdx ? (
                    <div style={{ flex:1, display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
                      <input value={editingReward.data.label}
                        onChange={e=>setEditingReward(r=>({...r,data:{...r.data,label:e.target.value}}))}
                        style={{ ...INPUT, flex:2, minWidth:100 }} placeholder="보상 이름" />
                      {tierIdx < 2 ? (
                        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                          <span style={{ fontSize:10, color:"#64748b" }}>P</span>
                          <input type="number" value={editingReward.data.pts} min={1} max={9999}
                            onChange={e=>setEditingReward(r=>({...r,data:{...r.data,pts:Number(e.target.value)}}))}
                            style={{ ...INPUT, width:55, textAlign:"center" }} />
                        </div>
                      ) : (
                        <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                          {Object.keys(RESOURCE_TYPES).map(rKey=>(
                            <div key={rKey} style={{ display:"flex", alignItems:"center", gap:2 }}>
                              <span style={{ fontSize:11 }}>{RESOURCE_TYPES[rKey].icon}</span>
                              <input type="number" value={editingReward.data.res[rKey]||0} min={0} max={999}
                                onChange={e=>setEditingReward(r=>({...r,data:{...r.data,res:{...r.data.res,[rKey]:Number(e.target.value)}}}))}
                                style={{ ...INPUT, width:44, textAlign:"center" }} />
                            </div>
                          ))}
                        </div>
                      )}
                      <button onClick={()=>{
                        const newTiers = JSON.parse(JSON.stringify(cfg.rewardTiers));
                        newTiers[tierIdx].rewards[rIdx] = { ...newTiers[tierIdx].rewards[rIdx], ...editingReward.data };
                        updateCfg("rewardTiers", newTiers);
                        setEditingReward(null);
                        showToast("보상 저장됐어요 ✅");
                      }} style={{ padding:"4px 10px",borderRadius:6,border:"none",background:"#10b981",color:"#fff",cursor:"pointer",fontSize:11,fontWeight:700 }}>저장</button>
                      <button onClick={()=>setEditingReward(null)}
                        style={{ padding:"4px 8px",borderRadius:6,border:"none",background:"#334155",color:"#94a3b8",cursor:"pointer",fontSize:11 }}>취소</button>
                    </div>
                  ) : (
                    <>
                      <span style={{ flex:1, fontSize:12, color:"#f1f5f9" }}>{reward.label}</span>
                      <span style={{ fontSize:11, color:"#fbbf24", fontWeight:700 }}>
                        {tierIdx<2 ? `${reward.pts}P` : Object.entries(reward.res||{}).filter(([,v])=>v>0).map(([r,v])=>`${RESOURCE_TYPES[r].icon}${v}`).join(" ")}
                      </span>
                      <button onClick={()=>setEditingReward({tierIdx, rIdx, data:{label:reward.label, pts:reward.pts||0, res:reward.res||{}}})}
                        style={{ padding:"3px 8px",borderRadius:5,border:"none",background:"#1e3a5f",color:"#60a5fa",cursor:"pointer",fontSize:10,fontWeight:700 }}>수정</button>
                      <button onClick={()=>{
                        const newTiers = JSON.parse(JSON.stringify(cfg.rewardTiers));
                        newTiers[tierIdx].rewards = newTiers[tierIdx].rewards.filter((_,i)=>i!==rIdx);
                        updateCfg("rewardTiers", newTiers);
                        showToast("삭제됐어요");
                      }} style={{ padding:"3px 6px",borderRadius:5,border:"none",background:"#2d0a0a",color:"#f87171",cursor:"pointer",fontSize:10 }}>✕</button>
                    </>
                  )}
                </div>
              ))}
              <button onClick={()=>{
                const newTiers = JSON.parse(JSON.stringify(cfg.rewardTiers));
                const newId = `custom_${tierIdx}_${Date.now()}`;
                newTiers[tierIdx].rewards.push(tierIdx<2
                  ? { id:newId, label:"새 보상", pts:30, res:{} }
                  : { id:newId, label:"새 보상", pts:0, res:{ energy:30,knowledge:30,talent:30 } }
                );
                updateCfg("rewardTiers", newTiers);
                setEditingReward({ tierIdx, rIdx:newTiers[tierIdx].rewards.length-1,
                  data:{ label:"새 보상", pts:30, res:{ energy:30,knowledge:30,talent:30 } }});
              }} style={{ width:"100%",padding:7,borderRadius:7,border:"1px dashed #334155",
                          background:"transparent",color:"#64748b",cursor:"pointer",fontSize:11,marginTop:4 }}>
                + 새 보상 추가
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── 스킬 미션 편집 ── */}
      {section==="skills" && (
        <div>
          <div style={{ fontSize:12, color:"#94a3b8", marginBottom:6 }}>
            스킬 미션 텍스트와 주간 스킬 업 한도를 수정할 수 있어요.
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14,
                        padding:"10px 12px", background:"#0d1520", borderRadius:10, border:"1px solid #1e293b" }}>
            <span style={{ fontSize:12, color:"#94a3b8", flex:1 }}>주간 스킬 업 최대 횟수</span>
            <input type="number" value={cfg.weeklySkillCap} min={1} max={10}
              onChange={e=>updateCfg("weeklySkillCap", Number(e.target.value))}
              style={{ ...INPUT, width:50, textAlign:"center" }} />
            <span style={{ fontSize:11, color:"#64748b" }}>회/주</span>
          </div>
          {Object.entries(cfg.skillTrees).map(([sKey, skill]) => (
            <div key={sKey} style={{ marginBottom:14, background:"#0d1520", borderRadius:10,
                                     padding:"12px", border:`1px solid ${skill.color}40` }}>
              <div style={{ fontSize:13, fontWeight:800, color:skill.color, marginBottom:8 }}>
                {skill.icon} {skill.label}
              </div>
              {skill.levels.map((lv, lvIdx) => (
                <div key={lvIdx} style={{ marginBottom:8, padding:"8px", background:"#131e30", borderRadius:8 }}>
                  <div style={{ fontSize:11, color:"#64748b", marginBottom:6 }}>
                    Lv.{lvIdx+1} {lv.name}
                    <span style={{ marginLeft:8, color:skill.color }}>→ {lv.reward}</span>
                  </div>
                  {lv.missions.map((m, mIdx) => (
                    <div key={mIdx} style={{ display:"flex", gap:6, alignItems:"center", marginBottom:5 }}>
                      {editingSkillMission?.sKey===sKey && editingSkillMission?.lvIdx===lvIdx && editingSkillMission?.mIdx===mIdx ? (
                        <>
                          <input value={editingSkillMission.text}
                            onChange={e=>setEditingSkillMission(v=>({...v,text:e.target.value}))}
                            style={{ ...INPUT, flex:1 }} />
                          <button onClick={()=>{
                            const newTrees = JSON.parse(JSON.stringify(cfg.skillTrees));
                            newTrees[sKey].levels[lvIdx].missions[mIdx] = editingSkillMission.text;
                            updateCfg("skillTrees", newTrees);
                            setEditingSkillMission(null);
                            showToast("저장됐어요 ✅");
                          }} style={{ padding:"4px 8px",borderRadius:5,border:"none",background:"#10b981",color:"#fff",cursor:"pointer",fontSize:10,fontWeight:700 }}>저장</button>
                          <button onClick={()=>setEditingSkillMission(null)}
                            style={{ padding:"4px 6px",borderRadius:5,border:"none",background:"#334155",color:"#94a3b8",cursor:"pointer",fontSize:10 }}>취소</button>
                        </>
                      ) : (
                        <>
                          <span style={{ flex:1, fontSize:11, color:"#cbd5e1" }}>• {m}</span>
                          <button onClick={()=>setEditingSkillMission({sKey, lvIdx, mIdx, text:m})}
                            style={{ padding:"2px 7px",borderRadius:4,border:"none",background:"#1e3a5f",color:"#60a5fa",cursor:"pointer",fontSize:9,fontWeight:700 }}>수정</button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── 수동 조정 ── */}
      {section==="manual" && (
        <ManualAdjust state={state} setState={setState} showToast={showToast} />
      )}

      {/* ── 초기화 ── */}
      {section==="reset" && (
        <div style={{ padding:"16px 0" }}>

          {/* ── 백업 내보내기 ── */}
          <div style={{ background:"#0d1a2e", borderRadius:12, padding:16,
                        border:"1px solid #1e3a5f", marginBottom:12 }}>
            <div style={{ fontSize:13, fontWeight:800, color:"#60a5fa", marginBottom:6 }}>
              📤 데이터 백업 (내보내기)
            </div>
            <div style={{ fontSize:11, color:"#64748b", marginBottom:12 }}>
              현재 진행 데이터와 설정을 JSON 파일로 저장해요.<br/>
              iOS Safari 7일 삭제 정책에 대비해 주기적으로 저장해두세요.
            </div>
            <button onClick={()=>{
              const backup = {
                version: 1,
                exportedAt: new Date().toISOString(),
                state: state,
                cfg: cfg,
              };
              const json = JSON.stringify(backup, null, 2);
              const blob = new Blob([json], { type:"application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              const dateStr = new Date().toISOString().slice(0,10);
              a.href = url;
              a.download = `darkwar-backup-${dateStr}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              showToast("백업 파일이 저장됐어요 📤", "success");
            }} style={{ padding:"10px 20px", borderRadius:9, border:"none",
                        background:"#2563eb", color:"#fff", cursor:"pointer",
                        fontWeight:800, fontSize:13 }}>
              💾 백업 파일 다운로드
            </button>
          </div>

          {/* ── 백업 복원 ── */}
          <div style={{ background:"#0d1a2e", borderRadius:12, padding:16,
                        border:"1px solid #1e3a5f", marginBottom:12 }}>
            <div style={{ fontSize:13, fontWeight:800, color:"#34d399", marginBottom:6 }}>
              📥 데이터 복원 (가져오기)
            </div>
            <div style={{ fontSize:11, color:"#64748b", marginBottom:12 }}>
              이전에 저장한 백업 JSON 파일을 불러와서 데이터를 복원해요.
            </div>
            <label style={{ display:"inline-block", padding:"10px 20px", borderRadius:9,
                            background:"#059669", color:"#fff", cursor:"pointer",
                            fontWeight:800, fontSize:13 }}>
              📂 백업 파일 불러오기
              <input type="file" accept=".json" style={{ display:"none" }}
                onChange={e=>{
                  const file = e.target.files[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = ev => {
                    try {
                      const backup = JSON.parse(ev.target.result);
                      if (!backup.version || !backup.state) {
                        showToast("올바른 백업 파일이 아니에요 ❌", "error");
                        return;
                      }
                      if (backup.state) {
                        setState(backup.state);
                        try { localStorage.setItem(KEY, JSON.stringify(backup.state)); } catch{}
                      }
                      if (backup.cfg) {
                        setCfg(backup.cfg);
                        try { localStorage.setItem(CFG_KEY, JSON.stringify(backup.cfg)); } catch{}
                      }
                      showToast("데이터가 복원됐어요 ✅", "success");
                    } catch(err) {
                      showToast("파일을 읽을 수 없어요 ❌", "error");
                    }
                  };
                  reader.readAsText(file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <div style={{ background:"#2d0a0a", borderRadius:12, padding:16, border:"1px solid #7f1d1d", marginBottom:12 }}>
            <div style={{ fontSize:13, fontWeight:800, color:"#f87171", marginBottom:6 }}>⚠️ 진행 데이터 초기화</div>
            <div style={{ fontSize:11, color:"#94a3b8", marginBottom:12 }}>
              포인트, 자원, 완료 내역, 스킬 진행도가 모두 삭제돼요. 되돌릴 수 없어요.
            </div>
            {!confirmReset ? (
              <button onClick={()=>setConfirmReset(true)}
                style={{ padding:"8px 16px",borderRadius:8,border:"none",background:"#dc2626",color:"#fff",cursor:"pointer",fontWeight:700 }}>
                진행 데이터 초기화
              </button>
            ) : (
              <div>
                <div style={{ fontSize:12, color:"#fca5a5", marginBottom:8 }}>정말 삭제할까요?</div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={()=>{
                    setState({
                      points:0, resources:{energy:0,knowledge:0,talent:0},
                      completedByDay:{}, skillLevels:{}, skillProgress:{},
                      weeklySkillUps:{}, upgrades:{}, weeklyBoosts:{},
                      totalPts:0, history:[], rewardInventory:{},
                    });
                    setConfirmReset(false);
                    showToast("진행 데이터가 초기화됐어요","warn");
                  }} style={{ padding:"8px 16px",borderRadius:8,border:"none",background:"#dc2626",color:"#fff",cursor:"pointer",fontWeight:800 }}>삭제</button>
                  <button onClick={()=>setConfirmReset(false)}
                    style={{ padding:"8px 16px",borderRadius:8,border:"none",background:"#334155",color:"#94a3b8",cursor:"pointer",fontWeight:700 }}>취소</button>
                </div>
              </div>
            )}
          </div>
          <div style={{ background:"#0d1520", borderRadius:12, padding:16, border:"1px solid #1e293b" }}>
            <div style={{ fontSize:13, fontWeight:800, color:"#94a3b8", marginBottom:6 }}>⚙️ 설정(퀘스트·보상·이벤트) 초기화</div>
            <div style={{ fontSize:11, color:"#64748b", marginBottom:12 }}>
              관리자에서 편집한 퀘스트·보상·이벤트 설정을 원래대로 되돌려요.
            </div>
            <button onClick={()=>{
              setCfg({
                questGroups: JSON.parse(JSON.stringify(QUEST_GROUPS)),
                eventTimes: JSON.parse(JSON.stringify(EVENT_TIMES)),
                rewardTiers: JSON.parse(JSON.stringify(REWARD_TIERS)),
                weeklySkillCap: WEEKLY_SKILL_CAP,
                skillTrees: JSON.parse(JSON.stringify(SKILL_TREES)),
              });
              showToast("설정이 초기화됐어요","warn");
            }} style={{ padding:"8px 16px",borderRadius:8,border:"none",background:"#334155",color:"#f1f5f9",cursor:"pointer",fontWeight:700 }}>
              설정 기본값으로 되돌리기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 수동 포인트·자원 조정 ──────────────────────────────
function ManualAdjust({ state, setState, showToast }) {
  const [delta, setDelta] = useState({ points:0, energy:0, knowledge:0, talent:0 });

  function apply() {
    setState(s => ({
      ...s,
      points: Math.max(0, s.points + Number(delta.points)),
      totalPts: Math.max(0, s.totalPts + (Number(delta.points)>0?Number(delta.points):0)),
      resources: {
        energy:   Math.max(0,(s.resources.energy||0)   + Number(delta.energy)),
        knowledge:Math.max(0,(s.resources.knowledge||0)+ Number(delta.knowledge)),
        talent:   Math.max(0,(s.resources.talent||0)   + Number(delta.talent)),
      },
    }));
    showToast("조정됐어요 ✅");
    setDelta({ points:0, energy:0, knowledge:0, talent:0 });
  }

  const ROW = { display:"flex", alignItems:"center", gap:10, marginBottom:10,
                padding:"10px 12px", background:"#131e30", borderRadius:9 };
  const INPUT = { background:"#0f172a",border:"1px solid #334155",borderRadius:6,
                  color:"#f1f5f9",padding:"6px 8px",fontSize:13,width:80,textAlign:"center",boxSizing:"border-box" };

  return (
    <div>
      <div style={{ fontSize:12, color:"#94a3b8", marginBottom:12 }}>
        현재 수치에 더하거나 빼요. 음수 입력 가능.
      </div>
      {[
        { key:"points", label:"포인트 P", icon:"🪙", cur:state.points },
        { key:"energy", label:"에너지 ⚡", icon:"⚡", cur:state.resources.energy||0 },
        { key:"knowledge", label:"지식 📘", icon:"📘", cur:state.resources.knowledge||0 },
        { key:"talent", label:"재능 🎵", icon:"🎵", cur:state.resources.talent||0 },
      ].map(item=>(
        <div key={item.key} style={ROW}>
          <span style={{ fontSize:16 }}>{item.icon}</span>
          <span style={{ flex:1, fontSize:13, color:"#f1f5f9", fontWeight:700 }}>{item.label}</span>
          <span style={{ fontSize:11, color:"#64748b" }}>현재: {item.cur}</span>
          <input type="number" value={delta[item.key]}
            onChange={e=>setDelta(d=>({...d,[item.key]:e.target.value}))}
            style={INPUT} placeholder="0" />
          <span style={{ fontSize:11, color:"#64748b" }}>
            → {Math.max(0, item.cur + Number(delta[item.key]))}
          </span>
        </div>
      ))}
      <button onClick={apply} style={{ width:"100%",padding:11,borderRadius:9,border:"none",
                                       background:"#f59e0b",color:"#0f172a",cursor:"pointer",
                                       fontWeight:800,fontSize:13,marginTop:4 }}>
        적용하기
      </button>
    </div>
  );
}


ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));

// ── 일일 보상 게이지 컴포넌트 ─────────────────────────
function DailyRewardGauge({ state, today }) {
  const isNewDay = (state.dailyGaugeDate || "") !== today;
  const gaugePts = isNewDay ? 0 : (state.dailyGaugePts || 0);
  const cleared  = isNewDay ? [] : (state.dailyTiersCleared || []);
  const maxPts   = DAILY_REWARD_TIERS[DAILY_REWARD_TIERS.length - 1].requiredPts;
  const pct      = Math.min(100, Math.round(gaugePts / maxPts * 100));

  return (
    <div style={{ paddingTop:12 }}>
      {/* 오늘 포인트 요약 */}
      <div style={{ display:"flex", justifyContent:"space-between",
                    alignItems:"center", marginBottom:14 }}>
        <div>
          <div style={{ fontSize:11, color:"#64748b" }}>오늘 보상 게이지</div>
          <div style={{ fontSize:26, fontWeight:900, color:"#fbbf24", lineHeight:1 }}>
            {gaugePts}<span style={{ fontSize:13, color:"#f59e0b" }}>P</span>
          </div>
        </div>
        <div style={{ textAlign:"right", fontSize:11, color:"#64748b" }}>
          <div>매일 자정 초기화</div>
          <div style={{ color:"#34d399" }}>
            {cleared.length}/3단계 달성
          </div>
        </div>
      </div>

      {/* 통합 게이지 바 */}
      <div style={{ position:"relative", marginBottom:20 }}>
        {/* 배경 */}
        <div style={{ height:28, borderRadius:99, background:"#1e293b",
                      overflow:"hidden", position:"relative" }}>
          {/* 채워진 바 */}
          <div style={{
            position:"absolute", left:0, top:0, bottom:0,
            width:`${pct}%`,
            background: gaugePts >= 120
              ? "linear-gradient(90deg,#94a3b8,#fbbf24,#f97316)"
              : gaugePts >= 70
              ? "linear-gradient(90deg,#94a3b8,#fbbf24)"
              : "linear-gradient(90deg,#64748b,#94a3b8)",
            borderRadius:99,
            transition:"width 0.6s ease",
            boxShadow: gaugePts >= 30 ? "0 0 12px #94a3b888" : "none",
          }}/>
          {/* 단계 구분선 */}
          {DAILY_REWARD_TIERS.map(tier => (
            <div key={tier.tier} style={{
              position:"absolute", top:0, bottom:0,
              left:`${Math.round(tier.requiredPts/maxPts*100)}%`,
              width:2, background:"#080f1a", opacity:0.6,
            }}/>
          ))}
        </div>
        {/* 단계 마커 */}
        {DAILY_REWARD_TIERS.map(tier => {
          const markerPct = Math.round(tier.requiredPts / maxPts * 100);
          const isCleared = cleared.includes(tier.tier);
          return (
            <div key={tier.tier} style={{
              position:"absolute", top:-8,
              left:`${markerPct}%`, transform:"translateX(-50%)",
              textAlign:"center",
            }}>
              <div style={{
                width:22, height:22, borderRadius:99,
                background: isCleared ? tier.color : "#1e293b",
                border:`2px solid ${tier.color}`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:10, fontWeight:900,
                color: isCleared ? "#0f172a" : tier.color,
                boxShadow: isCleared ? `0 0 10px ${tier.glow}` : "none",
              }}>
                {isCleared ? "✓" : tier.tier}
              </div>
            </div>
          );
        })}
        {/* 단계 라벨 */}
        <div style={{ display:"flex", justifyContent:"space-between",
                      marginTop:18, paddingLeft:0 }}>
          {DAILY_REWARD_TIERS.map(tier => (
            <div key={tier.tier} style={{
              flex:1, textAlign:"center", fontSize:10,
              color: cleared.includes(tier.tier) ? tier.color : "#475569",
              fontWeight: cleared.includes(tier.tier) ? 800 : 400,
            }}>
              {tier.label} {tier.requiredPts}P
            </div>
          ))}
        </div>
      </div>

      {/* 단계별 보상 카드 */}
      {DAILY_REWARD_TIERS.map(tier => {
        const isCleared = cleared.includes(tier.tier);
        const prevTier = DAILY_REWARD_TIERS.find(t => t.tier === tier.tier - 1);
        const prevPts = prevTier ? prevTier.requiredPts : 0;
        const segPct = tier.tier === 1
          ? Math.min(100, Math.round(gaugePts / tier.requiredPts * 100))
          : Math.min(100, Math.max(0, Math.round(
              (gaugePts - prevPts) / (tier.requiredPts - prevPts) * 100
            )));

        return (
          <div key={tier.tier} style={{
            marginBottom:12, padding:"14px 14px",
            borderRadius:12,
            border:`1px solid ${isCleared ? tier.color : "#1e293b"}`,
            background: isCleared ? tier.color+"12" : "#0d1520",
          }}>
            <div style={{ display:"flex", alignItems:"center",
                          gap:10, marginBottom:10 }}>
              <div style={{
                width:28, height:28, borderRadius:99,
                background: isCleared ? tier.color : "#1e293b",
                border:`2px solid ${tier.color}`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:12, fontWeight:900,
                color: isCleared ? "#0f172a" : tier.color,
                flexShrink:0,
              }}>
                {isCleared ? "✓" : tier.tier}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:800, fontSize:13,
                              color: isCleared ? tier.color : "#f1f5f9" }}>
                  {tier.label} 보상
                  {isCleared && " — 달성! 🎉"}
                </div>
                <div style={{ fontSize:10, color:"#64748b" }}>
                  {tier.requiredPts}P 달성 시 랜덤 보상 {3 * tier.mult}개 획득
                </div>
              </div>
              <div style={{ fontSize:12, fontWeight:800,
                            color: isCleared ? tier.color : "#475569" }}>
                {isCleared ? `+${3*tier.mult}개` : `${segPct}%`}
              </div>
            </div>

            {/* 세그먼트 게이지 */}
            {!isCleared && (
              <div style={{ background:"#1e293b", borderRadius:99,
                            height:6, overflow:"hidden", marginBottom:8 }}>
                <div style={{
                  width:`${segPct}%`, height:"100%",
                  background:`linear-gradient(90deg,${tier.glow},${tier.color})`,
                  borderRadius:99, transition:"width 0.5s ease",
                }}/>
              </div>
            )}

            {/* 보상 아이템 미리보기 */}
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {tier.items.map(item => (
                <div key={item.id} style={{
                  padding:"3px 8px", borderRadius:99, fontSize:10,
                  background:"#1e293b",
                  color: isCleared ? tier.color : "#64748b",
                  border:`1px solid ${isCleared ? tier.color+"40" : "#334155"}`,
                }}>
                  {item.icon} {item.label}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div style={{ textAlign:"center", fontSize:10, color:"#334155", marginTop:8 }}>
        💡 오늘의 퀘스트를 완료하면 게이지가 올라가요
      </div>
    </div>
  );
}

// ── 주머니(인벤토리) 컴포넌트 ────────────────────────────
function InventoryPanel({ state, setState, showToast }) {
  const inventory = state.inventory || {};

  // 모든 아이템 목록 (중복 제거)
  const allItems = [];
  const seen = new Set();
  DAILY_REWARD_TIERS.forEach(tier => {
    tier.items.forEach(item => {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        allItems.push(item);
      }
    });
  });

  const totalCount = Object.values(inventory).reduce((s,v)=>s+v,0);

  function useItem(itemId, label) {
    const count = inventory[itemId] || 0;
    if (count <= 0) return;
    setState(s => ({
      ...s,
      inventory: { ...s.inventory, [itemId]: Math.max(0, (s.inventory[itemId]||0) - 1) },
    }));
    showToast(`✅ ${label} 사용됨!`, "special");
  }

  return (
    <div style={{ paddingTop:12 }}>
      <div style={{ display:"flex", justifyContent:"space-between",
                    alignItems:"center", marginBottom:14 }}>
        <div>
          <div style={{ fontSize:14, fontWeight:800, color:"#f1f5f9" }}>
            🎒 보상 주머니
          </div>
          <div style={{ fontSize:11, color:"#64748b" }}>
            보상 게이지를 채우면 여기에 아이템이 쌓여요
          </div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:10, color:"#64748b" }}>총 보유</div>
          <div style={{ fontSize:22, fontWeight:900, color:"#fbbf24" }}>
            {totalCount}<span style={{ fontSize:11, color:"#f59e0b" }}>개</span>
          </div>
        </div>
      </div>

      {totalCount === 0 ? (
        <div style={{ textAlign:"center", padding:"40px 20px",
                      color:"#334155", fontSize:13 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🎒</div>
          <div>아직 아이템이 없어요</div>
          <div style={{ fontSize:11, marginTop:6 }}>
            보상 탭에서 게이지를 채워보세요!
          </div>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {allItems.map(item => {
            const count = inventory[item.id] || 0;
            if (count === 0) return null;
            return (
              <div key={item.id} style={{
                padding:"14px 12px", borderRadius:12,
                background:"#0d1520",
                border:"1px solid #1e293b",
                textAlign:"center",
                position:"relative",
              }}>
                {/* 수량 뱃지 */}
                <div style={{
                  position:"absolute", top:8, right:8,
                  background:"#f59e0b", color:"#0f172a",
                  borderRadius:99, fontSize:9, fontWeight:900,
                  padding:"2px 7px", lineHeight:1.5,
                }}>
                  ×{count}
                </div>
                <div style={{ fontSize:30, marginBottom:6 }}>{item.icon}</div>
                <div style={{ fontSize:11, fontWeight:700,
                              color:"#f1f5f9", marginBottom:10 }}>
                  {item.label}
                </div>
                <button onClick={()=>useItem(item.id, item.label)}
                  style={{
                    padding:"6px 14px", borderRadius:99, border:"none",
                    background:"#f59e0b", color:"#0f172a",
                    cursor:"pointer", fontSize:11, fontWeight:800,
                  }}>
                  사용하기
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
