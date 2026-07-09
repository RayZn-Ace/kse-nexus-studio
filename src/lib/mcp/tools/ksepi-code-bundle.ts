import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import type { ToolContext } from "@lovable.dev/mcp-js";
import { requireKseAdmin } from "./ksepi-auth";
import metaRoute from "../../../routes/api/kseadsio/meta.ts?raw";
import metaGraph from "../../kseadsio/metaGraph.server.ts?raw";
import metaAdsService from "../../kseadsio/metaAdsService.ts?raw";
import parserService from "../../kseadsio/kayiParserService.ts?raw";
import riskEngine from "../../kseadsio/riskEngineService.ts?raw";
import kseTypes from "../../kseadsio/types.ts?raw";
import kseadsioRoute from "../../../routes/kseadsio.tsx?raw";

const files = {
  "src/routes/api/kseadsio/meta.ts": metaRoute,
  "src/lib/kseadsio/metaGraph.server.ts": metaGraph,
  "src/lib/kseadsio/metaAdsService.ts": metaAdsService,
  "src/lib/kseadsio/kayiParserService.ts": parserService,
  "src/lib/kseadsio/riskEngineService.ts": riskEngine,
  "src/lib/kseadsio/types.ts": kseTypes,
  "src/routes/kseadsio.tsx": kseadsioRoute,
} as const;

type FileName = keyof typeof files;

function sliceText(text: string, maxChars: number) {
  if (text.length <= maxChars) return { text, truncated: false };
  return { text: text.slice(0, maxChars), truncated: true };
}

export default defineTool({
  name: "ksepi_code_bundle",
  title: "Read KSEAdsio source bundle",
  description: "Return selected KSEAdsio source files so an AI can inspect the Meta execution flow without secrets.",
  inputSchema: {
    file: z
      .enum(Object.keys(files) as [FileName, ...FileName[]])
      .optional()
      .describe("Specific source file to return. Omit for a compact bundle of all key files."),
    max_chars: z.number().int().min(2_000).max(80_000).default(40_000),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ file, max_chars }, ctx: ToolContext) => {
    await requireKseAdmin(ctx);
    if (file) {
      const sliced = sliceText(files[file], max_chars);
      return {
        content: [{ type: "text", text: `// ${file}\n${sliced.text}` }],
        structuredContent: { file, truncated: sliced.truncated, available_files: Object.keys(files) },
      };
    }

    let remaining = max_chars;
    const bundle: Record<string, { source: string; truncated: boolean }> = {};
    for (const [name, source] of Object.entries(files)) {
      if (remaining <= 0) {
        bundle[name] = { source: "", truncated: true };
        continue;
      }
      const sliced = sliceText(source, remaining);
      bundle[name] = { source: sliced.text, truncated: sliced.truncated };
      remaining -= sliced.text.length;
    }
    return {
      content: [{ type: "text", text: JSON.stringify(bundle, null, 2) }],
      structuredContent: { files: Object.keys(files), max_chars, remaining },
    };
  },
});