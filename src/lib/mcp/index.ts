import { auth, defineMcp } from "@lovable.dev/mcp-js";
import overviewTool from "./tools/ksepi-overview";
import codeBundleTool from "./tools/ksepi-code-bundle";
import databaseSnapshotTool from "./tools/ksepi-database-snapshot";
import metaDiagnosticsTool from "./tools/ksepi-meta-diagnostics";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "ksepi",
  title: "KSEPI Debug API",
  version: "0.1.0",
  instructions:
    "KSEPI exposes protected KSE Group admin debug tools for KSEAdsio. Use it to inspect source snapshots, redacted backend state, and Meta Ads diagnostics. Never request or reveal raw secrets, service keys, access tokens, or passwords.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [overviewTool, codeBundleTool, databaseSnapshotTool, metaDiagnosticsTool],
});