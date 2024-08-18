import { type FC, type ReactNode, createContext, useEffect } from "react";
import invariant from "tiny-invariant";

const colors = {
  voltage: "#1E90FF",
  current: "#DC143C",
  power: "#32CD32",
  temperature: "#FFD700",
};
export const ChartColorsContext = createContext(colors);

export const ChartColorsProvider: FC<{ children?: ReactNode }> = ({
  children,
}) => {
  useEffect(() => {
    const root = document.querySelector(":root");
    invariant(root, "Root element not found");
    colors.voltage = getComputedStyle(root).getPropertyValue("--er");
    colors.current = getComputedStyle(root).getPropertyValue("--in");
    colors.power = getComputedStyle(root).getPropertyValue("--su");
    colors.temperature = getComputedStyle(root).getPropertyValue("--wa");
  }, []);

  return (
    <ChartColorsContext.Provider value={colors}>
      {children}
    </ChartColorsContext.Provider>
  );
};
