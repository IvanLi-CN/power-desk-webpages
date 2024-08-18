import type { FC } from "react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDeviceEventSource } from "../../hooks/device-event-source.js";
import type { ChargeChannelSeriesItem } from "../../models/charge-channel-series-item.js";
import {
  PdVersion,
  ProtocolIndication,
  ProtocolStatus,
} from "../../models/protocol-indication.js";
import { BuckStatus, PortStatus } from "../../models/system-status.js";

interface ChannelStatsProps {
  deviceId: string;
  channel: number;
}

const ChannelStats: FC<ChannelStatsProps> = ({ deviceId, channel }) => {
  const { t } = useTranslation(["stat", "unit", "common"]);

  const [seriesItem, setSeriesItem] = useState<ChargeChannelSeriesItem>();
  const updateSeriesItem = useCallback(
    (value: ChargeChannelSeriesItem) => {
      if (value.channel === channel && value.deviceId === deviceId) {
        setSeriesItem(value);
      }
    },
    [deviceId, channel],
  );

  useDeviceEventSource(deviceId, updateSeriesItem);

  return (
    <div className="stats shadow w-full h-full stats-vertical lg:grid-cols-4 lg:stats-horizontal">
      <div className="stat">
        <div className="stat-title uppercase">{t("common:voltage")}</div>
        <div className="stat-value font-mono">
          {t("unit:volts", {
            value: seriesItem ? seriesItem.values.millivolts / 1000 : "-",
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
            minimumIntegerDigits: 2,
          })}
        </div>
        <div className="stat-desc">
          {t("target-output-voltage", {
            value: t("unit:volts", {
              value: seriesItem
                ? seriesItem.values.buck_output_millivolts / 1000
                : "-",
            }),
          })}
        </div>
      </div>

      <div className="stat">
        <div className="stat-title uppercase">{t("common:current")}</div>
        <div className="stat-value font-mono">
          {t("unit:amps", {
            value: seriesItem?.values.amps,
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
          })}
        </div>
        <div className="stat-desc">
          {t("limit-output-current", {
            value: t("unit:amps", {
              value: seriesItem?.values.buck_output_limit_milliamps,
            }),
          })}
        </div>
      </div>

      <div className="stat">
        <div className="stat-title uppercase">{t("common:power")}</div>
        <div className="stat-value font-mono">
          {t("unit:watts", {
            value: seriesItem?.values.watts,
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
            minimumIntegerDigits: 2,
          })}
        </div>
        <div className="stat-desc">
          {t("limit-power", {
            value: t("unit:watts", { value: seriesItem?.values.limit_watts }),
          })}
        </div>
      </div>

      <div className="stat">
        <div className="stat-title uppercase">{t("protocol")}</div>
        <div className="stat-value font-mono">
          {seriesItem?.values.protocol?.protocolStatus ===
          ProtocolStatus.OnLine ? (
            <span>
              {t(
                `protocol.${ProtocolIndication[seriesItem?.values.protocol?.protocol ?? ProtocolIndication.Unknown]}`,
              )}
              {seriesItem?.values.protocol?.protocol &&
                [ProtocolIndication.PdFix, ProtocolIndication.PdPps].includes(
                  seriesItem?.values.protocol?.protocol,
                ) && (
                  <small className="ml-2 font-extralight text-sm">
                    {t(
                      `pd-version.${PdVersion[seriesItem?.values.protocol?.pdVersion]}`,
                    )}
                  </small>
                )}
            </span>
          ) : (
            <span>{t("protocol-status.offline")}</span>
          )}
        </div>
        <div className="stat-desc flex gap-2">
          {seriesItem?.values.system_status?.portStatus === PortStatus.On ? (
            <span className="badge badge-success badge-sm">
              {t("port-status.on")}
            </span>
          ) : (
            <span className="badge badge-error badge-sm">
              {t("port-status.off")}
            </span>
          )}
          {seriesItem?.values.system_status?.buckStatus === BuckStatus.On ? (
            <span className="badge badge-success badge-sm">
              {t("buck-status.on")}
            </span>
          ) : (
            <span className="badge badge-error badge-sm">
              {t("buck-status.off")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChannelStats;
