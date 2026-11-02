import {giftTotal,projectedGiftRound} from './gift-game.js';
// Presentation only: derive exact before/after amounts without mutating awards.
// The final token and sound share one committed-clock landing.
const GIFT_CASH_BANK_MS = 620;
const GIFT_MULTIPLIER_BANK_MS = 650;
const GIFT_BANK_SETTLE_MS = 180;
const clamp = (x) => Math.max(0, Math.min(1, x));
const smooth = (x) => {
  x = clamp(x);
  return x * x * (3 - 2 * x);
};
function giftTotalFlow(round, time, { reduced = false } = {}) {
  const shown = projectedGiftRound(round, time), total = giftTotal(shown), multiplier = String(shown?.multiplier ?? 1);
  const idle = { total, multiplier, fitTotal: total, before: total, after: total, kind: "", pending: false, active: false, impact: 0, spark: 0, tokens: [] };
  const shot = round?.flight ?? round?.opened.at(-1);
  if (!shot || time < shot.revealAt || !["cash", "multiply"].includes(shot.prize.kind)) return idle;
  const kind = shot.prize.kind, cash = BigInt(shown.cashCents), factor = BigInt(multiplier);
  const priorCash = kind === "cash" ? cash - BigInt(Math.round(shot.prize.value * 100)) : cash;
  const priorFactor = kind === "multiply" ? factor / BigInt(shot.prize.value) : factor;
  const before = (priorCash * priorFactor).toString(), age = time - shot.revealAt;
  const eligible = kind === "multiply" || before !== total, land = kind === "cash" ? GIFT_CASH_BANK_MS : GIFT_MULTIPLIER_BANK_MS;
  const pending = eligible && age < land, active = eligible && age < land + GIFT_BANK_SETTLE_MS;
  const impact = !reduced && eligible && age >= land ? 1 - smooth((age - land) / GIFT_BANK_SETTLE_MS) : 0;
  const tokens = [];
  if (!reduced && active) {
    for (let i = 0; i < (kind === "cash" ? 2 : 1); i++) {
      const start = kind === "cash" ? 250 + i * 50 : 310, end = kind === "cash" ? land - (1 - i) * 50 : land, t = (age - start) / (end - start);
      if (t <= 0 || t >= 1) continue;
      const point = (progress) => {
        const u = smooth(clamp(progress));
        return { x: Math.round(60 + 266 * u), y: Math.round(5 + 13 * smooth((u - 0.72) / 0.28)) };
      };
      const opacity = smooth(t / 0.1);
      tokens.push({ ...point(t), opacity, trail: [0.065, 0.13].map((lag, index) => ({ ...point(t - lag), opacity: t > lag ? opacity * (0.32 - index * 0.12) : 0 })) });
    }
  }
  return {
    ...idle,
    total: pending ? before : total,
    multiplier: pending ? String(priorFactor) : multiplier,
    fitTotal: total,
    before,
    after: total,
    kind,
    pending,
    active,
    impact,
    spark: !reduced && eligible && age > land && age < land + GIFT_BANK_SETTLE_MS ? Math.sin(Math.PI * (age - land) / GIFT_BANK_SETTLE_MS) : 0,
    tokens
  };
}
function giftTotalFlowArt() {
  const coin = '<path d="M2 0h4v1h1v1h1v4H7v1H6v1H2V7H1V6H0V2h1V1h1Z" fill="#a66d50"/><path d="M2 1h4v1h1v3H6v2H2V6H1V2h1Z" fill="#f0c17b"/><path d="M2 1h3v1H3v1H2v2H1V2h1Z" fill="#fff4ce"/><path d="M4 3h1v3H3V5h1Z" fill="#b37b53"/>';
  const gem = '<path d="M3 0h2v1h1v1h1v1h1v2H7v1H6v1H5v1H3V7H2V6H1V5H0V3h1V2h1V1h1Z" fill="#93629d"/><path d="M3 1h2v1h1v1h1v2H6v1H5v1H3V6H2V5H1V3h1V2h1Z" fill="#e3b0f7"/><path d="M3 1h2v1H3v1H2v2H1V3h1V2h1Z" fill="#fff0ff"/><path d="M5 4h2v1H6v1H5v1H4V6h1Z" fill="#ba7fd3"/>';
  return `<svg class="gift-total-flow" viewBox="0 0 396 80" aria-hidden="true" shape-rendering="crispEdges">${Array.from({ length: 2 }, () => '<g class="gift-bank-token" opacity="0"><g class="gift-bank-trails"><path d="M0 0h2v2H0Z"/><path d="M0 0h2v2H0Z"/></g><g class="gift-bank-coin">' + coin + '</g><g class="gift-bank-gem">' + gem + "</g></g>").join("")}<g class="gift-bank-spark" opacity="0"><path d="M319 14h1v2h2v1h-2v2h-1v-2h-2v-1h2ZM331 20h1v1h1v1h-1v1h-1v-1h-1v-1h1Z"/></g></svg>`;
}
function applyGiftTotalFlow(svg, flow) {
  svg.dataset.kind = flow.kind;
  svg.style.display = flow.active ? "" : "none";
  [...svg.querySelectorAll(".gift-bank-token")].forEach((g, i) => {
    const token = flow.tokens[i];
    g.setAttribute("opacity", String(token?.opacity ?? 0));
    if (!token) return;
    for (const shape of g.querySelectorAll(".gift-bank-coin,.gift-bank-gem")) shape.setAttribute("transform", `translate(${token.x - 4} ${token.y - 4})`);
    [...g.querySelectorAll(".gift-bank-trails path")].forEach((p, j) => {
      const trail = token.trail[j];
      p.setAttribute("transform", `translate(${trail.x - 1} ${trail.y - 1})`);
      p.setAttribute("opacity", String(trail.opacity));
    });
  });
  svg.querySelector(".gift-bank-spark").setAttribute("opacity", String(flow.spark));
}


export {GIFT_CASH_BANK_MS,GIFT_MULTIPLIER_BANK_MS,GIFT_BANK_SETTLE_MS,giftTotalFlow,giftTotalFlowArt,applyGiftTotalFlow};
