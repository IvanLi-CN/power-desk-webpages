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
import { useDeviceTemperaturesEventSource } from "../../hooks/useDeviceEventSource.ts";

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

  const data = useMemo(
    () =>
      ({
        labels: [] as string[],
        datasets: [
          {
            label: "Temperature",
            cubicInterpolationMode: "monotone",
            tension: 0.7,
            data: [] as number[],
            borderColor: "#ff6384",
            backgroundColor: "rgba(255, 99, 132, 0.5)",
            fill: true,
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

  const updateTemperatures = useCallback(
    (temperature: number[]) => {
      data.labels.push(format(Date.now(), "HH:mm:ss"));
      data.datasets[0].data.push(temperature[0]);
      ChartJS.getChart(chartId)?.update();
      if (data.labels.length > 60 * 30) {
        data.labels.shift();
        data.datasets[0].data.shift();
      }
    },
    [data, chartId],
  );

  useDeviceTemperaturesEventSource(deviceId, updateTemperatures);

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
