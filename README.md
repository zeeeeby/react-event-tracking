# react-event-tracking [![NPM Version](https://img.shields.io/npm/v/react-event-tracking)](https://www.npmjs.com/package/react-event-tracking)
A convenient React context for tracking analytics events. 

## Features

- **Nested Contexts**: Automatically merges parameters from parent providers.
- **Zero Re-renders**: No need to wrap props in `useCallback`/`useMemo`.
- **Multiple Providers**: Send events to different analytics services.
- **Event Filtering**: Control which events are sent to which provider.
- **Event Transformation**: Modify event names or parameters before they are sent to provider.

## Table of Contents

<!-- toc -->

- [Installation](#installation)
- [Quickstart](#quickstart)
- [Advanced Usage](#advanced-usage)
  * [Multiple Trackers & Factory](#multiple-trackers--factory)
  * [Filtering Events](#filtering-events)
  * [Transforming Events](#transforming-events)
  * [TypeScript Generics Support](#typescript-generics-support)
- [Best Practices](#best-practices)
- [Built-in Hooks](#built-in-hooks)
  * [useMountEvent](#usemountevent)

<!-- tocstop -->

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
import { useReactEventTracking } from 'react-event-tracking';

const MyButton = () => {
  const { sendEvent } = useReactEventTracking();

  return (
    <>
    // event sent with parameters: { screen: 'dashboard', button_id: '123' }
    <button onClick={() => sendEvent('click', { button_id: '123' })}>
      Click me
    </button>

    {/* Option B: Object call */}                                                                                                           
    <button onClick={() => sendEvent({ eventName: 'click', params: { button_id: '456' } })}>                                                
      Click me too                                                                                                                          
    </button>  
    </>
  );
};
```

## Advanced Usage

### Multiple Trackers & Factory

You can chain multiple `TrackRoot` components to send events to different analytics services. Events bubble up through all providers.

Use `TrackRoot.factory` to create reusable tracker components:

1. Create specific trackers
```tsx
const TrackRootGoogle = TrackRoot.factory(
  (name, params) => gtag('event', name, params)
);

const TrackRootAmplitude = TrackRoot.factory(
  (name, params) => amplitude.logEvent(name, params)
);
```

2. Compose them in your app
```tsx
const App = () => (
  <TrackRootGoogle>
    <TrackRootAmplitude>
      <MyApp />
    </TrackRootAmplitude>
  </TrackRootGoogle>
);
```

### Filtering Events

You can control which events are sent to which provider using the `filter` prop (or the second argument in `factory`). If the filter returns `false`, the event is skipped for that tracker but continues to bubble up to others.

```tsx
// Google Analytics: only track page_* events
const TrackRootGoogle = TrackRoot.factory(
  (name, params) => gtag('event', name, params),
  (name) => name.startsWith('page_')
);

// Amplitude: track everything (filter is optional, defaults to allowing all events)
const TrackRootAmplitude = TrackRoot.factory(
  (name, params) => ampltitude.logEvent(name, params),
);
```

Compose them in your app:

```tsx
const App = () => (
  <TrackRootGoogle>
    <TrackRootAmplitude>
      <MyApp />
    </TrackRootAmplitude>
  </TrackRootGoogle>
);
```

### Transforming Events

You can modify the event name or parameters before they reach the handler using the `transform` prop (or the third argument in `factory`).

Note: Transformations apply locally and do not affect the event bubbling up to parent providers.

```tsx
// GDPR Tracker
const AmpltitudeUS = TrackRoot.factory(
  (name, params) => amplitude.logEvent(name, params),
  undefined, // no filter
  (name, params) => {
    if (params?.userRegion === 'EU') {
      // Remove PII (Personally Identifiable Information)
      const { userId, email, ...safeParams } = params;
      return { 
        eventName: name, 
        params: safeParams 
      };
    }
    return { eventName: name, params };
  }
);
```

### TypeScript Generics Support

`TrackProvider` supports generics for strict typing of the passed parameters.

```tsx
interface ScreenParams {
  screen: "dashboard" | "authScreen"
}

const MyPage = () => (
  <TrackProvider<ScreenParams> params={{ screen: 'dashboard' }}>
    <Content />
  </TrackProvider>
);
```

## Best Practices

A common pattern is to layer data from global to specific. Here is how parameters merge:

```tsx
<TrackRoot onEvent={handleEvent}>
  {/* 1. ROOT: Global data (App Version, Environment) */}
  <TrackProvider params={{ appVersion: '1.0.0' }}>
  
    {/* 2. PAGE: Screen-level context */}
    <TrackProvider params={{ page: 'ProductDetails', category: 'Shoes' }}>
    
      {/* 3. COMPONENT: Widget-level context */}
      <TrackProvider params={{ productId: 'sku-999' }}>
        <AddToCartButton />
      </TrackProvider>

    </TrackProvider>
  </TrackProvider>
</TrackRoot>

// Inside AddToCartButton:
const { sendEvent } = useReactEventTracking();

// 4. EVENT: Action-specific data
// When clicked, we only pass what changed right now.
const handleClick = () => {
  sendEvent('add_to_cart', { quantity: 1 });
};
```

**Resulting Event Payload:**
The library merges all layers automatically. The handler receives:


```js
{
  // From Root
  appVersion: '1.0.0',
  // From Page Provider
  page: 'ProductDetails',
  category: 'Shoes',
  // From Component Provider
  productId: 'sku-999',
  // From Event
  quantity: 1
}
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
