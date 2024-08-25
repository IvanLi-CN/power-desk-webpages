import { TinyColor } from "@ctrl/tinycolor";
import { type ChartData, Chart as ChartJS, type ChartOptions } from "chart.js";
import { ReactChart } from "chartjs-react";
import { mergeDeepLeft } from "ramda";
import type { FC } from "react";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDebounceCallback } from "usehooks-ts";
import { useChartColors } from "../../hooks/useChartColors.js";
import { useDeviceSeriesEventSource } from "../../hooks/useDeviceEventSource.js";
import { useGlobalConfig } from "../../hooks/useGlobalConfig.js";
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

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animations: {
    tension: {
      duration: 1000,
      easing: "linear",
      from: 0.5,
      to: 0.4,
      loop: true,
    },
  },
  scales: {
    y: {
      display: false,
    },
    x: {
      display: false,
    },
  },
  layout: {
    autoPadding: false,
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      enabled: false,
    },
  },
} satisfies ChartOptions;

const voltageOptions = mergeDeepLeft(baseOptions, {
  scales: {
    y: {
      display: false,
      min: 0,
      max: 20,
    },
  },
});

const currentOptions = mergeDeepLeft(baseOptions, {
  scales: {
    y: {
      display: false,
      min: 0,
      max: 5,
    },
  },
});

const powerOptions = mergeDeepLeft(baseOptions, {
  scales: {
    y: {
      display: false,
      min: 0,
      max: 75,
    },
  },
});

