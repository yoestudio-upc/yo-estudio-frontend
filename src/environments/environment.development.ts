// Desarrollo local: /api pasa por proxy.conf.json (evita el CORS del backend)
export const environment = {
  production: false,
  useMocks: true,
  apiUrl: '/api',
};
