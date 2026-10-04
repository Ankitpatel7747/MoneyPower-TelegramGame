const SUPABASE_URL = "https://vmvymoskytpjxeyjsyza.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_sAYkfj4KQcdnKvMMAcxysQ_1JQk4GJm";
const LAUNCH_ANCHOR = new Date("2026-10-03T00:00:00Z");
const LOGO_FALLBACK = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgMTI4IDEyOCI+PHJhdGlvbiByeD0iMSIgcnk9IjEiPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0iZyIgY3V0b2ZmPSJ1c2UiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iIzc2NDFmZiIgLz48c3RvcCBvZmZzZXQ9IjEuIiBzdG9wLWNvbG9yPSIjMzhkNmZmIiAvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxjaXJjbGUgY3g9IjY0IiBjeT0iNjQiIHI9IjY0IiBmaWxsPSJ1cmwoI2cpIi8+PGNpcmNsZSBjeD0iNjQiIGN5PSI2NCIgcj0iNTUiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzlhYjJlMSIgc3Ryb2tlLXdpZHRoPSIyIi8+PGNpcmNsZSBjeD0iNTQiIGN5PSI2NCIgcj0iMjQiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjE2Ii8+PGcgdHJhbnNmb3JtPSJyb3RhdGUoLTQ1IDE2MCA2NDApIiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjEiIG9wYWNpdHk9IjAuNjQiPjxwYXRoIGQ9Ik0gMzQgNjAgQyAxMiA2MCAtMCA2MyAxMCA1NiBMIDQyIDMyIEMgNTAgMjYgNTQgMTEgNjYgMCAgNzQgMCAgODEgOSAgOTAgMTkgOTYgMjggOTIgMzUgODQgNDIgODAgNTQgOTIgNjAgOTMgNzQgODYgODQgODAgOTUgNzAgOTIgNTEgOTAgMzQgOTAgMjQgOTwgLz48L2c+PC9yYXRpb24+PC9zdmc+";

const state = {
  telegramId: "guest",
  playerName: "Player",
  displayName: "Player",
  avatarUrl: "",
  username: "",
  tokens: 0,
  tapPower: 10,
  tapPowerBonus: 0,
  maxEnergy: 500,
  energy: 500,
  rechargeSpeed: 5,
  profitPerHour: 150,
  pphLevel: 0,
  walletAddress: "",
  taskYT: false,
  taskInsta: false,
  taskTG: false,
  adsCount: 0,
  referralsCount: 0,
  createdAt: new Date().toISOString(),
  lastClaim: new Date().toISOString(),
};

let supabase = null;
let saveTimer = null;
let walletUnlocked = false;

const els = {};

window.addEventListener("DOMContentLoaded", async () => {
  cacheElements();
  applyLogoFallbacks();
  hydrateTelegramProfile();
  bindEvents();
  evaluateWalletLock();
  loadAdsgramBanner();
  setSplashScreen();

  await initSupabase();
  await ensureUserProfile();
  calculateOfflineMining();
  applyStateToUI();
  startEnergyLoop();
});

function cacheElements() {
  els.splash = document.getElementById("splash");
  els.playerAvatar = document.getElementById("player-avatar");
  els.tapBtn = document.getElementById("tap-btn");
  els.tokenValue = document.getElementById("token-value");
  els.tapPowerValue = document.getElementById("tap-power-value");
  els.pphValue = document.getElementById("pph-value");
  els.energyValue = document.getElementById("energy-value");
  els.energyText = document.getElementById("energy-text");
  els.energyFill = document.getElementById("energy-fill");
  els.tapStatus = document.getElementById("tap-status");
  els.walletStatusText = document.getElementById("wallet-status-text");
  els.walletButton = document.getElementById("wallet-button");
  els.maxEnergyBtn = document.getElementById("max-energy-btn");
  els.rechargeBtn = document.getElementById("recharge-btn");
  els.pphBtn = document.getElementById("pph-btn");
  els.tasks = Array.from(document.querySelectorAll(".task-btn"));
  els.adsBanner = document.getElementById("adsgram-banner");
  els.adBtn = document.getElementById("watch-ad-btn");
}

function applyLogoFallbacks() {
  const logoImgs = document.querySelectorAll("img");
  logoImgs.forEach((img) => {
    img.addEventListener("error", () => {
      if (img.src !== LOGO_FALLBACK) {
        img.src = LOGO_FALLBACK;
      }
    });
  });
}

