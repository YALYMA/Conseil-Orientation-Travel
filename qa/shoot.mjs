// Usage: node shoot.mjs <baseUrl> <tag> <chemin1,chemin2,...> [largeurs=360,390,768,1280]
// Mesure par page et par largeur : débordement horizontal (comparé à la largeur VOULUE, pas à innerWidth), erreurs de console / CSP,
// images cassées, cibles tactiles < 40 px (SMALL=1 pour le détail). Capture dans qa/out/.
import fs from "node:fs";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
const [base, tag, pathsArg, widthsArg] = process.argv.slice(2);
const paths = pathsArg.split(","); const widths = (widthsArg ?? "360,390,768,1280").split(",").map(Number);
fs.mkdirSync("qa-out", { recursive: true });
const browser = await puppeteer.launch({ args: [...chromium.args, "--no-sandbox"], executablePath: await chromium.executablePath(), headless: "shell" });
const report = [];
for (const path of paths) for (const w of widths) {
  const page = await browser.newPage();
  const issues = { console: [], pageerrors: [], failed: [] };
  page.on("console", (m) => { if (["error", "warning"].includes(m.type())) issues.console.push(m.text().slice(0, 220)); });
  page.on("pageerror", (e) => issues.pageerrors.push(String(e).slice(0, 220)));
  page.on("requestfailed", (r) => issues.failed.push(`${r.url().slice(0, 90)} ${r.failure()?.errorText}`));
  await page.setViewport({ width: w, height: w < 600 ? 800 : 900, deviceScaleFactor: w < 600 ? 2 : 1, isMobile: w < 600, hasTouch: w < 600 });
  const res = await page.goto(base + path, { waitUntil: "load", timeout: 45000 }).catch((e) => ({ status: () => "ERR " + e.message.slice(0, 60) }));
  await new Promise((r) => setTimeout(r, 1200));
  const evalOnce = () => page.evaluate((W) => {
    const over = [];
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
      if (r.width === 0 || cs.position === "fixed" || cs.display === "none") continue;
      let p = el.parentElement, clipped = false; while (p && p !== document.body) { const o = getComputedStyle(p).overflowX; if (o !== "visible") { clipped = true; break; } p = p.parentElement; }
      if (!clipped && r.right > W + 1) over.push(`${el.tagName.toLowerCase()}.${String(el.className).split(" ").slice(0, 2).join(".")} +${Math.round(r.right - W)}px`);
    }
    const small = [...document.querySelectorAll("a[href],button,input,select,summary")].filter((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && cs.visibility !== "hidden" && (r.height < 40 || r.width < 40) && !e.closest(".sr-only") && cs.position !== "absolute" && !(e.tagName === "A" && e.closest("p, label, figcaption")); }).map((e) => `${e.tagName.toLowerCase()}:"${(e.textContent || e.getAttribute("aria-label") || "").trim().slice(0, 24)}" ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`);
    const brokenImg = [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src.slice(0, 80));
    return { scrollW: document.documentElement.scrollWidth, W, over: over.slice(0, 5), small: small.slice(0, 6), smallCount: small.length, brokenImg, h: document.documentElement.scrollHeight };
  }, w);
  let m; for (let t = 0; t < 3; t++) { try { m = await evalOnce(); break; } catch (e) { if (t === 2) throw e; await new Promise((r) => setTimeout(r, 800)); } }
  const file = `qa-out/${tag}-${(path === "/" ? "home" : path.replace(/[\/?=&]/g, "_").replace(/^_/, ""))}-${w}.png`;
  await page.screenshot({ path: file, fullPage: true });
  report.push({ path, w, status: res.status?.(), hOverflow: m.scrollW > m.W, scrollW: m.scrollW, over: m.over, smallTargets: m.smallCount, smallEx: m.small, brokenImg: m.brokenImg, ...issues, height: m.h, file });
  await page.close();
}
await browser.close();
for (const r of report) {
  const flags = [r.hOverflow ? `DÉBORDE(${r.scrollW})` : "", r.over.length ? `éléments:${r.over.join(" | ")}` : "", r.smallTargets ? `cibles<40px:${r.smallTargets}` : "", r.console.length ? `console:${r.console.length}` : "", r.pageerrors.length ? `ERREURS-JS:${r.pageerrors.length}` : "", r.failed.length ? `échecs-réseau:${r.failed.length}` : "", r.brokenImg.length ? `IMG-CASSÉE` : ""].filter(Boolean).join("  ");
  console.log(`${String(r.status).padEnd(4)} ${r.path.padEnd(22)} ${String(r.w).padStart(4)}px  h=${r.height}  ${flags || "✓ propre"}`);
  if (process.env.SMALL) for (const c of r.smallEx) console.log("      cible:", c);
  for (const c of r.console.slice(0, 3)) console.log("      console:", c);
  for (const c of r.pageerrors.slice(0, 2)) console.log("      pageerror:", c);
  for (const c of r.failed.slice(0, 2)) console.log("      réseau:", c);
}
