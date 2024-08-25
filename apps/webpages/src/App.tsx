import "./App.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense } from "react";
import Device from "./Device.tsx";
import { GlobalConfigProvider } from "./contexts/GlobalConfigContext.tsx";

const queryClient = new QueryClient();

function App() {
  return (
    <Suspense fallback="Loading...">
      <QueryClientProvider client={queryClient}>
        <GlobalConfigProvider>
          <Device />
        </GlobalConfigProvider>
      </QueryClientProvider>
    </Suspense>
  );
}

export default App;
