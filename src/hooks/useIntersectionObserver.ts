import { useEffect, useRef, useCallback } from "react";

export type UseIntersectionObserverOptions = {
    root?: Element | Document | null;
    rootMargin?: string;
    threshold?: number | number[];
    freezeOnceVisible?: boolean;
    onChange?: (isIntersecting: boolean, entry: IntersectionObserverEntry) => void;
};

type IntersectionReturn = {
    ref: (node?: Element | null) => void;
};

export function useIntersectionObserver({
    threshold = 0,
    root = null,
    rootMargin = "0%",
    freezeOnceVisible = false,
    onChange,
}: UseIntersectionObserverOptions = {}): IntersectionReturn {
    const nodeRef = useRef<Element | null>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const frozenRef = useRef(false);

    const callbackRef = useRef<UseIntersectionObserverOptions["onChange"]>(undefined);

    useEffect(() => {
        callbackRef.current = onChange;
    }, [onChange])

    const setRef = useCallback((node: Element | null | undefined) => {
        // If the node hasn't changed, do nothing
        if (nodeRef.current === node) return;

        // Disconnect old observer if it exists
        if (observerRef.current) {
            observerRef.current.disconnect();
            observerRef.current = null;
        }

        nodeRef.current = node || null;

        // Ensure we have a ref to observe and the browser supports the API
        if (!nodeRef.current || !("IntersectionObserver" in window)) return;

        // Skip if already frozen
        if (frozenRef.current && freezeOnceVisible) return;

        const observer = new IntersectionObserver(
            (entries: IntersectionObserverEntry[]): void => {
                const thresholds = Array.isArray(observer.thresholds) ? observer.thresholds : [observer.thresholds];

                entries.forEach((entry) => {
                    const isIntersecting =
                        entry.isIntersecting && thresholds.some((t) => entry.intersectionRatio >= t);

                    if (callbackRef.current) {
                        callbackRef.current(isIntersecting, entry);
                    }

                    if (isIntersecting && freezeOnceVisible) {
                        frozenRef.current = true;
                        observer.disconnect();
                        observerRef.current = null;
                    }
                });
            },
            { threshold, root, rootMargin },
        );

        observer.observe(nodeRef.current);
        observerRef.current = observer;
    }, [threshold, root, rootMargin, freezeOnceVisible]);

    useEffect(() => {
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
                observerRef.current = null;
            }
        };
    }, []);

    return { ref: setRef };
}