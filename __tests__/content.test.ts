import { describe, it, expect } from "vitest";
import { splitAge } from "lib/content/bio";
import { DEFAULT_CONTACT_LINKS, DEFAULT_PROFILE } from "lib/content/defaults";
import { CONTACT_ICONS, FACT_ICONS, isContactIcon, isFactIcon } from "lib/content/icons";
import { validateContactLinkInput, validateProfileInput } from "lib/security";
import { CONTACT_LINKS } from "lib/site";

describe("splitAge", () => {
  it("returns the paragraph unchanged when there is no token", () => {
    expect(splitAge("Hello there")).toEqual(["Hello there"]);
  });

  it("splits around each {age}", () => {
    expect(splitAge("I'm {age} years old")).toEqual(["I'm ", " years old"]);
    expect(splitAge("{age}/{age}")).toEqual(["", "/", ""]);
  });
});

describe("icon allowlists", () => {
  it("recognise their own keys only", () => {
    expect(FACT_ICONS.every(isFactIcon)).toBe(true);
    expect(CONTACT_ICONS.every(isContactIcon)).toBe(true);
    expect(isFactIcon("github")).toBe(false);
    expect(isContactIcon("pin")).toBe(false);
    expect(isFactIcon(undefined)).toBe(false);
  });
});

describe("defaults", () => {
  it("default profile passes the profile validator", () => {
    const result = validateProfileInput(DEFAULT_PROFILE);
    expect(result.valid).toBe(true);
  });

  it("default profile keeps the {age} placeholder", () => {
    expect(DEFAULT_PROFILE.bio.some((p) => p.includes("{age}"))).toBe(true);
  });

  it("default contact links mirror CONTACT_LINKS and validate", () => {
    expect(DEFAULT_CONTACT_LINKS.map((l) => l.url)).toEqual(
      CONTACT_LINKS.map((l) => l.url),
    );
    for (const link of DEFAULT_CONTACT_LINKS) {
      expect(validateContactLinkInput(link).valid).toBe(true);
    }
  });
});
