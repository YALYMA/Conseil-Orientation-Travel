import chromium from "@sparticuz/chromium"; import puppeteer from "puppeteer-core";
const BASE = process.argv[2];
if (!BASE) { console.error("Usage : node interact.mjs http://localhost:3000"); process.exit(1); }
const b = await puppeteer.launch({ args: [...chromium.args, "--no-sandbox"], executablePath: await chromium.executablePath(), headless: "shell" });
const results = []; const ok = (n, c, d = "") => { results.push(`${c ? "✓" : "✗ ÉCHEC"}  ${n}${d ? "  — " + d : ""}`); };
const noise = /ERR_ABORTED|_rsc/;
async function mobilePage(w = 390) {
  const p = await b.newPage(); p.errs = []; p.on("console", (m) => { if (["error", "warning"].includes(m.type())) p.errs.push(m.text().slice(0, 200)); }); p.on("pageerror", (e) => p.errs.push("pageerror: " + String(e).slice(0, 200)));
  await p.setViewport({ width: w, height: 800, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); return p;
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// 1. Menu mobile public : ouverture, navigation, fermeture automatique
{ const p = await mobilePage(); await p.goto(BASE + "/", { waitUntil: "load" }); await wait(1200);
  await p.click('button[aria-label="Ouvrir le menu"]'); await wait(300);
  await wait(900);
  const open = await p.$('#mobile-menu'); ok("menu mobile s'ouvre (hydratation + CSP)", !!open);
  const g = await p.evaluate(() => { const r = document.querySelector('#mobile-menu').getBoundingClientRect(); return { h: Math.round(r.height), bottom: Math.round(r.bottom), vh: innerHeight }; });
  ok("le panneau du menu couvre l'écran (hauteur utile)", g.h > 400 && Math.abs(g.bottom - g.vh) <= 2, `${g.h}px de haut, bas à ${g.bottom}/${g.vh}`);
  await p.screenshot({ path: "/tmp/qa/out/i-menu.png" });
  const link = await p.evaluateHandle(() => [...document.querySelectorAll('#mobile-menu a')].find((a) => a.textContent.includes("Nos packs")));
  await link.asElement().click(); await p.waitForFunction(() => location.pathname === "/packs", { timeout: 15000 }).catch(() => {}); await wait(600);
  ok("navigation via le menu mène à /packs", new URL(p.url()).pathname === "/packs", p.url());
  ok("le menu se ferme après navigation", !(await p.$('#mobile-menu')));
  ok("aucune erreur console / CSP (menu)", p.errs.filter((e) => !noise.test(e)).length === 0, p.errs.filter((e) => !noise.test(e)).join(" | ")); await p.close(); }
// 2. Test d'orientation complet
{ const p = await mobilePage(); await p.goto(BASE + "/orientation", { waitUntil: "load" }); await wait(1200);
  let steps = 0;
  for (let i = 0; i < 12; i++) {
    const kind = await p.evaluate(() => document.querySelector('input[type=radio]') ? "radio" : document.querySelector('input[type=checkbox]') ? "check" : document.querySelector('input[type=number]') ? "num" : document.querySelector('textarea') ? "text" : "none");
    if (kind === "none") break;
    if (kind === "radio" || kind === "check") await p.evaluate(() => document.querySelector('label:has(input)').click());
    if (kind === "num") { await p.type('input[type=number]', "2027"); }
    const label = await p.evaluate(() => [...document.querySelectorAll("button")].find((b) => /Suivant|Voir mon diagnostic/.test(b.textContent))?.textContent);
    await p.evaluate(() => [...document.querySelectorAll("button")].find((b) => /Suivant|Voir mon diagnostic/.test(b.textContent)).click()); steps++; await wait(250);
    if (/diagnostic/.test(label ?? "")) break;
  }
  await wait(400);
  const txt = await p.evaluate(() => document.body.innerText);
  ok("test d'orientation : 9 questions parcourues", steps === 9, `${steps} étapes`);
  ok("diagnostic affiché", /Votre profil/.test(txt) && /Nous vous recommandons/.test(txt));
  ok("aucune promesse d'admission dans le diagnostic", !/serez accepté|admission garantie|visa garanti/i.test(txt));
  await p.screenshot({ path: "/tmp/qa/out/i-quiz-result.png", fullPage: false });
  ok("aucune erreur console / CSP (test)", p.errs.filter((e) => !noise.test(e)).length === 0, p.errs.filter((e) => !noise.test(e)).join(" | ")); await p.close(); }
await b.close(); console.log(results.join("\n"));
