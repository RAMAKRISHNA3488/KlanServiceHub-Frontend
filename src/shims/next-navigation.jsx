import { useNavigate, useParams as useReactParams, useLocation, useSearchParams as useReactSearchParams, Navigate } from 'react-router-dom';
export function useRouter() {
    const navigate = useNavigate();
    return {
        push: (url) => navigate(url),
        replace: (url) => navigate(url, { replace: true }),
        back: () => navigate(-1),
        forward: () => navigate(1),
        refresh: () => window.location.reload(),
        prefetch: () => { },
    };
}
export function useParams() {
    return useReactParams();
}
export function usePathname() {
    const location = useLocation();
    return location.pathname;
}
export function useSearchParams() {
    const [searchParams] = useReactSearchParams();
    return searchParams;
}
export function redirect(url) {
    if (typeof window !== 'undefined') {
        window.location.href = url;
    }
    return null;
}
export { Navigate };
