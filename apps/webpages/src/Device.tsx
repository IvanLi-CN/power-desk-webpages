import type { FC, ReactNode } from "react";
import invariant from "tiny-invariant";
import ChannelChart from "./components/charts/ChannelChart.js";
import TemperatureChart from "./components/charts/Temperature.js";
import ChannelStats from "./components/stats/ChannelStats.js";
import SystemStats from "./components/stats/SystemStats.js";

export default function Index() {
  const { deviceId } = { deviceId: "test" };

  invariant(
    deviceId,
    'Missing "deviceId" param in route. Make sure to include it when navigating to this page.',
  );

  return (
    <div className="font-sans p-4">
      <h2 className="text-xl">{deviceId}</h2>
      <div className="grid 3xl:grid-cols-2 grid-cols-1 gap-4">
        <SystemStats deviceId={deviceId} />
        <ChannelStats deviceId={deviceId} channel={0} />
        <ChannelStats deviceId={deviceId} channel={1} />
        <ChannelStats deviceId={deviceId} channel={2} />
        <ChannelStats deviceId={deviceId} channel={3} />
      </div>

      <div className="grid 3xl:grid-cols-2 grid-cols-1 gap-4">
        <ChartWrapper title="Temperature">
          <TemperatureChart deviceId={deviceId} />
        </ChartWrapper>
        <ChartWrapper title="Channel 0">
          <ChannelChart deviceId={deviceId} channel={0} />
        </ChartWrapper>
        <ChartWrapper title="Channel 1">
          <ChannelChart deviceId={deviceId} channel={1} />
        </ChartWrapper>
        <ChartWrapper title="Channel 2">
          <ChannelChart deviceId={deviceId} channel={2} />
        </ChartWrapper>
        <ChartWrapper title="Channel 3">
          <ChannelChart deviceId={deviceId} channel={3} />
        </ChartWrapper>
      </div>
    </div>
  );
}

const ChartWrapper: FC<{ title: string; children: ReactNode }> = ({
  title,
  children,
}) => {
  return (
    <section>
      <h3>{title}</h3>
      <div>{children}</div>
    </section>
  );
};
