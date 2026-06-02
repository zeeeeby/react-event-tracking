import { describe, it, expect, vi } from "vitest"
import { render } from "@testing-library/react"
import { createEventFactory } from "../src/createEventFactory"
import { useMountEvent } from "../src/hooks/useMountEvent"
import { TrackRoot } from "../src/context"

type TestEvents = {
	auth: {
		login: { method: string }
		logout: { reason: string }
	}
	ui: {
		button_click: { id: string }
	}
}

describe("createEventFactory", () => {
	it("should generate correct event objects with dot-notation", () => {
		const factory = createEventFactory<TestEvents>()

		const loginEvent = factory.auth.login({ method: "email" })
		expect(loginEvent).toEqual({
			eventName: "auth.login",
			params: { method: "email" }
		})

		const clickEvent = factory.ui.button_click({ id: "submit_btn" })
		expect(clickEvent).toEqual({
			eventName: "ui.button_click",
			params: { id: "submit_btn" }
		})
	})

	it("should work seamlessly with useMountEvent", () => {
		const factory = createEventFactory<TestEvents>()
		const onEvent = vi.fn()

		const TestComponent = () => {
			useMountEvent(factory.auth.login({ method: "google" }))
			return <div>Test</div>
		}

		render(
			<TrackRoot onEvent={onEvent}>
				<TestComponent />
			</TrackRoot>
		)

		expect(onEvent).toHaveBeenCalledTimes(1)
		expect(onEvent).toHaveBeenCalledWith("auth.login", { method: "google" })
	})
})
