// Desarrollo local: /api pasa por proxy.conf.json hacia el backend en localhost:8000/api/v1
export const environment = {
  production: false,
  apiUrl: '/api',
  // Pantalla de cuentas de prueba (docente o estudiante). No existe en el piloto.
  testAccounts: true,
};
