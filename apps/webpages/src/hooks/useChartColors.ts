import { useContext } from "react";
import { ChartColorsContext } from "../contexts/ChartColorsContext.tsx";

export const useChartColors = () => useContext(ChartColorsContext);
