import { createServerFn } from "@tanstack/react-start";
import { resolveShare } from "./shares.server";

export const getShare = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => {
    const d = data as { token?: string };
    if (!d?.token || typeof d.token !== "string") throw new Error("Token fehlt");
    return { token: d.token };
  })
  .handler(async ({ data }) => {
    return resolveShare(data.token);
  });