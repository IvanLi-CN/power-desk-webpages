import { useCallback, useEffect } from "react";
import {
  deserializeChargeChannelSeriesItem,
  deserializeTemperatures,
} from "../helpers/mqtt-seraiallization.ts";
import type { ChargeChannelSeriesItem } from "../models/charge-channel-series-item.ts";

const eventSourceMap = new Map<
  string,
  {
    refCount: number;
    eventSource: EventSource;
  }
>();

export const useDeviceSeriesEventSource = (
  deviceId: string,
  cb: (value: ChargeChannelSeriesItem) => void,
) => {
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      const value = deserializeChargeChannelSeriesItem(event.data);

      cb(value);
    },
    [cb],
  );

  useDeviceEventSource(deviceId, "series", handleMessage);
};

export const useDeviceTemperaturesEventSource = (
  deviceId: string,
  cb: (value: number[]) => void,
) => {
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      const value = deserializeTemperatures(event.data);

      cb(value);
    },
    [cb],
  );

  useDeviceEventSource(deviceId, "temperatures", handleMessage);
};

export const useDeviceEventSource = (
  deviceId: string,
  type: "series" | "temperatures",
  cb: (event: MessageEvent) => void,
) => {
  useEffect(() => {
    let es = eventSourceMap.get(deviceId);
    if (!es) {
      es = {
        refCount: 0,
        eventSource: new EventSource(`/api/v1/devices/${deviceId}`),
      };

      eventSourceMap.set(deviceId, es);

      es.eventSource.onerror = (ev) => {
        console.error("EventSource error:", ev);
      };
    }

    es.refCount += 1;
    const { eventSource } = es;

    eventSource.addEventListener(type, cb);

    return () => {
      eventSource.removeEventListener(type, cb);

      es.refCount -= 1;

      if (es.refCount === 0) {
        eventSource.close();
        eventSourceMap.delete(deviceId);
      }
    };
  }, [deviceId, cb, type]);
};
