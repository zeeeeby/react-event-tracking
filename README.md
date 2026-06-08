# react-event-tracking [![NPM Version](https://img.shields.io/npm/v/react-event-tracking)](https://www.npmjs.com/package/react-event-tracking)
A convenient React context for tracking analytics events. 

## Features

- **Elegant Type-Safe Api**: enjoy a seamless dot-notation experience with full TypeScript autocompletion.
- **Nested Contexts**: Automatically merges parameters from parent providers.
- **Zero Re-renders**: No need to wrap props in `useCallback`/`useMemo`.
- **Multiple Providers**: Send events to different analytics services.
- **Event Filtering**: Control which events are sent to which provider.
- **Event Transformation**: Modify event names or parameters before they are sent to provider.

## Table of Contents

<!-- toc -->

- [Installation](#installation)
- [Quickstart](#quickstart)
- [Usage Guide](#usage-guide)
  * [Basic Hook](#basic-hook)
  * [Typed Hook Factory](#typed-hook-factory)
  * [Custom Handlers](#custom-handlers)
  * [Standalone Tracking Function](#standalone-tracking-function)
  * [Typed Event Factory](#typed-event-factory)
- [Advanced Usage](#advanced-usage)
  * [Multiple Trackers & Factory](#multiple-trackers--factory)
  * [Filtering Events](#filtering-events)
  * [Transforming Events](#transforming-events)
  * [TypeScript Generics Support](#typescript-generics-support)
- [Best Practices](#best-practices)
- [Built-in Hooks](#built-in-hooks)
  * [useMountEvent](#usemountevent)
- [Built-in Components](#built-in-components)
  * [Track.OnMount](#trackonmount)
  * [Track.OnImpression](#trackonimpression)

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

## Usage Guide

### Basic Hook

Use `useReactEventTracking` for simple event tracking  

```tsx
import { useReactEventTracking } from 'react-event-tracking';

const MyButton = () => {
  const { track } = useReactEventTracking();

  return (
    {/* Option A: String } */}
    <button onClick={() => track('click', { button_id: '123' })}>
      Click me
    </button>

    {/* Option B: Object call */} 
    <button onClick={() => track({ eventName: 'click', params: { button_id: '456' } })}>
      Click me
    </button>

  );
};
```

### Typed Hook Factory

For a more convenient dot-notation syntax and full TypeScript support, create your own hook using `createReactEventTrackingHook`.

1. Set up your events and create a hook:
```tsx
import { createReactEventTrackingHook, createEventFactory } from 'react-event-tracking';


type LoginScreenEvents = {
	forgot_password: { from: "footer" | "button" }
	logged_in: { timePassed: number }
}

type SystemEvents = {
	app_updated: { previous_version: string; current_version: string }
}

// analytics.ts
export type AnalyticsEvents = SystemEvents & {
  // supports deeply nested event maps
	login_screen: LoginScreenEvents
}

export const useTracking = createReactEventTrackingHook<AnalyticsEvents>();

export const eventFactory = createEventFactory<AnalyticsEvents>();
```
More about [createEventFactory](#typed-event-factory)

2. Use it in your components:
```tsx
const LoginButton = () => {
  // You can use the full tracker
  const { track } = useTracking();
  
  // Or narrow it down to a specific scope
  const { track: track2 } = useTracking("login_screen");

  const handleLogin = () => {
    // Full path: eventName is derived from the call chain (result: "login_screen.logged_in")      
    track.login_screen.logged_in({ timePassed: 3000 });
    
    // Narrowed path: the same result: "login_screen.logged_in":
    track2.logged_in({ timePassed: 3000 });
  };
  
  return (    
    <button onClick={handleLogin}>
      Login with Google
    </button>
  );
};
```

### Custom Handlers

Sometimes you need to expose more than just the `track` function, for example, a way to identify users. You can pass custom handlers to the factory.

1. Define your handlers type and create the hook:
```tsx
type MyCustomHandlers = {
  setUserId: (id: string) => void;
}

export const useTracking = createReactEventTrackingHook<AnalyticsEvents, MyCustomHandlers>();
```

2. Create a custom Root using [TrackRoot.factory](#multiple-trackers--factory):
```tsx
import { TrackRoot } from 'react-event-tracking';

const CustomTrackRoot = TrackRoot.factory<MyCustomHandlers>({
  onEvent: (name, params) => {
    amplitude.logEvent(name, params);
  },
  customHandlers: {
    setUserId: (id) => {
      amplitude.setUserId(id);
    }
  }
});

const App = () => (
  <CustomTrackRoot>
    <Main />
  </CustomTrackRoot>
);
```

3. Use it in your components:
```tsx
const Profile = () => {
  const { track, setUserId } = useTracking();

const handleLogin = () => {
    track.login_screen.logged_in({ timePassed: 3000 });
    setUserId('user_123')
  };

  return (
    <button onClick={handleLogin}>
      Login
    </button>
  );
}
```

### Standalone Tracking Function

If you need to use the typed tracking API outside of React components, you can use `createEventTrackingStandalone`. It provides the same dot-notation and type safety as the hook factory.

```ts
import { createEventTrackingStandalone } from 'react-event-tracking';
import { AnalyticsEvents } from './analytics'; // Your events map

// Provide your base tracking implementation
const baseTrack = (eventName: string, params?: Record<string, any>) => {
  amplitude.logEvent(eventName, params);
};

export const trackEvent = createEventTrackingStandalone<AnalyticsEvents>(baseTrack);

// Use it anywhere
trackEvent.login_screen.logged_in({ timePassed: 3000 });
```

### Typed Event Factory
Best for untyped methods
```ts
import { createEventFactory, useMountEvent } from 'react-event-tracking';
import { AnalyticsEvents } from './analytics'; // Your events map

export const eventFactory = createEventFactory<AnalyticsEvents>();

// page.tsx
export function LoginPage() {
  // Creates { eventName: 'login_screen.show', params: {} }        
  useMountEvent(eventFactory.login_screen.show({}))

  return ...
}
```

## Advanced Usage

### Multiple Trackers & Factory

You can chain multiple `TrackRoot` components to send events to different analytics services. Events bubble up through all providers.

Use `TrackRoot.factory` to create reusable tracker components:

1. Create specific trackers
```tsx
const TrackRootGoogle = TrackRoot.factory({
  onEvent: (name, params) => gtag('event', name, params)
});

const TrackRootAmplitude = TrackRoot.factory({
  onEvent: (name, params) => amplitude.logEvent(name, params)
});
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

You can control which events are sent to which provider using the `filter` prop in `factory`. If the filter returns `false`, the event is skipped for that tracker but continues to bubble up to others.

```tsx
// Google Analytics: only track page_* events
const TrackRootGoogle = TrackRoot.factory({
  onEvent: (name, params) => gtag('event', name, params),
  filter: (name) => name.startsWith('page_')
});

// Amplitude: track everything
const TrackRootAmplitude = TrackRoot.factory({
  onEvent: (name, params) => amplitude.logEvent(name, params),
});
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

You can modify the event name or parameters before they are sent to the handler using the `transform` prop in `factory`.

Note: Transformations apply locally and do not affect the event bubbling up to parent providers.

```tsx
// GDPR Tracker
const AmplitudeUS = TrackRoot.factory({
  onEvent: (name, params) => amplitude.logEvent(name, params),
  transform: (name, params) => {
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
});
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
const { track } = useReactEventTracking();

// 4. EVENT: Action-specific data
// When clicked, we only pass what changed right now.
const handleClick = () => {
  track('add_to_cart', { quantity: 1 });
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

## Built-in Components

The library provides convenient wrapper components for declarative event tracking without writing custom hooks or `useEffect`.

### Track.OnMount

Sends an event when the component mounts. It can wrap children or be used as a standalone component. You can pass an event object (for example, generated by the [Typed Event Factory](#typed-event-factory)).

```tsx
import { Track } from 'react-event-tracking';
import { eventFactory } from './analytics';

export function DashboardScreen() {
  return (
    <>
      {/* Option A: String and params */}
      <Track.OnMount event="page_view" params={{ screen: 'dashboard' }}>
        <div>Dashboard</div>
      </Track.OnMount>

      {/* Option B: Event object using Typed Event Factory */}
      <Track.OnMount event={eventFactory.login_screen.show({})}>
        <div>Dashboard</div>
      </Track.OnMount>
    </>
  );
}
```

### Track.OnImpression

Sends an event when the wrapped element becomes visible in the viewport. It uses `IntersectionObserver` under the hood. By default, it triggers only once (`freezeOnceVisible: true`). You can also pass an event object here.

```tsx
import { Track } from 'react-event-tracking';
import { eventFactory } from './analytics';

export function ProductList() {
  return (
    <div>
      {/* Option A: String and params */}
      <Track.OnImpression 
        event="product_viewed" 
        params={{ productId: '123' }}
        options={{ threshold: 0.5 }} // triggers when 50% visible
      >
        <div className="product-card">
          Product 123
        </div>
      </Track.OnImpression>

      {/* Option B: Event object using Typed Event Factory */}
      <Track.OnImpression 
        event={eventFactory.ui.button_click({ id: '123' })}
        options={{ threshold: 0.5 }}
      >
        <div className="product-card">
          Product 123
        </div>
      </Track.OnImpression>
    </div>
  );
}
```
