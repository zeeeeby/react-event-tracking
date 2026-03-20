import { useMountEvent } from "./hooks";
import { EventObject } from "./types";

export const Track = {
	OnMount: (props: EventObject) => {
		useMountEvent(props);
		return null;
	}
};
