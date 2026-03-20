import React, { Children, cloneElement, isValidElement } from "react";
import { useMountEvent, useIntersectionObserver, useMergeRefs, UseIntersectionObserverOptions } from "./hooks";
import { EventObject } from "./types";
import { useTracker } from "./context";
import { parseEventArgs } from "./utils";

type EventProps = {
    event: string
    params?: EventObject["params"]
} | {
    event: EventObject
}

function parseEventProps(props: EventProps)
{
    if ("params" in props)
        return parseEventArgs(props.event, props.params)

    return parseEventArgs(props.event)
}

export const Track = {
    OnMount: (props: EventProps & { children?: React.ReactNode }) => {
        useMountEvent(parseEventProps(props));
        return props.children ?? null;
    },
    
    OnImpression: ({ 
        children, 
        options,
        ...props
    }: EventProps & {
        children: React.ReactNode;
        options?: UseIntersectionObserverOptions;
    }) => {
        const { sendEvent } = useTracker();
        const { eventName, params } = parseEventProps(props);

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
    },

    OnChange: (props: EventProps & { mapValue?: (value: string, e: React.ChangeEvent<any>) => Record<string, any> | undefined | void } & ({ children: React.ReactNode } | { render: (track: (e: React.ChangeEvent<any>) => void) => React.ReactNode })) => {
        const { sendEvent } = useTracker();
        const { eventName, params } = parseEventProps(props);

        const track = React.useCallback((e: React.ChangeEvent<any>) => {
            const mappedParams = props.mapValue?.(e.target.value, e)
            sendEvent(eventName, mappedParams ? { ...params, ...mappedParams } : params);
        }, [sendEvent, eventName, params, props.mapValue]);

        if ("render" in props)
            return props.render(track);

        return Children.map(props.children, child => {
            if (!isValidElement(child))
                return child;
            
            return cloneElement(child as React.ReactElement, {
                onChangeCapture: (e: React.ChangeEvent<any>) => {
                    track(e);
                    if (child.props && typeof child.props.onChangeCapture === 'function')
                        child.props.onChangeCapture(e);
                }
            });
        });
    },

    OnClick: (props: EventProps & ({ children: React.ReactNode } | { render: (track: () => void) => React.ReactNode })) => {
        const { sendEvent } = useTracker();
        const { eventName, params } = parseEventProps(props);

        const track = React.useCallback(() => sendEvent(eventName, params), [sendEvent, eventName, params]);

        if ("render" in props)
            return props.render(track);

        return Children.map(props.children, child => {
            if (!isValidElement(child))
                return child;
            
            return cloneElement(child as React.ReactElement, {
                onClickCapture: (e: React.MouseEvent) => {
                    track();
                    if (child.props && typeof child.props.onClickCapture === 'function')
                        child.props.onClickCapture(e);
                }
            });
        });
    }
};
