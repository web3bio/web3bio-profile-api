import { serializeEnsWidgetsFromTexts } from "@/utils/ens-widgets";

describe("serializeEnsWidgetsFromTexts", () => {
  it("returns a native array (not a JSON string) on the wire", () => {
    const texts = {
      widgets: JSON.stringify([
        { n: "GitHub", u: "https://github.com/foo" },
        { n: "Links", u: ["https://a.com", "https://b.com"], w: "card" },
      ]),
      links: JSON.stringify([
        { name: "GitHub", url: "https://github.com/merged" },
      ]),
    };

    const widgets = serializeEnsWidgetsFromTexts(texts);
    expect(Array.isArray(widgets)).toBe(true);

    const wire = JSON.stringify({ widgets });
    expect(wire).not.toMatch(/"widgets":"\[/);
    expect(wire).toContain('"widgets":[{"name":"GitHub"');

    const github = widgets?.find((w) => w.name === "GitHub");
    expect(github?.url).toBe("https://github.com/merged");

    const links = widgets?.find((w) => w.name === "Links");
    expect(links?.url).toEqual(["https://a.com", "https://b.com"]);
    expect(links?.widget).toBe("card");
  });

  it("returns null when texts are missing or empty", () => {
    expect(serializeEnsWidgetsFromTexts(undefined)).toBeNull();
    expect(serializeEnsWidgetsFromTexts({})).toBeNull();
  });
});
