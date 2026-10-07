import { describe, expect, it } from "vitest";
import { mapCountry, mapPack } from "@/lib/content/map";
import { EXCLUDED_DEFAULT } from "@/lib/content/defaults";

describe("mappage du contenu public", () => {
  it("trie les fonctionnalités et applique la liste d'exclusions par défaut si vide", () => {
    const p = mapPack({ slug: "x", name: "X", tagline: null, price_total: 40000, badge: null, indicative_duration: null, included_applications: null, excluded_services: [],
      pack_features: [{ label: "B", sort_order: 2 }, { label: "A", sort_order: 1 }] });
    expect(p.features).toEqual(["A", "B"]);
    expect(p.excluded).toEqual(EXCLUDED_DEFAULT);
    expect(p.price).toBe(40000);
  });
  it("conserve les exclusions propres au pack", () => {
    expect(mapPack({ slug: "x", name: "X", tagline: "", price_total: 1, badge: null, indicative_duration: "", included_applications: 3, excluded_services: ["Visa"], pack_features: [] }).excluded).toEqual(["Visa"]);
  });
  it("n'expose jamais un lien non https venu de la base", () => {
    const c = mapCountry({ slug: "f", name: "F", flag: null, summary: null, description: null, institution_types: null, budget_info: null, visa_info: null, housing_info: null,
      official_links: [{ label: "ok", url: "https://a.test" }, { label: "mauvais", url: "javascript:alert(1)" }, { url: "http://b.test" }, null, "x"],
      country_procedures: [{ id: "1", title: "P", body: null, required_documents: null, official_url: "http://x.test", last_verified_at: null, sort_order: 1 }] });
    expect(c.links).toEqual([{ label: "ok", url: "https://a.test" }]);
    expect(c.procedures[0].officialUrl).toBeNull();
  });
  it("tolère un JSON de liens invalide", () => {
    expect(mapCountry({ slug: "f", name: "F", flag: null, summary: null, description: null, institution_types: null, budget_info: null, visa_info: null, housing_info: null, official_links: "n'importe quoi" }).links).toEqual([]);
  });
});
