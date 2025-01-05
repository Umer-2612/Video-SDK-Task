export const appConfig = {
    api: {
        prefix: '/api/v1',
        port: process.env.PORT || 3000
    },
    cors: {
        origin: '*'
    }
};
