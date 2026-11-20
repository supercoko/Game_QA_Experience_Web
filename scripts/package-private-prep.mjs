import { readFile, writeFile } from "node:fs/promises";
import { createContext, runInContext } from "node:vm";

const ownerEmail = process.argv[2]?.trim();
if (!ownerEmail || !/^[^@\s]+@[^@\s]+$/.test(ownerEmail)) {
  throw new Error("Usage: node scripts/package-private-prep.mjs <verified-github-email>");
}

const privateDir = new URL("../web/private/", import.meta.url);
const context = createContext({ window: {} });
for (const name of ["jobs", "qa", "roadmap"]) {
  const filename = `data-${name}.js`;
  const source = await readFile(new URL(filename, privateDir), "utf8");
  runInContext(source, context, { filename, timeout: 1000 });
}

const { DATA_JOBS: jobs, DATA_QA: qa, DATA_ROADMAP: roadmap } = context.window;
if (!Array.isArray(jobs?.jobs) || !Array.isArray(jobs?.selfIntros) ||
    !Array.isArray(qa) || !Array.isArray(roadmap?.roadmapWeeks)) {
  throw new Error("Private prep data is incomplete");
}

const payload = JSON.stringify({ jobs, qa, roadmap });
const literal = value => "'" + value.replaceAll("'", "''") + "'";
const sql = `set standard_conforming_strings = on;
insert into qa_internal.prep_content (singleton, owner_email, payload)
values (true, ${literal(ownerEmail)}, ${literal(payload)}::jsonb)
on conflict (singleton) do update set owner_email = excluded.owner_email, payload = excluded.payload;
`;
await writeFile(new URL("supabase-private.sql", privateDir), sql, "utf8");
console.log("Generated web/private/supabase-private.sql");
