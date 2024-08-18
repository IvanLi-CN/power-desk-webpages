import "./App.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense } from "react";
import Device from "./Device.tsx";

const queryClient = new QueryClient();

function App() {
  return (
    <Suspense fallback="loading">
      <QueryClientProvider client={queryClient}>
        <Device />
      </QueryClientProvider>
    </Suspense>
  );
}

export default App;
