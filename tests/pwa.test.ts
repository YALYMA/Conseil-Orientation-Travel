import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import manifest from "@/app/manifest";

const root = path.resolve(__dirname, "..");
/** Dimensions réelles d'un PNG (en-tête IHDR). */
const pngSize = (f: string) => { const b = fs.readFileSync(f); expect(b.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a"); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };

describe("application installable (PWA)", () => {
  const m = manifest();
  it("le manifeste est complet et en plein écran", () => {
    expect(m.display).toBe("standalone"); expect(m.start_url).toBe("/"); expect(m.lang).toBe("fr"); expect(m.name).toBe("Conseil-Orientation-Travel");
    expect(m.theme_color).toBe("#063B70");
  });
  it("chaque icône déclarée existe avec la taille annoncée", () => {
    for (const i of m.icons ?? []) {
      const [w, h] = pngSize(path.join(root, "public", i.src.replace(/^\//, "")));
      expect(`${w}x${h}`, i.src).toBe(i.sizes);
    }
  });
  it("fournit une icône « maskable » et une icône Apple", () => {
    expect((m.icons ?? []).some((i) => i.purpose === "maskable")).toBe(true);
    expect(pngSize(path.join(root, "src/app/apple-icon.png"))).toEqual([180, 180]);
  });
  it("les raccourcis pointent vers des routes existantes", () => {
    const routes = ["src/app/(public)/orientation/page.tsx", "src/app/app/dashboard/page.tsx"];
    for (const r of routes) expect(fs.existsSync(path.join(root, r)), r).toBe(true);
    expect((m.shortcuts ?? []).map((s) => s.url)).toEqual(["/orientation", "/app/dashboard"]);
  });
});
