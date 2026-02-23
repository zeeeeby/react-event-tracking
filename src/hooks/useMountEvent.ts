import { useEffect, useRef } from "react";
import { EventParams } from "../types";
import { useTracker } from "../context";

export function useMountEvent(eventName: string, params?: EventParams) {
    const { sendEvent } = useTracker()

    const counterRef = useRef(0);

    useEffect(() => {
        if (counterRef.current > 0) {
            return;
        }
        counterRef.current++;
        sendEvent(eventName, params);
    }, []);
}