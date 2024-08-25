import { useQuery } from "@tanstack/react-query";
import { type FC, type ReactNode, createContext } from "react";

const defaultConfig = {
  bufferSize: 1800,
};

export const GlobalConfigContext = createContext(defaultConfig);

export const GlobalConfigProvider: FC<{ children?: ReactNode }> = ({
  children,
}) => {
  const { data } = useQuery({
    queryKey: ["globalConfig"],
    queryFn: () => {
      return fetch("/api/config").then((res) => res.json());
    },
  });

  return (
    <GlobalConfigContext.Provider value={{ ...defaultConfig, ...data }}>
      {children}
    </GlobalConfigContext.Provider>
  );
};
