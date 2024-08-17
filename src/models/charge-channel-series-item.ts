import type { AbnormalCaseResponse } from "./abnormal-case.ts";
import type { ProtocolIndicationResponse } from "./protocol-indication.ts";
import type { SystemStatusResponse } from "./system-status.ts";

export type ChargeChannelSeriesItem = {
  timestamp: number;
  channel: number;
  deviceId: string;
  values: ChargeChannelSeriesItemValues;
};

export type ChargeChannelSeriesItemValues = {
  millivolts: number;
  amps: number;
  watts: number;
  protocol: ProtocolIndicationResponse;
  system_status: SystemStatusResponse;
  abnormal_case: AbnormalCaseResponse;
  buck_output_millivolts: number;
  buck_output_limit_milliamps: number;
  limit_watts: number;
};
