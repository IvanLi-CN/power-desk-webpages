import { useContext } from "react";
import { GlobalConfigContext } from "../contexts/GlobalConfigContext.tsx";

export const useGlobalConfig = () => useContext(GlobalConfigContext);
