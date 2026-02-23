import React, {
	useCallback,
	useContext,
	useMemo,
	useRef,
	type PropsWithChildren
} from "react"

export type AnalyticsParams = Record<string, any>

interface AnalyticsContextValue {
	sendEvent: (eventName: string, params?: AnalyticsParams) => void
}

export const AnalyticsContext = React.createContext<AnalyticsContextValue | null>(null)

export const useAnalytics = () => {
	const ctx = useContext(AnalyticsContext)
	if (!ctx) {
		throw new Error("useAnalytics must be used within AnalyticsRoot")
	}

	return ctx
}

export const AnalyticsRoot = ({
	onEvent,
	children
}: PropsWithChildren<{
	onEvent: (eventName: string, params?: AnalyticsParams) => void
}>) => {
	const onEventRef = useRef(onEvent)
	onEventRef.current = onEvent

	const sendEvent = useCallback((eventName: string, params?: AnalyticsParams) => {
		onEventRef.current(eventName, params)
	}, [])

	const value = useMemo(() => ({ sendEvent }), [sendEvent])

	return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>
}

export const AnalyticsProvider = ({
	params,
	children
}: PropsWithChildren<{
	params: AnalyticsParams
}>) => {
	const ctx = useAnalytics()

	const paramsRef = useRef(params)
	paramsRef.current = params

	const sendEvent = useCallback(
		(eventName: string, eventParams?: AnalyticsParams) => {
			const currentParams = paramsRef.current

			ctx.sendEvent(eventName, {
				...currentParams,
				...eventParams
			})
		},
		[ctx]
	)

	const value = useMemo(() => ({ sendEvent }), [sendEvent])

	return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>
}
