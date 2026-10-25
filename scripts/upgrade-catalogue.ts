// Explicit one-time owner operation, never run as part of a build or page request.
import { readCatalogue, writeCatalogue } from "../server/catalogue.js";
const current = await readCatalogue();
const ids = ["tropical-pineapple-pickle", "tropical-cucumber-pickle"];
const changed: string[] = [];
const products = current.products.map((p) => {
  if (!ids.includes(p.id)) return p;
  // Preserve deliberate owner edits. Review any skipped original product in the panel.
  if (p.price !== 200 || p.jarSize !== null) {
    console.log(`Skipped ${p.id}: already configured; review in owner panel.`);
    return p;
  }
  changed.push(p.id);
  return { ...p, price: 149, jarSize: "200 g" };
});
if (!changed.length) console.log("No legacy seed values need upgrading.");
else if (!process.argv.includes("--apply"))
  console.log(
    `Dry run: update ${changed.join(", ")} from legacy ₹200/no-size to verified ₹149/200 g. Run with --apply to save using the current ETag.`,
  );
else {
  await writeCatalogue(products, current.revision);
  console.log(
    `Updated ${changed.length} legacy products. Other products and owner edits were preserved.`,
  );
}