function hydrateTelegramProfile() {
  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  const user = tg && tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user : {};

  const firstName = user.first_name || "Player";
  const lastName = user.last_name || "";
  const username = (user.username || "").replace(/^@/, "").trim();
  const telegramId = String(user.id || `guest-${Date.now()}`);
  const avatarUrl = user.photo_url || "";

  state.telegramId = telegramId;
  state.playerName = firstName;
  state.username = username;

  let baseName = username || `${firstName}${lastName}`.trim() || "Player";
  state.displayName = baseName;
  state.avatarUrl = avatarUrl || "";

  if (tg) {
    tg.ready();
    tg.expand();
    tg.setHeaderColor("#0b1220");
    tg.setBackgroundColor("#0b1220");
  }

  if (state.avatarUrl) {
    els.playerAvatar.src = state.avatarUrl;
  } else {
    els.playerAvatar.src = LOGO_FALLBACK;
  }
}

function bindEvents() {
  els.tapBtn.addEventListener("click", handleTap);

  els.maxEnergyBtn.addEventListener("click", () => buyUpgrade("maxEnergy"));
  els.rechargeBtn.addEventListener("click", () => buyUpgrade("recharge"));
  els.pphBtn.addEventListener("click", () => buyUpgrade("pph"));

  els.walletButton.addEventListener("click", connectWallet);
  els.adBtn.addEventListener("click", watchRewardedAd);

  els.tasks.forEach((taskBtn) => {
    taskBtn.addEventListener("click", () => claimTask(taskBtn.dataset.task));
  });
}

function setSplashScreen() {
  setTimeout(() => {
    els.splash.classList.add("hidden");
  }, 3000);
}

function handleTap() {
  const tapCost = state.tapPower;

  if (state.energy < tapCost) {
    els.tapStatus.textContent = "Low Energy";
    return;
  }

  state.energy = Math.max(0, state.energy - tapCost);

  const gain = state.tapPower + state.tapPowerBonus;
  state.tokens += gain;
  state.lastClaim = new Date().toISOString();

  const burst = document.createElement("span");
  burst.className = "tap-burst";
  els.tapBtn.appendChild(burst);
  setTimeout(() => burst.remove(), 350);

  els.tapStatus.textContent = `+${gain} tokens`;
  applyStateToUI();
  scheduleSave();
}

function buyUpgrade(type) {
  if (type === "maxEnergy") {
    if (state.maxEnergy >= 10500) {
      els.maxEnergyBtn.disabled = true;
      return;
    }
    const cost = getMaxEnergyUpgradeCost();
    if (state.tokens < cost) {
      els.tapStatus.textContent = "Not enough tokens";
      return;
    }
    state.tokens -= cost;
    state.maxEnergy = Math.min(10500, state.maxEnergy + 500);
    state.energy = state.maxEnergy;
    els.tapStatus.textContent = "Max Energy upgraded";
  }

  if (type === "recharge") {
    if (state.rechargeSpeed >= 19) {
      els.rechargeBtn.disabled = true;
      return;
    }
    const cost = getRechargeUpgradeCost();
    if (state.tokens < cost) {
      els.tapStatus.textContent = "Not enough tokens";
      return;
    }
    state.tokens -= cost;
    state.rechargeSpeed = Math.min(19, Number((state.rechargeSpeed + 1.2).toFixed(1)));
    els.tapStatus.textContent = "Recharge speed upgraded";
  }

  if (type === "pph") {
    const cost = getPPHUpgradeCost();
    if (state.tokens < cost) {
      els.tapStatus.textContent = "Not enough tokens";
      return;
    }
    state.tokens -= cost;
    state.pphLevel += 1;
    state.profitPerHour = 150 + state.pphLevel * 150;
    els.tapStatus.textContent = "PPH upgraded";
  }

  applyStateToUI();
  scheduleSave();
}

function getMaxEnergyUpgradeCost() {
  return Math.round(10000 * Math.pow(2, Math.max(0, state.maxEnergy / 500 - 1)));
}

function getRechargeUpgradeCost() {
  return Math.round(2200 * Math.pow(2.2, Math.max(0, ((state.rechargeSpeed - 5) / 1.2) + 0.0001)));
}

function getPPHUpgradeCost() {
  return Math.round(2500 * Math.pow(2, state.pphLevel));
}

