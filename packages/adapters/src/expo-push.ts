import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  AdapterContext,
  NotificationMessage,
  NotificationProvider,
} from "@rakazo/adapter-kit";

export function pushTokenPath(dataDir: string, userId: string) {
  return path.join(dataDir, "push-tokens", `${userId}.txt`);
}

export async function loadPushToken(dataDir: string, userId: string): Promise<string | undefined> {
  try {
    const token = (await readFile(pushTokenPath(dataDir, userId), "utf8")).trim();
    return token || undefined;
  } catch {
    return undefined;
  }
}

export async function savePushToken(dataDir: string, userId: string, token: string): Promise<void> {
  await mkdir(path.dirname(pushTokenPath(dataDir, userId)), { recursive: true });
  await writeFile(pushTokenPath(dataDir, userId), token.trim(), "utf8");
}

export class ExpoPushProvider implements NotificationProvider {
  constructor(private readonly dataDir: string) {}

  describe() {
    return {
      id: "expo-push",
      contractVersion: "1",
      adapterVersion: "0.1.0",
      capabilities: { push: true, email: false },
    };
  }

  async send(message: NotificationMessage, context: AdapterContext): Promise<void> {
    const token = await loadPushToken(this.dataDir, context.userId);
    if (!token) return;
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        to: token,
        title: message.title,
        body: message.body,
        data: { kind: message.kind, botId: message.botId, threadId: message.threadId },
      }),
    }).catch(() => undefined);
  }
}
