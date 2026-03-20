import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { TrackRoot } from "../src/context"
import { Track } from "../src/Track"
import React, { forwardRef } from "react"

const observers: any[] = []

const setupIntersectionObserverMock = () => {
	class IntersectionObserverMock {
		observe = vi.fn()
		disconnect = vi.fn()
		unobserve = vi.fn()
		thresholds = [0]
		constructor(public callback: IntersectionObserverCallback) {
			observers.push(this)
		}
	}
	
	vi.stubGlobal('IntersectionObserver', IntersectionObserverMock)
	return IntersectionObserverMock
}

describe("Track.OnImpression (deeply mocked, not very useful)", () => {
	beforeEach(() => {
		observers.length = 0
		setupIntersectionObserverMock()
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	const triggerIntersection = (isIntersecting: boolean) => {
		const observer = observers[0]
		if (observer) {
			const callback = observer.callback
			callback([{ isIntersecting, intersectionRatio: isIntersecting ? 1 : 0 } as any], observer)
		}
	}

	it("should send event when element becomes visible", () => {
		const onEvent = vi.fn()

		render(
			<TrackRoot onEvent={onEvent}>
				<Track.OnImpression event="banner_view">
					<div>Test Banner</div>
				</Track.OnImpression>
			</TrackRoot>
		)

		expect(onEvent).not.toHaveBeenCalled()
		
		triggerIntersection(true)
		
		expect(onEvent).toHaveBeenCalledTimes(1)
		expect(onEvent).toHaveBeenCalledWith("banner_view", {})
	})

	it("should send event with params", () => {
		const onEvent = vi.fn()
		const params = { banner_id: "123" }

		render(
			<TrackRoot onEvent={onEvent}>
				<Track.OnImpression event="banner_view" params={params}>
					<div>Test Banner</div>
				</Track.OnImpression>
			</TrackRoot>
		)

		triggerIntersection(true)
		
		expect(onEvent).toHaveBeenCalledWith("banner_view", params)
	})

	it("should only send event once by default (freezeOnceVisible: true)", () => {
		const onEvent = vi.fn()

		render(
			<TrackRoot onEvent={onEvent}>
				<Track.OnImpression event="banner_view">
					<div>Test Banner</div>
				</Track.OnImpression>
			</TrackRoot>
		)

		triggerIntersection(true)
		triggerIntersection(false)
		triggerIntersection(true)
		
		expect(onEvent).toHaveBeenCalledTimes(1)
	})

	it("should send event multiple times if freezeOnceVisible is false", () => {
		const onEvent = vi.fn()

		render(
			<TrackRoot onEvent={onEvent}>
				<Track.OnImpression event="banner_view" options={{ freezeOnceVisible: false }}>
					<div>Test Banner</div>
				</Track.OnImpression>
			</TrackRoot>
		)

		triggerIntersection(true)
		triggerIntersection(false)
		triggerIntersection(true)
		
		expect(onEvent).toHaveBeenCalledTimes(2)
	})

	it("should wrap non-ref children in a div", () => {
		const onEvent = vi.fn()

		const { container } = render(
			<TrackRoot onEvent={onEvent}>
				<Track.OnImpression event="banner_view">
					<span>Test Banner</span>
				</Track.OnImpression>
			</TrackRoot>
		)

		expect(container.innerHTML).toBe('<div><span>Test Banner</span></div>')
	})

	it("should merge refs for children that already have a ref", () => {
		const onEvent = vi.fn()
		const innerRef = vi.fn()

		const ComponentWithRef = forwardRef<HTMLDivElement, { children: React.ReactNode }>(
			({ children }, ref) => <div ref={ref} data-testid="inner">{children}</div>
		)

		render(
			<TrackRoot onEvent={onEvent}>
				<Track.OnImpression event="banner_view">
					<ComponentWithRef ref={innerRef}>Test Banner</ComponentWithRef>
				</Track.OnImpression>
			</TrackRoot>
		)

		// innerRef should be called with the DOM element
		expect(innerRef).toHaveBeenCalledWith(screen.getByTestId("inner"))
		
		// And tracking should still work
		triggerIntersection(true)
		expect(onEvent).toHaveBeenCalledTimes(1)
	})
})
