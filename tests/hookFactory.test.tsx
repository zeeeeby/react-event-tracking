import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { TrackRoot, TrackProvider } from "../src"
import { createReactEventTrackingHook } from "../src/hooks/createReactEventTrackingHook"
import { Equal, Expect } from "../src/test-utils"

export type LoginScreenEvents = {
	forgot_password: { from: "footer" | "button" }
	logged_in: { timePassed: number }
}

type SystemEvents = {
	app_updated: { previous_version: string; current_version: string }
}

export type AnalyticsEvents = {
	login_screen: LoginScreenEvents
	system: SystemEvents
	no_prefix_event: { test: string; date: Date }
	"Logged In": { timePassed: number }
}
type MyCustomHandlers = {
	setUserId: (id: string) => void
}

const useTracking = createReactEventTrackingHook<AnalyticsEvents, MyCustomHandlers>()

const now = new Date()
const TestComponent = () => {
	const { track, setUserId } = useTracking()

	type Cases = [Expect<Equal<typeof setUserId, MyCustomHandlers["setUserId"]>>]

	const ts_cases = () => {
		track.login_screen.forgot_password({ from: "button" })
		track.login_screen.logged_in({ timePassed: 1 })
		// @ts-expect-error
		track.login_screen.logged_in({})
	}

	return (
		<div>
			<button
				onClick={() => track.login_screen.forgot_password({ from: "button" })}
			>
				Login
			</button>
			<button onClick={() => track.no_prefix_event({ test: "test", date: now })}>
				No Prefix
			</button>
			<button onClick={() => setUserId("user_99")}>Identify</button>
		</div>
	)
}

describe("createReactEventTrackingHook", () => {
	it("should correctly track typed events and call custom handlers", async () => {
		const onEvent = vi.fn()
		const setUserId = vi.fn()

		render(
			<TrackRoot onEvent={onEvent} customHandlers={{ setUserId }}>
				<TrackProvider params={{ app_version: "1.0.0" }}>
					<TestComponent />
				</TrackProvider>
			</TrackRoot>
		)

		await userEvent.click(screen.getByText("Login"))
		expect(onEvent).toHaveBeenCalledWith("login_screen.forgot_password", {
			from: "button",
			app_version: "1.0.0"
		})

		await userEvent.click(screen.getByText("No Prefix"))
		expect(onEvent).toHaveBeenCalledWith("no_prefix_event", {
			test: "test",
			date: now,
			app_version: "1.0.0"
		})

		await userEvent.click(screen.getByText("Identify"))
		expect(setUserId).toHaveBeenCalledWith("user_99")
	})

	it("should work without custom handlers", async () => {
		const onEvent = vi.fn()
		const useSimpleTracking = createReactEventTrackingHook<AnalyticsEvents>()

		const SimpleComponent = () => {
			const { track } = useSimpleTracking()
			return (
				<button
					onClick={() =>
						track.system.app_updated({
							previous_version: "1.0.0",
							current_version: "2.0.0"
						})
					}
				>
					Buy
				</button>
			)
		}

		render(
			<TrackRoot onEvent={onEvent}>
				<SimpleComponent />
			</TrackRoot>
		)

		await userEvent.click(screen.getByText("Buy"))
		expect(onEvent).toHaveBeenCalledWith("system.app_updated", {
			previous_version: "1.0.0",
			current_version: "2.0.0"
		})
	})

	it("should work with narrowed param", async () => {
		const onEvent = vi.fn()
		const useSimpleTracking = createReactEventTrackingHook<AnalyticsEvents>()

		const SimpleComponent = () => {
			const { track } = useSimpleTracking("system")
			return (
				<button
					onClick={() =>
						track.app_updated({
							current_version: "2.0.0",
							previous_version: "1.0.0"
						})
					}
				>
					Buy
				</button>
			)
		}

		render(
			<TrackRoot onEvent={onEvent}>
				<SimpleComponent />
			</TrackRoot>
		)

		await userEvent.click(screen.getByText("Buy"))
		expect(onEvent).toHaveBeenCalledWith("system.app_updated", {
			previous_version: "1.0.0",
			current_version: "2.0.0"
		})
	})

	it("should track events with spaces in name", async () => {
		const onEvent = vi.fn()

		const SimpleComponent = () => {
			const { track } = useTracking()
			return (
				<button
					data-testid="space-event"
					onClick={() =>
						track["Logged In"]({
							timePassed: 123
						})
					}
				>
					Buy
				</button>
			)
		}

		render(
			<TrackRoot onEvent={onEvent}>
				<SimpleComponent />
			</TrackRoot>
		)

		await userEvent.click(screen.getByTestId("space-event"))
		expect(onEvent).toHaveBeenCalledWith("Logged In", {
			timePassed: 123
		})
	})
})
