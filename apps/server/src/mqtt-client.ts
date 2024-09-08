import mqtt from "mqtt";
import { Observable, Subject, shareReplay, takeUntil } from "rxjs";
import { config } from "./config.ts";
import { exit$ } from "./shared.ts";

const client = mqtt.connect(config.MQTT_URL);
client.on("connect", () => {
  client.subscribe(`${config.MQTT_PREFIX}#`);
  console.log(
    "Connected to MQTT broker. Subscribing topics with prefix:",
    config.MQTT_PREFIX,
  );
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
  messagesSubject.next({ topic, message, timestamp: Date.now() });
});

type ChargeChannelSeriesItem = {
  deviceId: string;
  channel: number;
  timestamp: number;
  values: Buffer;
};

type DeviceProtectorSeriesItem = {
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
).pipe(shareReplay(config.BUFFER_SIZE), takeUntil(exit$));

export const parsedProtectorSeriesItem$ =
  new Observable<DeviceProtectorSeriesItem>((subscriber) => {
    const subscription = messages$.subscribe((pkg) => {
      const [device, type] = pkg.topic.split("/");
      if (type !== "protector") {
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
  }).pipe(shareReplay(config.BUFFER_SIZE), takeUntil(exit$));

export function setVinStatus(deviceId: string, status: number) {
  const arr = Uint8Array.from([status]);
  const buff = Buffer.from(arr);
  client.publish(`${config.MQTT_PREFIX}${deviceId}/cfg/vin-status`, buff, {
    retain: true,
    qos: 1,
  });
}
