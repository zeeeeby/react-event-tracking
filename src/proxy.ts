import { EventParams, EventsMap, FlatTracker, } from "./types";

export function createTracker<T extends EventsMap>(path: string[] = [], track: (eventName: string, params?: EventParams) => void): FlatTracker<T> {
    return new Proxy(() => { }, {
        get(_, prop: string) {
            return createTracker([...path, prop], track);
        },
        apply(_, __, [name, params]) {
            let eventParams = typeof name === 'object' ? name : params
            const eventName = typeof name === 'object' ? path.join('.') : name;
            track(eventName, eventParams);
        }
    }) as unknown as FlatTracker<T>;
}       