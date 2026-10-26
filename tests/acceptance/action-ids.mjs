/*
 * Resolve Next.js server-action ids from the build output.
 *
 * Server actions are content-hashed: the `Next-Action` id changes whenever the
 * action's source changes. Hard-coding ids in the acceptance harnesses makes
 * them rot after any edit, so instead we read them back out of the manifests
 * that `next build` emits (`.next/server/**\/server-reference-manifest.json`),
 * which map each id to its `exportedName` (e.g. `loginAction`).
 *
 * Usage:
 *   import { actionIds } from "./action-ids.mjs";
 *   const ACTIONS = actionIds("login", "saveSections", "publishPage");
 *   // ACTIONS.login === <id of loginAction>
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/** Walk `.next/server` and return a map of exportedName -> action id. */
export function buildActionIds(root = join(process.cwd(), ".next", "server")) {
  const map = {};
  const walk = (dir) => {
    let entries;
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(dir, entry);
      let st;
      try {
        st = statSync(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        walk(full);
      } else if (entry === "server-reference-manifest.json") {
        try {
          const json = JSON.parse(readFileSync(full, "utf8"));
          for (const [id, value] of Object.entries(json.node ?? {})) {
            if (value && value.exportedName) map[value.exportedName] = id;
          }
        } catch {
          // Ignore malformed/partial manifest fragments.
        }
      }
    }
  };
  walk(root);
  return map;
}

/**
 * Build an `{ shortName: id }` table. Each short name is suffixed with
 * `Action` to match the exported function in `src/server/actions/*`.
 * Throws early (with the missing name) when a build is stale/absent.
 */
export function actionIds(...names) {
  const map = buildActionIds();
  const missing = names.filter((name) => !map[`${name}Action`]);
  if (missing.length) {
    throw new Error(
      `Action id(s) not found in .next/server manifests: ${missing.join(", ")}. ` +
        `Run \`npm run build\` first (the harnesses run against a production build).`,
    );
  }
  const out = {};
  for (const name of names) out[name] = map[`${name}Action`];
  return out;
}
