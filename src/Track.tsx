import React, { Children, cloneElement, isValidElement } from "react";
import { useMountEvent, useIntersectionObserver, useMergeRefs, UseIntersectionObserverOptions } from "./hooks";
import { EventObject } from "./types";
import { useTracker } from "./context";
import { parseEventArgs } from "./utils";

export const Track = {
    OnMount: (props: EventObject & { children?: React.ReactNode }) => {
        useMountEvent(props);
        return props.children ?? null;
    },
    
    Impression: ({ 
        children, 
        options,
        ...eventProps 
    }: EventObject & { 
        children: React.ReactNode;
        options?: UseIntersectionObserverOptions;
    }) => {
        const { sendEvent } = useTracker();
        const { eventName, params } = parseEventArgs(eventProps, undefined);

        // Keep track if we've already tracked this to handle freezeOnceVisible manually
        // because the ref callback might be called multiple times during renders
        const trackedRef = React.useRef(false);

        const { ref: impressionRef } = useIntersectionObserver({
            freezeOnceVisible: true,
            ...options,
            onChange: (isIntersecting) => {
                if (isIntersecting) {
                    const freeze = options?.freezeOnceVisible ?? true;
                    if (freeze && trackedRef.current)
                        return;
                    
                    sendEvent(eventName, params);
                    if (freeze)
                        trackedRef.current = true;
                }
            },
        });

        const child = Children.only(children);
        const hasRef = isValidElement(child) && (child as any)?.ref != null;
        
        const ref = useMergeRefs<any>(hasRef ? [(child as any).ref, impressionRef] : [impressionRef]);

        return hasRef ? (
            cloneElement(child as any, { ref })
        ) : (
            <div ref={ref}>{child}</div>
        );
    }
};
