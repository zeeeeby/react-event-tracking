# react-event-tracking [![NPM Version](https://img.shields.io/npm/v/react-event-tracking)](https://www.npmjs.com/package/react-event-tracking)
A convenient React context for tracking analytics events. 

## Features

- **Nested Contexts**: Automatically merges parameters from parent providers.
- **Zero Re-renders**: No need to wrap props in `useCallback`/`useMemo`.


## Installation

```
npm install react-event-tracking
```
```
yarn add react-event-tracking
```

## Quickstart

1. Define the root handler (e.g., send to GTM, Amplitude or API)
```tsx
import { TrackRoot } from 'react-event-tracking';

const Main = () => (
  <TrackRoot onEvent={(name, params) => gtag('event', name, params)}>
    <App/>
  </TrackRoot>
);
``` 
2. Wrap any component with shared parameters
```tsx
import { TrackProvider } from 'react-event-tracking';

const Dashboard = () => (
  <TrackProvider params={{ screen: 'dashboard' }}>
    <DashboardView/>
  </TrackProvider>
);
```

3. Send events conveniently. On button click, parameters will be merged.

```tsx
import { useTracker } from 'react-event-tracking';

const MyButton = () => {
  const { sendEvent } = useTracker();

  return (
    // event sent with parameters: { screen: 'dashboard', button_id: '123' }
    <button onClick={() => sendEvent('click', { button_id: '123' })}>
      Click me
    </button>
  );
};
```

## Built-in Hooks   

### useMountEvent   

Sends an event when the component mounts.

```tsx
import { useMountEvent } from 'react-event-tracking';

export function DashboardScreen(props) {
    useMountEvent('page_view', { screen: 'dashboard' });

    return <div>Dashboard</div>;
}
```
