// Producción (Netlify)
export const environment = {
  production: true,
  // URL pública del servicio `api` en Railway
  apiUrl: 'https://web-production-b96fe1ca.up.railway.app/api/v1',
  // Pantalla de cuentas de prueba: encendida en la demostración (datos inventados).
  // En el piloto real se apaga aquí y con ENABLE_TEST_ACCOUNTS en Railway.
  testAccounts: true,
};
