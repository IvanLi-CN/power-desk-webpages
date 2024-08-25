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
import { useDeviceSeriesEventSource } from "../../hooks/useDeviceEventSource.ts";
import { useGlobalConfig } from "../../hooks/useGlobalConfig.ts";
import type { ChargeChannelSeriesItem } from "../../models/charge-channel-series-item.ts";

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

export type ChannelChartProps = {
  deviceId: string;
  channel: number;
};

const ChannelChart: FC<ChannelChartProps> = ({ deviceId, channel }) => {
  const chartId = useMemo(
    () => `${deviceId}-ch${channel}-chart`,
    [deviceId, channel],
  );
  const { bufferSize } = useGlobalConfig();

  const data = useMemo(
    () =>
      ({
        labels: [] as string[],
        datasets: [
          {
            label: "Voltage of 0",
            cubicInterpolationMode: "monotone",
            tension: 0.5,
            data: [] as number[],
            borderColor: "#1E90FF",
            yAxisID: "voltageValue",
            pointStyle: "line",
          },
          {
            label: "Current of 0",
            cubicInterpolationMode: "monotone",
            tension: 0.5,
            data: [] as number[],
            borderColor: "#DC143C",
            yAxisID: "currentValue",
            pointStyle: "line",
          },
          {
            label: "Power of 0",
            cubicInterpolationMode: "monotone",
            tension: 0.5,
            data: [] as number[],
            borderColor: "#228B22",
            yAxisID: "powerValue",
            pointStyle: "line",
          },
        ],
      }) satisfies ChartData,
    [],
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
        scales: {
          voltageValue: {
            suggestedMin: 0,
            suggestedMax: 20,
          },
          currentValue: {
            suggestedMin: 0,
            suggestedMax: 5,
          },
          powerValue: {
            suggestedMin: 0,
            suggestedMax: 65,
            position: "right",
          },
        },
        interaction: {
          mode: "index",
          intersect: false,
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

  const updateSeriesItem = useCallback(
    (value: ChargeChannelSeriesItem) => {
      if (value.channel === channel && value.deviceId === deviceId) {
        if (data.labels.length > bufferSize) {
          data.labels.shift();
          for (const dataset of data.datasets) {
            dataset.data.shift();
          }
        }

        data.labels.push(format(new Date(value.timestamp), "HH:mm:ss"));
        data.datasets[0].data.push(value.values.millivolts / 1000);
        data.datasets[1].data.push(value.values.amps);
        data.datasets[2].data.push(value.values.watts);

        updateChart();
      }
    },
    [deviceId, channel, data, updateChart, bufferSize],
  );

  useDeviceSeriesEventSource(deviceId, updateSeriesItem);

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

export default ChannelChart;
