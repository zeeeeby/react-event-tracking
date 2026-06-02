import React, { Children, cloneElement, isValidElement } from "react"
import {
	useIntersectionObserver,
	UseIntersectionObserverOptions
} from "./hooks/useIntersectionObserver"
import { useMountEvent } from "./hooks/useMountEvent"
import { EventObject } from "./types"
import { parseEventArgs } from "./utils"
import { useMergeRefs } from "./hooks/useMergeRefs"
import { useReactEventTracking } from "./context"

type EventProps =
	| {
			event: string
			params?: EventObject["params"]
	  }
	| {
			event: EventObject
	  }

function parseEventProps(props: EventProps) {
	if ("params" in props) return parseEventArgs(props.event, props.params)

	return parseEventArgs(props.event)
}

export const Track = {
	OnMount: (props: EventProps & { children?: React.ReactNode }) => {
		useMountEvent(parseEventProps(props))
		return props.children ?? null
	},
	OnImpression: ({
		children,
		options,
		...props
	}: EventProps & {
		children: React.ReactNode
		options?: UseIntersectionObserverOptions
	}) => {
		const { track } = useReactEventTracking()
		const { eventName, params } = parseEventProps(props)

		// Keep track if we've already tracked this to handle freezeOnceVisible manually
		// because the ref callback might be called multiple times during renders
		const trackedRef = React.useRef(false)

		const { ref: impressionRef } = useIntersectionObserver({
			freezeOnceVisible: true,
			...options,
			onChange: (isIntersecting) => {
				if (isIntersecting) {
					const freeze = options?.freezeOnceVisible ?? true
					if (freeze && trackedRef.current) return

					track(eventName, params)
					if (freeze) trackedRef.current = true
				}
			}
		})

		const child = Children.only(children)
		const hasRef = isValidElement(child) && (child as any)?.ref != null

		const ref = useMergeRefs<any>(
			hasRef ? [(child as any).ref, impressionRef] : [impressionRef]
		)

		return hasRef ? cloneElement(child as any, { ref }) : <div ref={ref}>{child}</div>
	}
}
