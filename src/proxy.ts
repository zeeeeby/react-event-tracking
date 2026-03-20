import { EventParams, EventsMap, FlatTracker, } from "./types";

export function createTracker<T extends EventsMap>(path: string[] = [], track: (eventName: string, params?: EventParams) => void): FlatTracker<T> {
    return new Proxy(() => { }, {
        get(_, prop: string) {
            return createTracker([...path, prop], track);
        },
        apply(_, __, [params]) {
            const eventName = path.join('.');
            track(eventName, params);
        }
    }) as unknown as FlatTracker<T>;
}       