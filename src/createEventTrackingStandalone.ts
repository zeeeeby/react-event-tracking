import { createTracker } from "./proxy";
import { EventParams, EventsMap, FlatTracker } from "./types";

export function createEventTrackingStandalone<
    Map extends EventsMap
>(track: (eventName: string, params?: EventParams) => void): FlatTracker<Map> {
    return createTracker([], track)
}
