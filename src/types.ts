export type EventParams = Record<string, any>

export type TrackContextValue = {
	sendEvent: (eventName: string, params?: EventParams) => void
}

export type EventFilter = (eventName: string, params?: EventParams) => boolean
