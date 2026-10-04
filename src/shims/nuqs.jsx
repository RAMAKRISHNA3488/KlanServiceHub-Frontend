import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';
export const parseAsBoolean = {
    withDefault: (defaultValue) => ({
        defaultValue,
        parse: (val) => (val === null ? defaultValue : val === 'true'),
        serialize: (val) => (val === defaultValue ? null : String(val)),
        withOptions: (opts) => ({
            defaultValue,
            parse: (val) => (val === null ? defaultValue : val === 'true'),
            serialize: (val) => (opts?.clearOnDefault && val === defaultValue ? null : String(val)),
        }),
    }),
};
export const parseAsString = {
    defaultValue: '',
    withDefault: (defaultValue) => ({
        defaultValue,
        parse: (val) => val ?? defaultValue,
        serialize: (val) => val,
        withOptions: (opts) => ({
            defaultValue,
            parse: (val) => val ?? defaultValue,
            serialize: (val) => (opts?.clearOnDefault && val === defaultValue ? null : val),
        }),
    }),
    parse: (val) => val,
    serialize: (val) => val,
};
export const parseAsStringEnum = (enumObj) => {
    const values = Array.isArray(enumObj) ? enumObj : Object.values(enumObj);
    return {
        withDefault: (defaultValue) => ({
            defaultValue,
            parse: (val) => (val && values.includes(val) ? val : defaultValue),
            serialize: (val) => val,
            withOptions: (opts) => ({
                defaultValue,
                parse: (val) => (val && values.includes(val) ? val : defaultValue),
                serialize: (val) => (opts?.clearOnDefault && val === defaultValue ? null : val),
            }),
        }),
        parse: (val) => (val && values.includes(val) ? val : null),
    };
};
export function useQueryState(key, parser) {
    const [searchParams, setSearchParams] = useSearchParams();
    const rawValue = searchParams.get(key);
    const value = useMemo(() => {
        if (parser && typeof parser.parse === 'function') {
            return parser.parse(rawValue);
        }
        return rawValue;
    }, [rawValue, parser]);
    const setValue = useCallback((updater) => {
        setSearchParams((prev) => {
            const nextParams = new URLSearchParams(prev);
            const currentVal = parser && typeof parser.parse === 'function' ? parser.parse(nextParams.get(key)) : nextParams.get(key);
            const resolvedVal = typeof updater === 'function' ? updater(currentVal) : updater;
            if (resolvedVal === null ||
                resolvedVal === undefined ||
                (parser?.defaultValue !== undefined && resolvedVal === parser.defaultValue)) {
                nextParams.delete(key);
            }
            else {
                nextParams.set(key, String(resolvedVal));
            }
            return nextParams;
        }, { replace: true });
    }, [key, parser, setSearchParams]);
    return [value, setValue];
}
export function useQueryStates(parsers) {
    const [searchParams, setSearchParams] = useSearchParams();
    const values = useMemo(() => {
        const res = {};
        for (const [key, parser] of Object.entries(parsers)) {
            const raw = searchParams.get(key);
            res[key] = parser && typeof parser.parse === 'function' ? parser.parse(raw) : raw;
        }
        return res;
    }, [searchParams, parsers]);
    const setValues = useCallback((updater) => {
        setSearchParams((prev) => {
            const nextParams = new URLSearchParams(prev);
            const updates = typeof updater === 'function' ? updater(values) : updater;
            for (const [key, val] of Object.entries(updates)) {
                const parser = parsers[key];
                if (val === null ||
                    val === undefined ||
                    (parser?.defaultValue !== undefined && val === parser.defaultValue)) {
                    nextParams.delete(key);
                }
                else {
                    nextParams.set(key, String(val));
                }
            }
            return nextParams;
        }, { replace: true });
    }, [parsers, values, setSearchParams]);
    return [values, setValues];
}
