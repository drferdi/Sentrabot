import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ExpoPushProvider, savePushToken } from "./expo-push.js";

const dirs: string[] = [];

afterEach(async () => {
  vi.unstubAllGlobals();
  await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("expo push", () => {
  it("does not call Expo when the user has no token", async () => {
    const dataDir = await mkdtemp(path.join(tmpdir(), "rakazo-push-"));
    dirs.push(dataDir);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const push = new ExpoPushProvider(dataDir);
    await push.send(
      { kind: "completion", title: "done", body: "ok", botId: "b", threadId: "t" },
      {
        operationId: "n",
        traceId: "n",
        workspaceId: "w",
        userId: "missing",
        signal: new AbortController().signal,
      },
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts to Expo when a token is registered", async () => {
    const dataDir = await mkdtemp(path.join(tmpdir(), "rakazo-push-"));
    dirs.push(dataDir);
    await savePushToken(dataDir, "user-1", "ExponentPushToken[test]");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    const push = new ExpoPushProvider(dataDir);
    await push.send(
      { kind: "takeover", title: "Need you", body: "on screen", botId: "bot-1", threadId: "th-1" },
      {
        operationId: "n",
        traceId: "n",
        workspaceId: "w",
        userId: "user-1",
        signal: new AbortController().signal,
      },
    );
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://exp.host/--/api/v2/push/send");
    const body = JSON.parse(String(init.body)) as {
      to: string;
      title: string;
      data: { kind: string };
    };
    expect(body.to).toBe("ExponentPushToken[test]");
    expect(body.title).toBe("Need you");
    expect(body.data.kind).toBe("takeover");
  });
});
