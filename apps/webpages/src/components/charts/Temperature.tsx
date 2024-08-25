import { TinyColor } from "@ctrl/tinycolor";
import {
  CategoryScale,
  type ChartData,
  Chart as ChartJS,
  type ChartOptions,
  Colors,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { ReactChart } from "chartjs-react";
import { format } from "date-fns";
import { type FC, useCallback, useMemo } from "react";
import { useDebounceCallback } from "usehooks-ts";
import { useChartColors } from "../../hooks/useChartColors.ts";
import { useDeviceProtectorEventSource } from "../../hooks/useDeviceEventSource.ts";
import { useGlobalConfig } from "../../hooks/useGlobalConfig.ts";
import type { ProtectorSeriesItem } from "../../models/protector-series-item.ts";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  Colors,
  LineController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
);

export type TemperatureChartProps = {
  deviceId: string;
};

const TemperatureChart: FC<TemperatureChartProps> = ({ deviceId }) => {
  const chartId = useMemo(() => `${deviceId}-temperature-chart`, [deviceId]);
  const { bufferSize } = useGlobalConfig();
  const { temperature: temperatureColor } = useChartColors();

  const data = useMemo(
    () =>
      ({
        labels: [] as string[],
        datasets: [
          {
            label: "Board 0",
            cubicInterpolationMode: "monotone",
            tension: 0.7,
            data: [] as number[],
            borderColor: new TinyColor(temperatureColor)
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
            borderColor: new TinyColor(temperatureColor)
              .darken(10)
              .toHexString(),
            fill: false,
            pointStyle: "line",
          },
        ],
      }) satisfies ChartData,
    [temperatureColor],
  );

  const options = useMemo(
    () =>
      ({
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
        interaction: {
          mode: "index",
          intersect: false,
        },
        scales: {
          y: {
            suggestedMin: 30,
            suggestedMax: 40,
          },
        },
        plugins: {
          decimation: {
            enabled: true,
            algorithm: "lttb",
          },
        },
      }) satisfies ChartOptions,
    [],
  );

  const updateChart = useDebounceCallback(
    useCallback(() => {
      ChartJS.getChart(chartId)?.update();
    }, [chartId]),
    33,
    { leading: true, trailing: true },
  );

  const updateTemperatures = useCallback(
    (item: ProtectorSeriesItem) => {
      data.labels.push(format(item.timestamp, "HH:mm:ss"));
      data.datasets[0].data.push(item.values.temperature_0);
      data.datasets[1].data.push(item.values.temperature_1);

      while (data.labels.length > bufferSize) {
        data.labels.shift();
        data.datasets[0].data.shift();
        data.datasets[1].data.shift();
      }

      updateChart();
    },
    [data, updateChart, bufferSize],
  );

  useDeviceProtectorEventSource(deviceId, updateTemperatures);

  return (
    <ReactChart
      id={chartId}
      type="line"
      data={data}
      options={options}
      height={400}
      width={600}
    />
  );
};

export default TemperatureChart;
