import React, {
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	type PropsWithChildren
} from "react"
import { EventParams, TrackContextValue, EventFilter } from "./types"

const TrackContext = React.createContext<TrackContextValue | null>(null)

export const useTracker = () => {
	const ctx = useContext(TrackContext)
	if (!ctx) {
		throw new Error("useTracker must be used within TrackRoot")
	}

	return ctx
}

type TrackRootProps = PropsWithChildren<{
	onEvent: (eventName: string, params?: EventParams) => void
	filter?: EventFilter
}>

const TrackRootComponent = ({ onEvent, children, filter }: TrackRootProps) => {
	const parentCtx = useContext(TrackContext)

	const onEventRef = useFreshRef(onEvent)
	const filterRef = useFreshRef(filter)

	const sendEvent = useCallback(
		(eventName: string, params?: EventParams) => {
			const shouldTrack = filterRef.current ? filterRef.current(eventName, params) : true

			if (shouldTrack) {
				onEventRef.current(eventName, params)
			}

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
	filter?: EventFilter
) => {
	return (props: Omit<TrackRootProps, "onEvent" | "filter">) => (
		<TrackRootComponent onEvent={onEvent} filter={filter} {...props} />
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