const ChannelStats: FC<ChannelStatsProps> = ({ deviceId, channel }) => {
  const { t } = useTranslation(["stat", "unit", "common"]);
  const { bufferSize } = useGlobalConfig();
  const maxItems = useMemo(() => Math.min(bufferSize, 60), [bufferSize]);

  const voltageChartId = useMemo(
    () => `${deviceId}-ch${channel}-voltage-chart`,
    [deviceId, channel],
  );

  const currentChartId = useMemo(
    () => `${deviceId}-ch${channel}-current-chart`,
    [deviceId, channel],
  );

  const powerChartId = useMemo(
    () => `${deviceId}-ch${channel}-power-chart`,
    [deviceId, channel],
  );

  const [seriesItem, setSeriesItem] = useState<ChargeChannelSeriesItem>();

  const chartColors = useChartColors();

  const voltageData = useMemo(
    () =>
      ({
        labels: [] as string[],
        datasets: [
          {
            label: "Monitor",
            cubicInterpolationMode: "monotone",
            tension: 0.7,
            fill: true,
            data: [] as number[],
            borderColor: new TinyColor(chartColors.voltage)
              .setAlpha(0.1)
              .toRgbString(),
            backgroundColor: new TinyColor(chartColors.voltage)
              .setAlpha(0.1)
              .toRgbString(),
            borderWidth: 0,
            pointStyle: "line",
          },
          {
            label: "Target",
            cubicInterpolationMode: "monotone",
            tension: 0.2,
            data: [] as number[],
            borderWidth: 1,
            borderColor: new TinyColor(chartColors.voltage)
              .setAlpha(0.5)
              .toRgbString(),
            pointStyle: "line",
          },
        ],
      }) satisfies ChartData,
    [chartColors],
  );
  const currentData = useMemo(
    () =>
      ({
        labels: [] as string[],
        datasets: [
          {
            label: "Monitor",
            cubicInterpolationMode: "monotone",
            tension: 0.7,
            fill: true,
            data: [] as number[],
            borderColor: new TinyColor(chartColors.current)
              .setAlpha(0.1)
              .toRgbString(),
            backgroundColor: new TinyColor(chartColors.current)
              .setAlpha(0.1)
              .toRgbString(),
            borderWidth: 0,
            pointStyle: "line",
          },
          {
            label: "Target",
            cubicInterpolationMode: "monotone",
            tension: 0.2,
            data: [] as number[],
            borderWidth: 1,
            borderColor: new TinyColor(chartColors.current)
              .setAlpha(0.5)
              .toRgbString(),
            pointStyle: "line",
          },
        ],
      }) satisfies ChartData,
    [chartColors],
  );
  const powerData = useMemo(
    () =>
      ({
        labels: [] as string[],
        datasets: [
          {
            label: "Monitor",
            cubicInterpolationMode: "monotone",
            tension: 0.7,
            fill: true,
            data: [] as number[],
            borderColor: new TinyColor(chartColors.power)
              .setAlpha(0.1)
              .toRgbString(),
            backgroundColor: new TinyColor(chartColors.power)
              .setAlpha(0.1)
              .toRgbString(),
            borderWidth: 0,
            pointStyle: "line",
          },
          {
            label: "Target",
            cubicInterpolationMode: "monotone",
            tension: 0.2,
            data: [] as number[],
            borderWidth: 1,
            borderColor: new TinyColor(chartColors.power)
              .setAlpha(0.5)
              .toRgbString(),
            pointStyle: "line",
          },
        ],
      }) satisfies ChartData,
    [chartColors],
  );

  const updateVoltageChart = useDebounceCallback(
    useCallback(
      () => ChartJS.getChart(voltageChartId)?.update(),
      [voltageChartId],
    ),
    33,
    {
      leading: true,
      trailing: true,
    },
  );
  const updateCurrentChart = useDebounceCallback(
    useCallback(
      () => ChartJS.getChart(currentChartId)?.update(),
      [currentChartId],
    ),
    100,
    {
      leading: true,
      trailing: true,
    },
  );
  const updatePowerChart = useDebounceCallback(
    useCallback(() => ChartJS.getChart(powerChartId)?.update(), [powerChartId]),
    100,
    {
      leading: true,
      trailing: true,
    },
  );

  const updateSeriesItem = useCallback(
    (value: ChargeChannelSeriesItem) => {
      if (value.channel === channel && value.deviceId === deviceId) {
        setSeriesItem(value);

        if (currentData.labels.length > maxItems) {
          voltageData.labels.shift();
          voltageData.datasets[0].data.shift();
          voltageData.datasets[1].data.shift();

          currentData.labels.shift();
          currentData.datasets[0].data.shift();
          currentData.datasets[1].data.shift();

          powerData.labels.shift();
          powerData.datasets[0].data.shift();
          powerData.datasets[1].data.shift();
        }

        voltageData.labels.push(value.timestamp.toString());
        voltageData.datasets[0].data.push(value.values.millivolts / 1000);
        voltageData.datasets[1].data.push(
          value.values.buck_output_millivolts / 1000,
        );

        currentData.labels.push(value.timestamp.toString());
        currentData.datasets[0].data.push(value.values.amps);
        currentData.datasets[1].data.push(
          value.values.buck_output_limit_milliamps / 1000,
        );

        powerData.labels.push(value.timestamp.toString());
        powerData.datasets[0].data.push(value.values.watts);
        powerData.datasets[1].data.push(value.values.limit_watts);

        updateVoltageChart();
        updateCurrentChart();
        updatePowerChart();
      }
    },
    [
      deviceId,
      channel,
      voltageData,
      currentData,
      powerData,
      updateVoltageChart,
      updateCurrentChart,
      updatePowerChart,
      maxItems,
    ],
  );

  useDeviceSeriesEventSource(deviceId, updateSeriesItem);

  return (
    <div className="stats shadow w-full h-full stats-vertical lg:grid-cols-4 lg:stats-horizontal">
      {/* Voltage */}
      <div className="stat relative">
        <div className="absolute top-0 bottom-0 left-0 right-0">
          <ReactChart
            id={voltageChartId}
            type="line"
            data={voltageData}
            options={voltageOptions}
          />
        </div>
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

      {/* Current */}
      <div className="stat relative">
        <div className="absolute top-0 bottom-0 left-0 right-0">
          <ReactChart
            id={currentChartId}
            type="line"
            data={currentData}
            options={currentOptions}
          />
        </div>
        <div className="stat-title uppercase ">{t("common:current")}</div>
        <div className="stat-value font-mono ">
          {t("unit:amps", {
            value: seriesItem?.values.amps,
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
          })}
        </div>
        <div className="stat-desc ">
          {t("limit-output-current", {
            value: t("unit:amps", {
              value: seriesItem
                ? seriesItem.values.buck_output_limit_milliamps / 1000
                : "-",
            }),
          })}
        </div>
      </div>

      {/* Power */}
      <div className="stat relative">
        <div className="absolute top-0 bottom-0 left-0 right-0">
          <ReactChart
            id={powerChartId}
            type="line"
            data={powerData}
            options={powerOptions}
          />
        </div>
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

      {/* Protocol */}
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
