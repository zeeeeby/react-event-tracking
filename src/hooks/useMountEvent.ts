import { useEffect, useRef } from "react";
import { EventObject, EventParams } from "../types";
import { useReactEventTracking } from "../context";
import { parseEventArgs } from "../utils";

export function useMountEvent(eventName: string, params?: EventParams): void;
export function useMountEvent(event: EventObject): void;
export function useMountEvent(eventNameOrObject: string | EventObject, eventParams?: EventParams) {
    const { sendEvent } = useReactEventTracking()

    const counterRef = useRef(0);

    const { eventName, params } = parseEventArgs(eventNameOrObject, eventParams);

    useEffect(() => {
        if (counterRef.current > 0) {
            return;
        }
        counterRef.current++;
        sendEvent(eventName, params);
    }, []);
}