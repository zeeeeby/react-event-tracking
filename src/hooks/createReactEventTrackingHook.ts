import { useMemo } from "react";
import { useReactEventTracking } from "../context";
import { AnyFunction, EventsMap, FlatTracker } from "../types";
import { createTracker } from "../proxy";

export function createReactEventTrackingHook<
    Map extends EventsMap,
    CustomHandlers extends Record<string, AnyFunction> = {}
>() {
    function useTracking(): { track: FlatTracker<Map> } & CustomHandlers;
    function useTracking<K extends keyof Map>(scope: K): { track: FlatTracker<Map>[K] } & CustomHandlers;
    function useTracking(scope?: any) {
        const ctx = useReactEventTracking() as any;

        const tracker = useMemo(() => {
            const prefix = scope ? [String(scope)] : [];
            return {
                ...ctx,
                track: createTracker(prefix, ctx.track),
            };
        }, [ctx, scope]);

        return tracker;
    }

    return useTracking;
}    