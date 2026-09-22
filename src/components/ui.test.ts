import { expect, it } from "vitest";
import { listJoin, pourOffWarning } from "./ui";

it("joins lists the way a sentence does", () => {
  expect(listJoin(["Borax"])).toBe("Borax");
  expect(listJoin(["Borax", "Soda ash"])).toBe("Borax and Soda ash");
  expect(listJoin(["A", "B", "C"])).toBe("A, B and C");
});

it("words the pour-off warning so it reads right for one material or several", () => {
  expect(pourOffWarning(["Lithium carbonate"])).toBe(
    "Part of the recipe dissolves in water (Lithium carbonate). Pouring off water loses a little of it; evaporating keeps it all.",
  );
  expect(pourOffWarning(["Borax", "Ulexite"])).toContain("(Borax and Ulexite)");
});
