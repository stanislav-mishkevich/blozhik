import React from "react";
import { UNAUTHED_ERR_MSG } from "../../shared/const";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import App from "./App";
import { getLoginUrl } from "./const";
import { ThemeProvider } from "@/contexts/ThemeContext";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      staleTime: 5 * 60 * 1000, // 5 минут
      retry: 1,
    },
  },
});

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (typeof window === "undefined") return;
  const isErr = error instanceof Error;
  if (!isErr) return;
  if ((error as Error).message !== UNAUTHED_ERR_MSG) return;
  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    // If backend signalled unauthorized, rustBack already redirects — don't log noise
    if (error instanceof Error && error.message === UNAUTHED_ERR_MSG) return;
    redirectToLoginIfUnauthorized(error);
    // Не логируем S3 ошибки конфигурации - они обрабатываются в UI
    const errorMessage = error instanceof Error ? error.message : "";
    if (!errorMessage.includes("S3 not configured")) {
      console.error("[API Query Error]", error);
    }
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    // If backend signalled unauthorized, rustBack already redirects — don't log noise
    if (error instanceof Error && error.message === UNAUTHED_ERR_MSG) return;
    redirectToLoginIfUnauthorized(error);
    // Не логируем S3 ошибки конфигурации - они обрабатываются в UI
    const errorMessage = error instanceof Error ? error.message : "";
    if (!errorMessage.includes("S3 not configured")) {
      console.error("[API Mutation Error]", error);
    }
  }
});

createRoot(document.getElementById("root")!).render(
  <ThemeProvider switchable={true}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </ThemeProvider>
);
