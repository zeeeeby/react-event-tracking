import React, { useContext, useMemo, useRef, type PropsWithChildren } from "react"
import { EventParams, EventFilter, EventTransformer, AnyFunction } from "./types"

const TrackContext = React.createContext<{
	track: (eventName: string, params?: EventParams) => void
} | null>(null)

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
		customHandlers?: CustomHandlers & { track?: never }
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

	function track(eventName: string, incomingParams?: EventParams) {
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
				if (prop === track.name) return track

				const handler = customHandlersRef.current?.[prop]
				if (typeof handler === "function") {
					return (...args: any[]) => handler(...args)
				}

				return undefined
			},
			has(_, prop: string) {
				return (
					prop === track.name ||
					(customHandlersRef.current
						? prop in customHandlersRef.current
						: false)
				)
			},
			ownKeys() {
				const customKeys = customHandlersRef.current
					? Object.keys(customHandlersRef.current)
					: []
				return Array.from(new Set([track.name, ...customKeys]))
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
	) => (
		<TrackRootComponent
			onEvent={args.onEvent}
			filter={args.filter}
			transform={args.transform}
			customHandlers={args.customHandlers}
			{...props}
		/>
	)
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

	function track(eventName: string, incomingParams?: EventParams) {
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
