// Necesario con React 19 para compatibilidad con act en Testing Library
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
import * as React from 'react'
import { act as domAct } from 'react-dom/test-utils'
// Exponer React.act para librerías que aún lo esperan en global React
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).React = { ...(React as any), act: domAct }
import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './testServer'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

