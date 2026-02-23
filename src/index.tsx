import React, {
	useCallback,
	useContext,
	useMemo,
	useRef,
	type PropsWithChildren
} from "react"

type EventParams = Record<string, any>

interface TrackContextValue {
	sendEvent: (eventName: string, params?: EventParams) => void
}

const TrackContext = React.createContext<TrackContextValue | null>(null)

export const useTracker = () => {
	const ctx = useContext(TrackContext)
	if (!ctx) {
		throw new Error("useTracker must be used within TrackRoot")
	}

	return ctx
}

export const TrackRoot = ({
	onEvent,
	children
}: PropsWithChildren<{
	onEvent: (eventName: string, params?: EventParams) => void
}>) => {
	const onEventRef = useRef(onEvent)
	onEventRef.current = onEvent

	const sendEvent = useCallback((eventName: string, params?: EventParams) => {
		onEventRef.current(eventName, params)
	}, [])

	const value = useMemo(() => ({ sendEvent }), [sendEvent])

	return <TrackContext.Provider value={value}>{children}</TrackContext.Provider>
}

export const TrackProvider = ({
	params,
	children
}: PropsWithChildren<{
	params: EventParams
}>) => {
	const ctx = useTracker()

	const paramsRef = useRef(params)
	paramsRef.current = params

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
