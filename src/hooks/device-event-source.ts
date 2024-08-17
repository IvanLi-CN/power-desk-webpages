import { useEffect } from "react";
import { deserializeChargeChannelSeriesItem } from "../helpers/mqtt-seraiallization.ts";
import type { ChargeChannelSeriesItem } from "../models/charge-channel-series-item.ts";

const eventSourceMap = new Map<
  string,
  {
    refCount: number;
    eventSource: EventSource;
  }
>();

export const useDeviceEventSource = (
  deviceId: string,
  cb: (value: ChargeChannelSeriesItem) => void,
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

    const handleMessage = (event: MessageEvent) => {
      const value = deserializeChargeChannelSeriesItem(event.data);

      cb(value);
    };

    eventSource.addEventListener("message", handleMessage);

    return () => {
      eventSource.removeEventListener("message", handleMessage);

      es.refCount -= 1;

      if (es.refCount === 0) {
        eventSource.close();
        eventSourceMap.delete(deviceId);
      }
    };
  }, [deviceId, cb]);
};
