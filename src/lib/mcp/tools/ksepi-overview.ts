import { defineTool } from "@lovable.dev/mcp-js";

export default defineTool({
  name: "ksepi_overview",
  title: "KSEPI overview",
  description: "Explain the available KSEPI admin debug tools, safe boundaries, and connection URLs.",
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: () => ({
    content: [
      {
        type: "text",
        text: [
          "KSEPI is the protected KSE Group debug interface for AI assistants.",
          "Use the tools to inspect KSEAdsio source snapshots, redacted backend state, and Meta diagnostics.",
          "The server is OAuth-protected: connect as an app admin. Do not ask for raw database credentials, service keys, or access tokens; KSEPI redacts them by design.",
          "Recommended Meta workflow: call ksepi_code_bundle for meta-route/meta-graph files, call ksepi_database_snapshot for recent failed executions, then call ksepi_meta_diagnostics with the source campaign id.",
        ].join("\n"),
      },
    ],
    structuredContent: {
      server: "KSEPI",
      endpoint: "/mcp",
      auth: "OAuth as KSE admin",
      tools: [
        "ksepi_overview",
        "ksepi_code_bundle",
        "ksepi_database_snapshot",
        "ksepi_meta_diagnostics",
      ],
      safety: [
        "No service-role keys",
        "No raw access tokens",
        "Database output is redacted",
        "Tools require admin role checks",
      ],
    },
  }),
});