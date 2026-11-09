import { Resource } from '@angular/core';

// value() lanza un error si el recurso falló. Fuera de la plantilla (effects, params y
// computed que corren antes de mostrar el error) se lee con esto.
export function loadedValue<T>(resource: Resource<T | undefined>): T | undefined {
  return resource.hasValue() ? resource.value() : undefined;
}
