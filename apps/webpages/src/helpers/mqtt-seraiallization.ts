import { AbnormalCaseResponse } from "../models/abnormal-case.ts";
import type { ChargeChannelSeriesItem } from "../models/charge-channel-series-item.ts";
import type { ProtectorSeriesItem } from "../models/protector-series-item.ts";
import { ProtocolIndicationResponse } from "../models/protocol-indication.ts";
import { SystemStatusResponse } from "../models/system-status.ts";

export function deserializeTemperatures(message: string): ProtectorSeriesItem {
  const data: {
    timestamp: number;
    deviceId: string;
    values: string;
  } = JSON.parse(message);
  const decodedStr = atob(data.values);
  const buff = new Uint8Array(decodedStr.length);

  for (let i = 0; i < decodedStr.length; i++) {
    buff[i] = decodedStr.charCodeAt(i);
  }

  const dv = new DataView(buff.buffer);

  const item = {
    ...data,
    values: {
      temperature_0: dv.getFloat32(buff.byteOffset + 0, true),
      temperature_1: dv.getFloat32(buff.byteOffset + 4, true),
    },
  } satisfies ProtectorSeriesItem;
  return item;
}

export function deserializeChargeChannelSeriesItem(
  message: string,
): ChargeChannelSeriesItem {
  const data: {
    timestamp: number;
    channel: number;
    deviceId: string;
    values: string;
  } = JSON.parse(message);
  const decodedStr = atob(data.values);
  const buff = new Uint8Array(decodedStr.length);

  for (let i = 0; i < decodedStr.length; i++) {
    buff[i] = decodedStr.charCodeAt(i);
  }

  const dv = new DataView(buff.buffer);

  const millivolts = dv.getFloat64(buff.byteOffset + 0, true);
  const amps = dv.getFloat64(buff.byteOffset + 8, true);
  const watts = dv.getFloat64(buff.byteOffset + 16, true);
  const protocol = dv.getUint8(buff.byteOffset + 24);
  const system_status = dv.getUint8(buff.byteOffset + 25);
  const abnormal_case = dv.getUint8(buff.byteOffset + 26);
  const buck_output_millivolts = dv.getUint16(buff.byteOffset + 27, true);
  const buck_output_limit_milliamps = dv.getUint16(buff.byteOffset + 29, true);
  const limit_watts = dv.getUint8(buff.byteOffset + 31);

  return {
    ...data,
    values: {
      millivolts: Math.max(millivolts, 0),
      amps: Math.max(amps, 0),
      watts,
      protocol: ProtocolIndicationResponse.fromU8(protocol),
      system_status: SystemStatusResponse.fromU8(system_status),
      abnormal_case: AbnormalCaseResponse.fromU8(abnormal_case),
      buck_output_millivolts,
      buck_output_limit_milliamps,
      limit_watts,
    },
  };
}
