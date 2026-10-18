import { useNavigate, useParams as useReactParams, useLocation, useSearchParams as useReactSearchParams, Navigate } from 'react-router-dom';
let globalNavigate = null;

export function useRouter() {
    const navigate = useNavigate();
    globalNavigate = navigate;
    return {
        push: (url) => navigate(url),
        replace: (url) => navigate(url, { replace: true }),
        back: () => navigate(-1),
        forward: () => navigate(1),
        refresh: () => {
            window.dispatchEvent(new CustomEvent('app-soft-refresh'));
        },
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
    if (globalNavigate) {
        globalNavigate(url, { replace: true });
    } else if (typeof window !== 'undefined') {
        window.history.pushState({}, '', url);
        window.dispatchEvent(new PopStateEvent('popstate'));
    }
    return null;
}
export { Navigate };
