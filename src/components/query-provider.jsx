'use client';
import { QueryClient, QueryClientProvider, isServer } from '@tanstack/react-query';
function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 30 * 60 * 1000, // 30 minutes
                gcTime: 60 * 60 * 1000, // 60 minutes
                retry: 1,
                refetchOnWindowFocus: false,
                refetchOnMount: false,
                refetchOnReconnect: false,
            },
        },
    });
}
let browserQueryClient = undefined;
function getQueryClient() {
    if (isServer) {
        return makeQueryClient();
    }
    else {
        if (!browserQueryClient)
            browserQueryClient = makeQueryClient();
        return browserQueryClient;
    }
}
export const QueryProvider = ({ children }) => {
    const queryClient = getQueryClient();
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
