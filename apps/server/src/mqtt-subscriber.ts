import { concatMap, retry } from "rxjs";
import {
  charge_channel_series_items,
  devices as dbDevices,
  protector_series_items,
} from "../db/schema.ts";
import { db } from "./db.ts";
import {
  parsedChannelSeriesItem$,
  parsedProtectorSeriesItem$,
} from "./mqtt-client.ts";

function recordToDB() {
  parsedChannelSeriesItem$
    .pipe(
      concatMap(async (item) => {
        const devices = await db.query.devices.findMany();

        if (!devices.some((d) => d.id === item.deviceId)) {
          await db
            .insert(dbDevices)
            .values({ id: item.deviceId, name: item.deviceId })
            .onConflictDoNothing();
        }

        await db.insert(charge_channel_series_items).values(item);
      }),
      retry(5),
    )
    .subscribe({
      error: (error) => {
        console.error(error);
      },
    });

  parsedProtectorSeriesItem$
    .pipe(
      concatMap(async (item) => {
        const devices = await db.query.devices.findMany();

        if (!devices.some((d) => d.id === item.deviceId)) {
          await db
            .insert(dbDevices)
            .values({ id: item.deviceId, name: item.deviceId })
            .onConflictDoNothing();
        }

        await db.insert(protector_series_items).values(item);
      }),
      retry(5),
    )
    .subscribe({
      error: (error) => {
        console.error(error);
      },
    });
}

recordToDB();
