import React, {
	useCallback,
	useContext,
	useMemo,
	useRef,
	type PropsWithChildren
} from "react"
import { EventParams, TrackContextValue, EventFilter, EventTransformer } from "./types"

const TrackContext = React.createContext<TrackContextValue | null>(null)

export const useTracker = () => {
	const ctx = useContext(TrackContext)
	if (!ctx) {
		throw new Error("useTracker must be used within TrackRoot")
	}

	return ctx
}

type TrackRootProps = PropsWithChildren<{
	onEvent: (eventName: string, params: EventParams) => void
	filter?: EventFilter
	transform?: EventTransformer
}>

const EmptyParams = {} as EventParams

const TrackRootComponent = ({ onEvent, children, filter, transform }: TrackRootProps) => {
	const parentCtx = useContext(TrackContext)

	const onEventRef = useFreshRef(onEvent)
	const filterRef = useFreshRef(filter)
	const transformRef = useFreshRef(transform)

	const sendEvent = useCallback(
		(eventName: string, params?: EventParams) => {
			let localName = eventName
			let localParams = params || EmptyParams

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
					const paramsCopy = params ? { ...params } : EmptyParams
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
				parentCtx.sendEvent(eventName, params)
			}
		},
		[parentCtx]
	)

	const value = useMemo(() => ({ sendEvent }), [sendEvent])

	return <TrackContext.Provider value={value}>{children}</TrackContext.Provider>
}

const factory = (
	onEvent: (eventName: string, params?: EventParams) => void,
	filter?: EventFilter,
	transform?: EventTransformer
) => {
	return (props: Omit<TrackRootProps, "onEvent" | "filter" | "transform">) => (
		<TrackRootComponent
			onEvent={onEvent}
			filter={filter}
			transform={transform}
			{...props}
		/>
	)
}

export const TrackRoot = Object.assign(TrackRootComponent, { factory })

export const TrackProvider = ({
	params,
	children
}: PropsWithChildren<{
	params: EventParams
}>) => {
	const ctx = useTracker()

	const paramsRef = useFreshRef(params)

	const sendEvent = useCallback(
		(eventName: string, eventParams?: EventParams) => {
			const currentParams = paramsRef.current

			ctx.sendEvent(eventName, {
				...currentParams,
				...eventParams
			})
		},
		[ctx]
	)

	const value = useMemo(() => ({ sendEvent }), [sendEvent])

	return <TrackContext.Provider value={value}>{children}</TrackContext.Provider>
}

function useFreshRef<T>(data: T) {
	const ref = useRef(data)
	ref.current = data

	return ref
}

function safeCall(fn: () => any, errorMessage: string): void {
	try {
		const result = fn()
		if (result instanceof Promise) {
			result.catch((error) => console.error(errorMessage, error))
		}
	} catch (error) {
		console.error(errorMessage, error)
	}
}
