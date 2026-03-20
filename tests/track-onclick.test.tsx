import React from "react"
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { TrackRoot } from "../src/context"
import { Track } from "../src/Track"

describe("Track.OnClick", () => {
	it("should send event when clicked and preserve existing onClickCapture", () => {
		const onEvent = vi.fn()
		const existingCapture = vi.fn()
        const existingClick = vi.fn()

		render(
			<TrackRoot onEvent={onEvent}>
				<Track.OnClick event="button_click" params={{ id: "123" }}>
					<button 
                        data-testid="btn" 
                        onClickCapture={existingCapture}
                        onClick={existingClick}
                    >
						Click Me
					</button>
				</Track.OnClick>
			</TrackRoot>
		)

		const btn = screen.getByTestId("btn")
		fireEvent.click(btn)

		// Tracker should have been called
		expect(onEvent).toHaveBeenCalledTimes(1)
		expect(onEvent).toHaveBeenCalledWith("button_click", { id: "123" })

		// Existing handlers should still have been called
		expect(existingCapture).toHaveBeenCalledTimes(1)
		expect(existingClick).toHaveBeenCalledTimes(1)
	})

	it("should send event using render prop approach", () => {
		const onEvent = vi.fn()
		const existingClick = vi.fn()

		render(
			<TrackRoot onEvent={onEvent}>
				<Track.OnClick event="custom_click" render={(track) => (
					<button
						data-testid="btn2"
						onClick={(e) => {
							track()
							existingClick()
						}}
					>
						Custom Track Button
					</button>
				)} />
			</TrackRoot>
		)

		const btn = screen.getByTestId("btn2")
		fireEvent.click(btn)

		expect(onEvent).toHaveBeenCalledTimes(1)
		expect(onEvent).toHaveBeenCalledWith("custom_click", {})
		expect(existingClick).toHaveBeenCalledTimes(1)
	})

    it("should not crash or create extra dom nodes if children is text", () => {
		const onEvent = vi.fn()

		const { container } = render(
			<TrackRoot onEvent={onEvent}>
				<Track.OnClick event="text_click">
					Just some text
				</Track.OnClick>
			</TrackRoot>
		)

        expect(container.innerHTML).toBe("Just some text")
	})

    it("should work with multiple children elements", () => {
        const onEvent = vi.fn()

        render(
			<TrackRoot onEvent={onEvent}>
				<Track.OnClick event="multi_click">
					<div data-testid="multi1">One</div>
                    <div data-testid="multi2">Two</div>
				</Track.OnClick>
			</TrackRoot>
		)

		fireEvent.click(screen.getByTestId("multi1"))
        expect(onEvent).toHaveBeenCalledTimes(1)

        fireEvent.click(screen.getByTestId("multi2"))
        expect(onEvent).toHaveBeenCalledTimes(2)
    })
})
