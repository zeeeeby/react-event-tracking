import { EventObject, EventParams } from "./types";

export function parseEventArgs(
    eventNameOrObject: string | EventObject,
    eventParams?: EventParams
): { eventName: string; params: EventParams | undefined } {
    if (typeof eventNameOrObject === "object") {
        return {
            eventName: eventNameOrObject.eventName,
            params: eventNameOrObject.params
        }
    }
    return {
        eventName: eventNameOrObject,
        params: eventParams
    }
}       