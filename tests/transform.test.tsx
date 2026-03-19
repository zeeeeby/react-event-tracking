import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { TrackRoot, useReactEventTracking } from "../src"

const TestButton = ({ eventName, params }: { eventName: string; params?: any }) => {
	const { sendEvent } = useReactEventTracking()
	return <button onClick={() => sendEvent(eventName, params)}>Click me</button>
}

describe("TrackRoot transform", () => {
	it("should transform event name and params", async () => {
		const onEvent = vi.fn()
		const transform = (name: string, params?: any) => ({
			eventName: `prefix_${name}`,
			params: { ...params, extra: true }
		})

		render(
			<TrackRoot onEvent={onEvent} transform={transform}>
				<TestButton eventName="click" params={{ id: 1 }} />
			</TrackRoot>
		)

		await userEvent.click(screen.getByText("Click me"))

		expect(onEvent).toHaveBeenCalledWith("prefix_click", { id: 1, extra: true })
	})

	it("should remove specific properties from params (sanitization)", async () => {
		const onEvent = vi.fn()
		const transform = (name: string, params?: any) => {
			// Remove sensitive data
			const { password, token, ...safeParams } = params || {}
			return {
				eventName: name,
				params: safeParams
			}
		}

		render(
			<TrackRoot onEvent={onEvent} transform={transform}>
				<TestButton
					eventName="submit"
					params={{ user: "alice", password: "123", token: "xyz", valid: true }}
				/>
			</TrackRoot>
		)

		await userEvent.click(screen.getByText("Click me"))

		expect(onEvent).toHaveBeenCalledWith("submit", { user: "alice", valid: true })
	})

	it("should apply filter BEFORE transform", async () => {
		const onEvent = vi.fn()

		const filter = (name: string) => name.startsWith("allowed_")

		const transform = (name: string, params: any) => ({
			eventName: name.replace("allowed_", "transformed_"),
			params
		})

		render(
			<TrackRoot onEvent={onEvent} transform={transform} filter={filter}>
				<TestButton eventName="allowed_click" />
			</TrackRoot>
		)

		await userEvent.click(screen.getByText("Click me"))

		expect(onEvent).toHaveBeenCalledWith("transformed_click", {})
	})

	it("should bubble ORIGINAL event to parent (ignoring local transform)", async () => {
		const onParentEvent = vi.fn()
		const onChildEvent = vi.fn()

		const transform = (name: string, params: any) => {
			return {
				eventName: `transformed_${name}`,
				params
			}
		}
		render(
			<TrackRoot onEvent={onParentEvent}>
				<TrackRoot onEvent={onChildEvent} transform={transform}>
					<TestButton eventName="original" />
				</TrackRoot>
			</TrackRoot>
		)

		await userEvent.click(screen.getByText("Click me"))

		// Child receives transformed event
		expect(onChildEvent).toHaveBeenCalledWith("transformed_original", {})

		// Parent receives original event
		expect(onParentEvent).toHaveBeenCalledWith("original", {})
	})

	it("should work with factory", async () => {
		const onEvent = vi.fn()

		const CustomRoot = TrackRoot.factory({
			onEvent,
			transform: (name, params) => ({ eventName: name.toUpperCase(), params })
		})

		render(
			<CustomRoot>
				<TestButton eventName="test" />
			</CustomRoot>
		)

		await userEvent.click(screen.getByText("Click me"))

		expect(onEvent).toHaveBeenCalledWith("TEST", {})
	})

	it("should handle errors in transform function gracefully and still bubble", async () => {
		const onParentEvent = vi.fn()
		const onChildEvent = vi.fn()
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

		const throwingTransform = () => {
			throw new Error("Transform failed")
		}

		render(
			<TrackRoot onEvent={onParentEvent}>
				<TrackRoot onEvent={onChildEvent} transform={throwingTransform}>
					<TestButton eventName="test" />
				</TrackRoot>
			</TrackRoot>
		)

		await userEvent.click(screen.getByText("Click me"))

		// Local handler skipped due to error in transform
		expect(onChildEvent).not.toHaveBeenCalled()

		// Parent handler still called (bubbling preserved)
		expect(onParentEvent).toHaveBeenCalledWith("test", {})

		// Error logged
		expect(consoleSpy).toHaveBeenCalledWith(
			"TrackRoot transform failed:",
			expect.any(Error)
		)

		consoleSpy.mockRestore()
	})
})