function claimTask(taskKey) {
  const button = els.tasks.find((btn) => btn.dataset.task === taskKey);
  if (!button || button.disabled) return;

  const urls = {
    yt: "https://youtube.com/@yourchannel",
    insta: "https://instagram.com/yourprofile",
    tg: "https://t.me/yourchannel",
  };

  if (urls[taskKey]) {
    window.open(urls[taskKey], "_blank", "noopener,noreferrer");
  }

  button.disabled = true;
  button.classList.add("done");
  button.querySelector(".task-state").textContent = "Verifying...";

  setTimeout(() => {
    button.querySelector(".task-state").textContent = "Done";
    state.tokens += 5000;
    state.lastClaim = new Date().toISOString();

    if (taskKey === "yt") state.taskYT = true;
    if (taskKey === "insta") state.taskInsta = true;
    if (taskKey === "tg") state.taskTG = true;

    applyStateToUI();
    scheduleSave();
  }, 3000);
}

function evaluateWalletLock() {
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - LAUNCH_ANCHOR.getTime()) / 86400000);

  if (diffDays < 3) {
    walletUnlocked = true;
    els.walletStatusText.textContent = "Testing Access";
    return;
  }

  if (diffDays >= 3 && diffDays < 162) {
    walletUnlocked = false;
    els.walletStatusText.textContent = "Wallet locked • coming soon";
    els.walletButton.textContent = "Wallet Locked";
    els.walletButton.disabled = true;
    return;
  }

  walletUnlocked = true;
  els.walletStatusText.textContent = "Wallet Unlocked";
  els.walletButton.textContent = "Connect Web3 Wallet";
  els.walletButton.disabled = false;
}

function connectWallet() {
  evaluateWalletLock();

  if (!walletUnlocked) {
    els.walletStatusText.textContent = "Wallet locked • gameplay unlocks on day 162";
    els.walletButton.textContent = "Wallet Locked";
    els.walletButton.disabled = true;
    return;
  }

  if (window.ethereum) {
    window.ethereum
      .request({ method: "eth_requestAccounts" })
      .then((accounts) => {
        state.walletAddress = accounts[0] || "";
        els.walletStatusText.textContent = "Connected";
        els.walletButton.textContent = "Wallet Connected";
        els.walletButton.disabled = true;
        scheduleSave();
      })
      .catch(() => {
        els.walletStatusText.textContent = "Connection Cancelled";
      });
  } else {
    els.walletStatusText.textContent = "Wallet Not Found";
    els.walletButton.textContent = "No Wallet";
    els.walletButton.disabled = true;
  }
}

function watchRewardedAd() {
  state.adsCount += 1;
  state.tapPowerBonus += 3;
  els.tapStatus.textContent = "Reward granted +3 tap power";
  applyStateToUI();
  scheduleSave();

  if (window.Adsgram) {
    try {
      if (typeof window.Adsgram.showRewarded === "function") {
        window.Adsgram.showRewarded({ blockId: "46964" });
      } else if (typeof window.Adsgram.showVideo === "function") {
        window.Adsgram.showVideo({ blockId: "46964" });
      }
    } catch (error) {
      console.warn("Adsgram ad error:", error);
    }
  }
}

function calculateOfflineMining() {
  const lastSeen = new Date(state.lastClaim || Date.now());
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - lastSeen.getTime());
  const maxSeconds = 3 * 60 * 60;
  const elapsedSeconds = Math.min(diffMs / 1000, maxSeconds);
  const offlineReward = (elapsedSeconds / 3600) * state.profitPerHour;

  if (offlineReward > 0) {
    state.tokens += offlineReward;
    state.lastClaim = now.toISOString();
  }
}

function applyStateToUI() {
  const totalTapPower = state.tapPower + state.tapPowerBonus;
  state.profitPerHour = 150 + state.pphLevel * 150;

  els.tokenValue.innerHTML = `${formatNumber(state.tokens)} <small>MP</small>`;
  els.tapPowerValue.innerHTML = `${totalTapPower} <small>pts</small>`;
  els.pphValue.innerHTML = `${state.profitPerHour} <small>/hr</small>`;
  els.energyValue.innerHTML = `${Math.round(state.energy)} <small> / ${state.maxEnergy}</small>`;
  els.energyText.textContent = `${Math.round(state.energy)} / ${state.maxEnergy}`;
  els.energyFill.style.width = `${(state.energy / state.maxEnergy) * 100}%`;

  const maxEnergyCost = getMaxEnergyUpgradeCost();
  const rechargeCost = getRechargeUpgradeCost();
  const pphCost = getPPHUpgradeCost();

  els.maxEnergyBtn.textContent = formatNumber(maxEnergyCost);
  els.rechargeBtn.textContent = formatNumber(rechargeCost);
  els.pphBtn.textContent = formatNumber(pphCost);

  els.maxEnergyBtn.disabled = state.maxEnergy >= 10500 || state.tokens < maxEnergyCost;
  els.rechargeBtn.disabled = state.rechargeSpeed >= 19 || state.tokens < rechargeCost;
  els.pphBtn.disabled = state.tokens < pphCost;

  els.tasks.forEach((taskBtn) => {
    const key = taskBtn.dataset.task;
    const isDone = key === "yt" ? state.taskYT : key === "insta" ? state.taskInsta : state.taskTG;
    taskBtn.disabled = isDone;
    taskBtn.classList.toggle("done", isDone);
    taskBtn.querySelector(".task-state").textContent = isDone ? "Done" : "Claim";
  });
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });
}

