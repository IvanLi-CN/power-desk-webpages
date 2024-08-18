import mqtt from "mqtt";
import {
  Observable,
  Subject,
  concatMap,
  retry,
  shareReplay,
  takeUntil,
} from "rxjs";
import {
  charge_channel_series_items,
  devices as dbDevices,
} from "../db/schema.ts";
import { config } from "./config.ts";
import { db } from "./db.ts";
import { exit$ } from "./shared.ts";

const client = mqtt.connect(config.MQTT_URL);
client.on("connect", () => {
  client.subscribe(`${config.MQTT_PREFIX}#`);
  console.log("Connected to MQTT broker");
});

type MQTTMessageItem = {
  topic: string;
  message: Buffer;
  timestamp: number;
};
const messagesSubject = new Subject<MQTTMessageItem>();

const messages$ = messagesSubject.pipe(shareReplay(1), takeUntil(exit$));

client.on("message", (rawTopic, message) => {
  const topic = rawTopic.replace(config.MQTT_PREFIX, "");
  console.log(`Received message on topic ${topic}: ${message.toString("hex")}`);
  messagesSubject.next({ topic, message, timestamp: Date.now() });
});

type ChargeChannelSeriesItem = {
  deviceId: string;
  channel: number;
  timestamp: number;
  values: Buffer;
};

type DeviceTemperatures = {
  deviceId: string;
  timestamp: number;
  values: Buffer;
};

export const parsedChannelSeriesItem$ = new Observable<ChargeChannelSeriesItem>(
  (subscriber) => {
    const subscription = messages$.subscribe((pkg) => {
      const [device, channelText, type] = pkg.topic.split("/");
      if (!channelText.startsWith("ch")) {
        return;
      }

      const channel = Number.parseInt(channelText.replace("ch", ""), 10);
      if (type !== "series") {
        return;
      }

      subscriber.next({
        deviceId: device,
        channel,
        timestamp: pkg.timestamp,
        values: pkg.message,
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  },
).pipe(shareReplay(config.MQTT_BUFFER_SIZE), takeUntil(exit$));

export const parsedTemperatures$ = new Observable<DeviceTemperatures>(
  (subscriber) => {
    const subscription = messages$.subscribe((pkg) => {
      const [device, type] = pkg.topic.split("/");
      if (type !== "temperature") {
        return;
      }

      subscriber.next({
        deviceId: device,
        timestamp: pkg.timestamp,
        values: pkg.message,
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  },
).pipe(shareReplay(config.MQTT_BUFFER_SIZE), takeUntil(exit$));

const devices = await db.query.devices.findMany();

function recordToDB() {
  parsedChannelSeriesItem$
    .pipe(
      concatMap(async (item) => {
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
}

recordToDB();
