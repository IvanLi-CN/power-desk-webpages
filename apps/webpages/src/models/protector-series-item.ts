export type ProtectorSeriesItem = {
  timestamp: number;
  deviceId: string;
  values: ProtectorSeriesItemValues;
};

export type ProtectorSeriesItemValues = {
  temperature_0: number;
  temperature_1: number;
  millivolts: number;
  amps: number;
  watts: number;
  vin_status: VinStatus;
};

export enum VinStatus {
  Normal = 0,
  Shutdown = 1,
  Protection = 2,
}
