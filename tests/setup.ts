// Necesario con React 19 para compatibilidad con act en Testing Library
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

// React 19 movió act de react-dom/test-utils a react
// Polyfill para compatibilidad con @testing-library/react
import * as React from 'react'
import { act } from 'react'

// Exponer act en el lugar donde react-dom/test-utils lo espera
if (typeof globalThis !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ReactDOM = (globalThis as any).ReactDOM || {};
  ReactDOM.act = act;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).ReactDOM = ReactDOM;
}

import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './testServer'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

