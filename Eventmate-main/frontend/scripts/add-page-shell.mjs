import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../app");

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.name.endsWith(".tsx")) {
      let c = fs.readFileSync(p, "utf8");
      const o = c;
      c = c.replace(
        /className="flex min-h-screen flex-col habesha-surface"/g,
        'className="page-shell flex min-h-screen flex-col"'
      );
      c = c.replace(
        /className="flex min-h-screen flex-col"/g,
        'className="page-shell flex min-h-screen flex-col"'
      );
      if (c !== o) fs.writeFileSync(p, c);
    }
  }
}

walk(root);
