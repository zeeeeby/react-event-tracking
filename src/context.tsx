import React, { useContext, useMemo, useRef, type PropsWithChildren } from "react"
import {
	EventParams,
	EventFilter,
	EventTransformer,
	AnyFunction,
	TrackContextValueLegacy,
	EventObject
} from "./types"
import { parseEventArgs } from "./utils"

const TrackContext = React.createContext<TrackContextValueLegacy | null>(null)

export const useReactEventTracking = () => {
	const ctx = useContext(TrackContext)
	if (!ctx) {
		throw new Error("useReactEventTracking must be used within TrackRoot")
	}

	return ctx
}

type TrackRootProps<CustomHandlers extends Record<string, AnyFunction>> =
	PropsWithChildren<{
		onEvent: (eventName: string, params: EventParams) => void
		filter?: EventFilter
		transform?: EventTransformer
		customHandlers?: CustomHandlers
	}>

const EmptyParams = {} as EventParams

const TrackRootComponent = <CustomHandlers extends Record<string, AnyFunction> = {}>({
	onEvent,
	children,
	filter,
	transform,
	customHandlers
}: TrackRootProps<CustomHandlers>) => {
	const parentCtx = useContext(TrackContext)

	const onEventRef = useFreshRef(onEvent)
	const filterRef = useFreshRef(filter)
	const transformRef = useFreshRef(transform)
	const customHandlersRef = useFreshRef(customHandlers)

	function track(eventName: string, params?: EventParams): void
	function track(event: EventObject): void
	function track(eventNameOrObject: string | EventObject, eventParams?: EventParams) {
		const { eventName, params: incomingParams } = parseEventArgs(
			eventNameOrObject,
			eventParams
		)

		let localName = eventName
		let localParams = incomingParams || EmptyParams

		let shouldProcessLocal = true

		// 1. Filter (local)
		try {
			if (filterRef.current) {
				shouldProcessLocal = filterRef.current(localName, localParams)
			}
		} catch (error) {
			console.error("TrackRoot filter failed:", error)
			shouldProcessLocal = false
		}

		// 2. Transform (local)
		if (shouldProcessLocal && transformRef.current) {
			try {
				const paramsCopy = incomingParams ? { ...incomingParams } : EmptyParams
				const result = transformRef.current(eventName, paramsCopy)
				localName = result.eventName
				localParams = result.params
			} catch (error) {
				console.error("TrackRoot transform failed:", error)
				shouldProcessLocal = false
			}
		}

		// 3. Send to local handler
		if (shouldProcessLocal) {
			try {
				onEventRef.current(localName, localParams)
			} catch (error) {
				console.error("TrackRoot onEvent failed:", error)
			}
		}

		// 4. Bubble original event to parent (ALWAYS happens)
		if (parentCtx) {
			parentCtx.track(eventName, incomingParams)
		}
	}

	const value = useMemo(() => {
		return new Proxy({} as Record<string, any>, {
			get(_, prop: string) {
				if (prop === "track") return track

				const handler = customHandlersRef.current?.[prop]
				if (typeof handler === "function") {
					return (...args: any[]) => handler(...args)
				}

				return undefined
			},
			has(_, prop: string) {
				return (
					prop === "track" ||
					(customHandlersRef.current
						? prop in customHandlersRef.current
						: false)
				)
			},
			ownKeys() {
				const customKeys = customHandlersRef.current
					? Object.keys(customHandlersRef.current)
					: []
				return Array.from(new Set(["track", ...customKeys]))
			},
			getOwnPropertyDescriptor(_, prop) {
				return {
					enumerable: true,
					configurable: true
				}
			}
		})
	}, [parentCtx])

	return <TrackContext.Provider value={value as any}>{children}</TrackContext.Provider>
}
const factory = <T extends Record<string, AnyFunction> = {}>(args: TrackRootProps<T>) => {
	return (
		props: Omit<
			TrackRootProps<T>,
			"onEvent" | "filter" | "transform" | "customHandlers"
		>
	) => <TrackRootComponent {...args} {...props} />
}

export const TrackRoot = Object.assign(TrackRootComponent, { factory })

export const TrackProvider = <T extends Record<string, any>>({
	params,
	children
}: PropsWithChildren<{
	params: EventParams<T>
}>) => {
	const ctx = useReactEventTracking()

	const paramsRef = useFreshRef(params)

	function track(eventName: string, params?: EventParams): void
	function track(event: EventObject): void
	function track(eventNameOrObject: string | EventObject, eventParams?: EventParams) {
		const { eventName, params: incomingParams } = parseEventArgs(
			eventNameOrObject,
			eventParams
		)

		const currentParams = paramsRef.current

		ctx.track(eventName, {
			...currentParams,
			...incomingParams
		})
	}

	const value = useMemo(() => ({ ...ctx, track }), [ctx])

	return <TrackContext.Provider value={value}>{children}</TrackContext.Provider>
}

function useFreshRef<T>(data: T) {
	const ref = useRef(data)
	ref.current = data

	return ref
}
