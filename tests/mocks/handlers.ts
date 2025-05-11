import { rest } from 'msw'

export const handlers = [
    // API endpoint mocks
    rest.get('/api/knowledge-graph', (req, res, ctx) => {
        return res(
            ctx.status(200),
            ctx.json({
                nodes: [],
                edges: []
            })
        )
    }),

    rest.post('/api/chat', (req, res, ctx) => {
        return res(
            ctx.status(200),
            ctx.json({
                message: 'Response message',
                timestamp: new Date().toISOString()
            })
        )
    }),

    rest.get('/api/code-search', (req, res, ctx) => {
        return res(
            ctx.status(200),
            ctx.json({
                results: []
            })
        )
    }),

    // Add more API endpoint mocks as needed
]