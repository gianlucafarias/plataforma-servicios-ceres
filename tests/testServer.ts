import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

export const server = setupServer(

    // mock de ruta de API
    http.get('https://api.ceres.com/services', () => {
        return HttpResponse.json({
            success: true,
            data: [],
            pagination: {
                page: 1,
                limit: 10,
                total: 0,
                totalPages: 0,
            },
        })
    })
)