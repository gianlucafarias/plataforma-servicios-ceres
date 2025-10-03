# Estrategia de Testing

## Pirámide
- Unit: helpers, hooks, componentes puros
- Integration: route handlers (API), formularios, carousels con datos
- E2E: journeys críticos (registro → login → perfil profesional)

## Cobertura mínima
- Unit: 70% en `src/lib`, `src/hooks`
- Integration: pruebas por endpoint crítico (auth, professionals, services)
- E2E: 3 smokes + 2 journeys (auth, alta de servicio)

## Casos a priorizar (P1)
- UI: HeroSearch, CategoryCarousel, registro/login
- API: auth/register, professionals list/detail, services list/detail

## Datos de prueba
- Users: admin@test, user@test (seed)
- Profesionales: 5 mocks con categorías/barrio habilitado/no habilitado
- Servicios: 10 mocks

## Comandos
- `npm run test:unit`
- `npm run test:int`
- `npm run test:e2e`
- `npm run test:watch`

## Convenciones
- Un test por comportamiento (happy path + 1 error)
- Nombres: `<archivo>.test.ts(x)` y `describe` por feature