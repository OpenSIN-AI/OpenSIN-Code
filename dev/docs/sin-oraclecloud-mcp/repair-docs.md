# SIN-OracleCloud-MCP — Fehler-Reports & Bug-Fixes

> Jeder Bug, jeder Fix, jede Loesung wird hier dokumentiert.

---

## BUG-20260319-001: Fresh scaffold validation targets `dist/src/cli.js` before artifact path is verified

**Aufgetreten:** 2026-03-19  **Status:** ✅ GEFIXT

**Symptom:** After a successful `npm run build`, validation commands targeting `dist/src/cli.js` fail with `MODULE_NOT_FOUND`.

**Ursache:** The generated agent build completed, but the expected CLI artifact path has not yet been confirmed; validation assumed `dist/src/cli.js` without checking the actual emitted tree.

**Fix:** Inspected the real `dist` tree after build and confirmed `dist/src/cli.js` exists. The earlier failure was caused by validating in parallel before the build artifact was fully available; subsequent sequential validation uses the correct path.

**Datei:** `A2A-SIN-OracleCloud-MCP/dist/*`, validation path assumptions

---

## BUG-20260319-002: `compartments.list` used OCI subtree listing without a root compartment id

**Aufgetreten:** 2026-03-19  **Status:** ✅ GEFIXT

**Symptom:** `sin.oraclecloud.mcp.compartments.list` failed with `Unexpected end of JSON input` because the underlying `oci iam compartment list --compartment-id-in-subtree true` call returned no JSON payload.

**Ursache:** The inherited implementation from `SIN-Server` did not pass the root tenancy compartment id, even though the currently working OCI path requires `--compartment-id <tenancy>` for reliable compartment listing.

**Fix:** Read the tenancy OCID from `~/.oci/config` and call `oci iam compartment list --all --compartment-id <tenancy> --compartment-id-in-subtree true --include-root`.

**Datei:** `A2A-SIN-OracleCloud-MCP/src/runtime.ts`

---

## BUG-20260319-003: Google Docs browser lane cannot yet resolve the Team - Infrastructure parent tab for OracleCloud-MCP

**Aufgetreten:** 2026-03-20  **Status:** ✅ WORKAROUND

**Symptom:** Initial failure was `Could not resolve parent tab title for t.hzp3hc5sub65`. After passing the parent title from the working Docs API tree, the browser flow advanced but still failed at the add-tab action with `Could not create child tab under t.hzp3hc5sub65`. Live DOM probing then exposed the real UI blocker: the active Google account sees `Speicher ist voll. Datei kann nicht bearbeitet werden.` on the document.

**Ursache:** The browser lane is degraded (`Tab 1` view), but the harder blocker is account/storage state: the current Google identity is in a `storage full / document cannot be edited` state for this doc. That aligns with the API `google.docs.ensure_tab` failure (`403 PERMISSION_DENIED`) and explains why the add-tab click produces no create effect.

**Fix:** Parent-title resolution was repaired, and the dedicated docs tab now exists as `t.niviexa2a43q`. The remaining issue is no longer tab creation itself but the broader write-state/identity quality of the active Google Docs lane.

**Datei:** Google Docs browser automation for `SIN-OracleCloud-MCP`
