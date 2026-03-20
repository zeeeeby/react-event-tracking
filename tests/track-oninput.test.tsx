import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { TrackRoot } from "../src/context"
import { Track } from "../src/Track"

describe("Track.OnChange", () => {
	it("should send event when input is changed and preserve existing onChangeCapture", () => {
		const onEvent = vi.fn()
		const existingCapture = vi.fn()
        const existingChange = vi.fn()

		render(
			<TrackRoot onEvent={onEvent}>
				<Track.OnChange event="input_change" params={{ id: "123" }}>
					<input 
                        data-testid="inp" 
                        onChangeCapture={existingCapture}
                        onChange={existingChange}
                    />
				</Track.OnChange>
			</TrackRoot>
		)

		const inp = screen.getByTestId("inp")
		fireEvent.change(inp, { target: { value: "test" } })

		// Tracker should have been called
		expect(onEvent).toHaveBeenCalledTimes(1)
		// By default it doesn't merge the value
		expect(onEvent).toHaveBeenCalledWith("input_change", { id: "123" })

		// Existing handlers should still have been called
		expect(existingCapture).toHaveBeenCalledTimes(1)
		expect(existingChange).toHaveBeenCalledTimes(1)
	})

    it("should merge mapped value when mapValue is provided", () => {
		const onEvent = vi.fn()

		render(
			<TrackRoot onEvent={onEvent}>
				<Track.OnChange 
                    event="input_change" 
                    params={{ field: "search" }}
                    mapValue={(val) => ({ query: val })}
                >
					<input data-testid="inp" />
				</Track.OnChange>
			</TrackRoot>
		)

		const inp = screen.getByTestId("inp")
		fireEvent.change(inp, { target: { value: "hello" } })

		expect(onEvent).toHaveBeenCalledTimes(1)
		expect(onEvent).toHaveBeenCalledWith("input_change", { field: "search", query: "hello" })
	})

	it("should send event using render prop approach", () => {
		const onEvent = vi.fn()
		const existingChange = vi.fn()

		render(
			<TrackRoot onEvent={onEvent}>
				<Track.OnChange event="custom_input" render={(track) => (
					<input
						data-testid="inp2"
						onChange={(e) => {
							track(e)
							existingChange()
						}}
					/>
				)} />
			</TrackRoot>
		)

		const inp = screen.getByTestId("inp2")
		fireEvent.change(inp, { target: { value: "custom" } })

		expect(onEvent).toHaveBeenCalledTimes(1)
		expect(onEvent).toHaveBeenCalledWith("custom_input", {})
		expect(existingChange).toHaveBeenCalledTimes(1)
	})
})
