import { Hono } from "hono";

import type { Serve } from "bun";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { serveStatic } from "hono/bun";
import { streamSSE } from "hono/streaming";
import { filter, takeUntil } from "rxjs";
import { config } from "./config.ts";
import { db } from "./db.ts";
import { exit$ } from "./shared.ts";

migrate(db, { migrationsFolder: "./drizzle" });

const { parsedChannelSeriesItem$, parsedProtectorSeriesItem$ } = await import(
  "./mqtt-subscriber.ts"
);

const app = new Hono();

app.get("/api/devices/:deviceId", (c) => {
  const deviceId = c.req.param("deviceId");

  const filteredSeries$ = parsedChannelSeriesItem$.pipe(
    filter((item) => {
      return deviceId === "*" || item.deviceId === deviceId;
    }),
    takeUntil(exit$),
  );

  const filteredTemperatures$ = parsedProtectorSeriesItem$.pipe(
    filter((item) => {
      return deviceId === "*" || item.deviceId === deviceId;
    }),
    takeUntil(exit$),
  );

  return streamSSE(c, async (stream) => {
    let aborted = false;

    stream.onAbort(() => {
      aborted = true;
      console.log("stream aborted");
    });

    const seriesSubscription = filteredSeries$.subscribe({
      next: (item) => {
        stream.writeSSE({
          data: JSON.stringify({
            timestamp: item.timestamp,
            deviceId: item.deviceId,
            channel: item.channel,
            values: item.values.toString("base64"),
          }),
          event: "series",
          id: `${item.deviceId}-${item.channel}-${item.timestamp}`,
        });
      },
      error: (error) => {
        console.log("charge series error", error);
        console.error(error);
        aborted = true;
      },
    });
    const temperaturesSubscription = filteredTemperatures$.subscribe({
      next: (item) => {
        stream.writeSSE({
          data: JSON.stringify({
            timestamp: item.timestamp,
            deviceId: item.deviceId,
            values: item.values.toString("base64"),
          }),
          event: "protector",
          id: `${item.deviceId}-${item.timestamp}`,
        });
      },
      error: (error) => {
        console.log("temperatures error", error);
        console.error(error);
        aborted = true;
      },
    });

    while (!aborted) {
      await stream.sleep(1000);
    }

    temperaturesSubscription.unsubscribe();
    seriesSubscription.unsubscribe();
  });
});

app.get("/api/config", (c) => c.json({ buffer_size: config.BUFFER_SIZE }));

app.get(
  "/*",
  serveStatic({
    root: "../webpages/dist",
  }),
);
app.get(
  "*",
  serveStatic({
    root: "../webpages/dist",
    rewriteRequestPath: (path) => {
      return "/index.html";
    },
  }),
);

export default {
  fetch: app.fetch,
  port: config.PORT,
  idleTimeout: 0, // fix sse aborted early
} satisfies Serve;
