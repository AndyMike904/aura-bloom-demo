# Aura & Bloom

App web instalable para probar reservas de una peluquería, sin suscripciones, servicios de pago ni tiendas de aplicaciones.

## Demostración

Elige Cliente, Profesional, Administración o Soporte. Puedes reservar, reprogramar, cancelar y revisar las citas. Administración permite editar servicios, profesionales y políticas, bloquear horarios y exportar la agenda como CSV.

La banda amarilla identifica la demostración. Los datos de ejemplo se guardan solo en el navegador: no hay sincronización entre teléfonos y no se envían correos ni se escriben eventos reales en Google. No introduzcas datos reales de clientes. Perfil permite cambiar de rol y reiniciar las pruebas.

En iPhone, abrir en Safari → Compartir → Añadir a pantalla de inicio. En Android, abrir en Chrome → menú ⋮ → Instalar aplicación o Añadir a pantalla de inicio. La primera visita requiere internet. El programa guarda sus archivos para abrir la demostración sin conexión después de la primera carga.

## Publicación gratuita

Archivos estáticos en la raíz de este repositorio. GitHub Pages utiliza la rama `main`, carpeta raíz. No requiere npm, GitHub Actions ni servicios adicionales para publicar.

## Google real

El servidor de Google Apps Script se conserva en el proyecto local original, en `backend/Code.gs`. El código publicado aquí contiene exclusivamente el cliente web, fotos de referencia y configuración pública vacía.

1. Instalar el servidor en la cuenta de Google del negocio, configurar ADMIN_EMAIL y ejecutar setup().
2. Agregar la propiedad del script `WEB_ORIGIN` con `https://andymike904.github.io`.
3. Publicar Apps Script para ejecutar como propietario y permitir que cualquier persona llegue al endpoint. Las operaciones privadas requieren código de acceso por correo y sesión validada en el servidor.
4. Colocar la dirección pública `/exec` en `config.js`, campo `apiUrl`, y publicar el cambio. No colocar claves, contraseñas ni tokens en el repositorio.
5. Probar con cuentas y calendarios reales antes de abrir a clientes. El modo real oculta la selección libre de roles y utiliza la asignación del servidor.

El puente de Apps Script valida el origen de GitHub Pages. El navegador utiliza mensajes al origen exacto de Google y el servidor comprueba sesión, rol y propiedad en cada operación. No se utiliza JSONP ni se pasan sesiones en las direcciones web.

Las cuotas gratuitas de Google limitan los correos y las operaciones diarias. No hay garantía de disponibilidad ni capacidad ilimitada. Push, WhatsApp automático y respaldos diarios siguen pendientes del proyecto original. El flujo real de Google aún necesita prueba de integración; esta publicación es una demostración.