function loadAdsgramBanner() {
  if (!els.adsBanner) return;

  if (window.Adsgram) {
    try {
      if (typeof window.Adsgram.renderBanner === "function") {
        window.Adsgram.renderBanner({ blockId: "46964", target: els.adsBanner });
        return;
      }
      if (typeof window.Adsgram.render === "function") {
        window.Adsgram.render({ blockId: "46964", container: els.adsBanner });
        return;
      }
    } catch (error) {
      console.warn("Adsgram banner render failed:", error);
    }
  }

  els.adsBanner.textContent = "Sponsored";
}

function startEnergyLoop() {
  setInterval(() => {
    if (state.energy < state.maxEnergy) {
      state.energy = Math.min(state.maxEnergy, Number((state.energy + state.rechargeSpeed).toFixed(1)));
    }
    applyStateToUI();
    scheduleSave();
  }, 1000);
}

async function initSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn("Supabase not configured.");
    return;
  }

  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

async function ensureUserProfile() {
  if (!supabase) return;

  const { data, error } = await supabase
    .from("users")
    .select(
      "telegram_id, created_at, display_name, tokens_earns, tap_power, profit_per_hour, pph_level, wallet_address, task_yt, task_insta, task_tg, ads_count, referrals_count, last_claim"
    )
    .eq("telegram_id", state.telegramId)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    console.error("Supabase fetch error:", error);
    return;
  }

  if (!data) {
    const defaultProfile = buildSupabasePayload();
    const { error: insertError } = await supabase
      .from("users")
      .upsert(defaultProfile, { onConflict: "telegram_id" });

    if (insertError) {
      console.error("Supabase upsert error:", insertError);
    }
    return;
  }

  hydrateStateFromDb(data);
}

function hydrateStateFromDb(data) {
  state.telegramId = data.telegram_id || state.telegramId;
  state.displayName = data.display_name || state.displayName;
  state.tokens = Number(data.tokens_earns || 0);
  state.tapPower = Number(data.tap_power || state.tapPower);
  state.tapPowerBonus = 0;
  state.profitPerHour = Number(data.profit_per_hour || state.profitPerHour);
  state.pphLevel = Number(data.pph_level || state.pphLevel);
  state.walletAddress = data.wallet_address || "";
  state.taskYT = Boolean(data.task_yt);
  state.taskInsta = Boolean(data.task_insta);
  state.taskTG = Boolean(data.task_tg);
  state.adsCount = Number(data.ads_count || 0);
  state.referralsCount = Number(data.referrals_count || 0);
  state.createdAt = data.created_at || state.createdAt;
  state.lastClaim = data.last_claim || state.lastClaim;
}

function buildSupabasePayload() {
  return {
    telegram_id: state.telegramId,
    created_at: state.createdAt,
    display_name: state.displayName,
    tokens_earns: Number(state.tokens),
    tap_power: Number(state.tapPower + state.tapPowerBonus),
    profit_per_hour: Number(state.profitPerHour),
    pph_level: Number(state.pphLevel),
    wallet_address: state.walletAddress || "",
    task_yt: Boolean(state.taskYT),
    task_insta: Boolean(state.taskInsta),
    task_tg: Boolean(state.taskTG),
    ads_count: Number(state.adsCount),
    referrals_count: Number(state.referralsCount),
    last_claim: new Date().toISOString(),
  };
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    await saveUserState();
  }, 1200);
}

async function saveUserState() {
  if (!supabase) return;

  const payload = buildSupabasePayload();

  try {
    const { error } = await supabase
      .from("users")
      .upsert(payload, { onConflict: "telegram_id" });

    if (error) {
      console.error("Save failed:", error);
      return;
    }

    state.lastClaim = payload.last_claim;
  } catch (error) {
    console.error("Unexpected save error:", error);
  }
}
