import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { CrudProvider } from "@examen/crud";
import { Toaster } from "@/components/ui/sonner";
import { queryClient } from "@/app/queryClient";
import { router } from "@/app/router";
import { BASE_API_URL, TIMEOUT_MS } from "@/config";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <CrudProvider baseUrl={BASE_API_URL} timeoutMs={TIMEOUT_MS}>
                <RouterProvider router={router} />
                <Toaster richColors />
            </CrudProvider>
        </QueryClientProvider>
    </StrictMode>,
);
