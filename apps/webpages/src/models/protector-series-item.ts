export type ProtectorSeriesItem = {
  timestamp: number;
  deviceId: string;
  values: ProtectorSeriesItemValues;
};

export type ProtectorSeriesItemValues = {
  temperature_0: number;
  temperature_1: number;
};
