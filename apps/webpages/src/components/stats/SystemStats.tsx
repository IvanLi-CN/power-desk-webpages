import { TinyColor } from "@ctrl/tinycolor";
import { type ChartData, Chart as ChartJS, type ChartOptions } from "chart.js";
import { ReactChart } from "chartjs-react";
import clsx from "clsx";
import { mergeDeepLeft } from "ramda";
import type { FC } from "react";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDebounceCallback } from "usehooks-ts";
import { useChartColors } from "../../hooks/useChartColors.js";
import { useDeviceProtectorEventSource } from "../../hooks/useDeviceEventSource.js";
import { useGlobalConfig } from "../../hooks/useGlobalConfig.js";
import {
  type ProtectorSeriesItem,
  VinStatus,
} from "../../models/protector-series-item.js";

interface SystemStatsProps {
  deviceId: string;
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

const temperatureOptions = mergeDeepLeft(baseOptions, {
  scales: {
    y: {
      display: false,
      min: 0,
      max: 70,
    },
  },
});

const SystemStats: FC<SystemStatsProps> = ({ deviceId }) => {
  const { t } = useTranslation(["stat", "unit", "common"]);
  const { bufferSize } = useGlobalConfig();
  const maxItems = useMemo(() => Math.min(bufferSize, 60), [bufferSize]);

  const voltageChartId = useMemo(
    () => `${deviceId}-stats-voltage-chart`,
    [deviceId],
  );
  const currentChartId = useMemo(
    () => `${deviceId}-stats-current-chart`,
    [deviceId],
  );
  const powerChartId = useMemo(
    () => `${deviceId}-stats-power-chart`,
    [deviceId],
  );
  const temperatureChartId = useMemo(
    () => `${deviceId}-stats-temperature-chart`,
    [deviceId],
  );

  const [seriesItem, setSeriesItem] = useState<ProtectorSeriesItem>();

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
  const temperatureData = useMemo(
    () => ({
      labels: [] as string[],
      datasets: [
        {
          label: "Board 0",
          cubicInterpolationMode: "monotone",
          tension: 0.7,
          data: [] as number[],
          borderColor: new TinyColor(chartColors.temperature)
            .lighten(10)
            .toHexString(),
          fill: false,
          pointStyle: "line",
        },
        {
          label: "Board 1",
          cubicInterpolationMode: "monotone",
          tension: 0.7,
          data: [] as number[],
          borderColor: new TinyColor(chartColors.temperature)
            .darken(10)
            .toHexString(),
          fill: false,
          pointStyle: "line",
        },
      ],
    }),
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
  const updateTemperatureChart = useDebounceCallback(
    useCallback(
      () => ChartJS.getChart(temperatureChartId)?.update(),
      [temperatureChartId],
    ),
    100,
    {
      leading: true,
      trailing: true,
    },
  );

  const updateSeriesItem = useCallback(
    (value: ProtectorSeriesItem) => {
      if (value.deviceId === deviceId) {
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

          temperatureData.labels.shift();
          temperatureData.datasets[0].data.shift();
          temperatureData.datasets[1].data.shift();
        }

        const label = value.timestamp.toString();

        voltageData.labels.push(label);
        voltageData.datasets[0].data.push(value.values.millivolts / 1000);

        currentData.labels.push(label);
        currentData.datasets[0].data.push(value.values.amps);

        powerData.labels.push(label);
        powerData.datasets[0].data.push(value.values.watts);

        temperatureData.labels.push(label);
        temperatureData.datasets[0].data.push(value.values.temperature_0);
        temperatureData.datasets[1].data.push(value.values.temperature_1);

        updateVoltageChart();
        updateCurrentChart();
        updatePowerChart();
        updateTemperatureChart();
      }
    },
    [
      deviceId,
      voltageData,
      currentData,
      powerData,
      temperatureData,
      updateVoltageChart,
      updateCurrentChart,
      updatePowerChart,
      updateTemperatureChart,
      maxItems,
    ],
  );

  useDeviceProtectorEventSource(deviceId, updateSeriesItem);

  const temperature = useMemo(() => {
    const temperatures = [
      seriesItem?.values.temperature_0,
      seriesItem?.values.temperature_1,
    ].filter((value) => value !== undefined) as number[];

    return Math.max(...temperatures);
  }, [seriesItem]);

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
        <button
          className={clsx(
            "absolute right-4 top-4",
            "btn btn-circle ",
            {
              "btn-primary": seriesItem?.values.vin_status === VinStatus.Normal,
            },
            "p-2",
            "flex items-center justify-center",
            "rounded-full",
          )}
          type="button"
        >
          <span className="iconify fa--power-off text-3xl" />
        </button>
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
      </div>

      {/* Temperature */}
      <div className="stat relative">
        <div className="absolute top-0 bottom-0 left-0 right-0">
          <ReactChart
            id={temperatureChartId}
            type="line"
            data={temperatureData}
            options={temperatureOptions}
          />
        </div>
        <div className="stat-title uppercase">{t("common:temperature")}</div>
        <div className="stat-value font-mono">
          {t("unit:degrees-centigrade", {
            value: temperature,
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
            minimumIntegerDigits: 2,
          })}
        </div>
      </div>
    </div>
  );
};

export default SystemStats;
