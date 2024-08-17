export enum PortStatus {
  Off = 0,
  On = 1,
}

export enum BuckStatus {
  Off = 0,
  On = 1,
}

export class SystemStatusResponse {
  constructor(
    public portStatus: PortStatus,
    public buckStatus: BuckStatus,
  ) {}

  static fromU8(value: number) {
    return new SystemStatusResponse(
      value & 0x02 ? PortStatus.On : PortStatus.Off,
      value & (0x01 as BuckStatus),
    );
  }
}
