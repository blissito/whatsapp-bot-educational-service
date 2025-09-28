/**
 * Cloudflare Worker Multi-Estudiante para WhatsApp + Flowise
 *
 * Rutas:
 * GET  / - Formulario de registro de estudiantes
 * POST / - Procesar registro y mostrar instrucciones
 * POST /webhook/ - Webhook de WhatsApp para todos los estudiantes
 *
 * Variables de entorno:
 * - WEBHOOK_VERIFY_TOKEN: Token para verificar webhooks de WhatsApp
 */

export default {
  async fetch(
    request: Request,
    env: any,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Página de inicio con formulario de registro
    if (request.method === "GET" && path === "/") {
      return new Response(getRegistrationHTML(), {
        headers: { "Content-Type": "text/html" },
      });
    }

    // Procesar registro de estudiante
    if (request.method === "POST" && path === "/") {
      return await handleRegistration(request, env);
    }

    // API para verificar si un Phone Number ID ya existe
    if (request.method === "POST" && path === "/api/check-phone") {
      return await handleCheckPhone(request, env);
    }

    // API para verificar que un registro se guardó correctamente
    if (request.method === "POST" && path === "/api/verify-registration") {
      return await handleVerifyRegistration(request, env);
    }

    // Página de políticas de uso
    if (request.method === "GET" && path === "/policies") {
      return new Response(getPoliciesHTML(), {
        headers: { "Content-Type": "text/html" },
      });
    }

    // Página para editar configuración existente
    if (request.method === "GET" && path === "/edit") {
      return new Response(getEditConfigHTML(), {
        headers: { "Content-Type": "text/html" },
      });
    }

    // Procesar edición de configuración
    if (request.method === "POST" && path === "/edit") {
      return await handleConfigEdit(request, env);
    }

    // Verificación del webhook de WhatsApp (GET request de Meta) - WEBHOOK ÚNICO GLOBAL
    if (request.method === "GET" && path === "/webhook/") {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      if (mode === "subscribe") {
        // Para webhook global, solo usar token global del entorno
        // Los tokens personalizados de estudiantes son para otras validaciones
        if (token === env.WEBHOOK_VERIFY_TOKEN) {
          return new Response(challenge, { status: 200 });
        } else {
          return new Response("Forbidden", { status: 403 });
        }
      }
    }

    // Procesar webhooks de WhatsApp (POST request de Meta) - WEBHOOK ÚNICO GLOBAL
    if (request.method === "POST" && path === "/webhook/") {
      return await handleWhatsAppWebhook(request, env);
    }

    // Health check
    if (request.method === "GET" && path === "/health") {
      return new Response(
        JSON.stringify({
          status: "healthy",
          service: "whatsapp-students-webhook",
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response("Not Found", { status: 404 });
  },
};

// HTML de políticas de uso
function getPoliciesHTML(): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Políticas de Uso - WhatsApp Bot</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .btn-primary {
            background-color: #69c2aa;
            transition: all 0.2s;
        }
        .btn-primary:hover {
            background-color: #5ab096;
        }
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <div class="max-w-4xl mx-auto py-8 px-4">
        <!-- Header -->
        <div class="text-center mb-6">
            <img src="https://www.fixtergeek.com/logo.png" alt="FixterGeek" class="h-12 mx-auto mb-3">
            <h1 class="text-2xl font-bold text-gray-900 mb-1">📋 Políticas de Uso</h1>
            <p class="text-gray-600 text-sm">WhatsApp Bot Educational Service</p>
        </div>

        <!-- URL para copiar -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <label class="block text-sm font-medium text-blue-800 mb-2">📎 URL de Políticas:</label>
            <div class="flex">
                <input type="text" value="https://whatsapp-flowise-webhook.fixtergeek.workers.dev/policies" readonly
                       class="flex-1 px-3 py-2 bg-white border border-blue-300 rounded-l-md text-sm">
                <button onclick="copyToClipboard('https://whatsapp-flowise-webhook.fixtergeek.workers.dev/policies')"
                        class="btn-primary text-white px-4 py-2 rounded-r-md text-sm">
                    📋 Copiar URL
                </button>
            </div>
        </div>

        <!-- Contenido de políticas -->
        <div class="bg-white shadow-lg rounded-lg p-6 space-y-6">

            <!-- 1. Propósito Educativo -->
            <section>
                <h2 class="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <span class="btn-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-2">1</span>
                    🎓 Propósito Educativo
                </h2>
                <div class="bg-blue-50 border border-blue-200 rounded p-4">
                    <ul class="text-gray-700 text-sm space-y-2">
                        <li>• Este servicio está diseñado exclusivamente para fines educativos</li>
                        <li>• Los estudiantes pueden experimentar con bots de WhatsApp de forma segura</li>
                        <li>• No está permitido el uso comercial o de producción</li>
                        <li>• Los tokens tienen duración limitada para evitar abusos</li>
                    </ul>
                </div>
            </section>

            <!-- 2. Responsabilidades del Usuario -->
            <section>
                <h2 class="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <span class="bg-yellow-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-2">2</span>
                    👤 Responsabilidades del Usuario
                </h2>
                <div class="bg-yellow-50 border border-yellow-200 rounded p-4">
                    <ul class="text-gray-700 text-sm space-y-2">
                        <li>• Usar únicamente con fines educativos y de aprendizaje</li>
                        <li>• No enviar spam o contenido inapropiado</li>
                        <li>• Respetar las políticas de WhatsApp y Meta</li>
                        <li>• Mantener seguros sus tokens y credenciales</li>
                        <li>• No compartir acceso con terceros no autorizados</li>
                    </ul>
                </div>
            </section>

            <!-- 3. Limitaciones del Servicio -->
            <section>
                <h2 class="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <span class="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-2">3</span>
                    ⚠️ Limitaciones del Servicio
                </h2>
                <div class="bg-red-50 border border-red-200 rounded p-4">
                    <ul class="text-gray-700 text-sm space-y-2">
                        <li>• Los tokens de WhatsApp expiran frecuentemente (pocas horas)</li>
                        <li>• El servicio puede tener interrupciones sin previo aviso</li>
                        <li>• No garantizamos la disponibilidad 24/7</li>
                        <li>• Los datos pueden ser eliminados sin previo aviso</li>
                        <li>• Límites de rate limiting según políticas de WhatsApp</li>
                    </ul>
                </div>
            </section>

            <!-- 4. Privacidad y Datos -->
            <section>
                <h2 class="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <span class="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-2">4</span>
                    🔒 Privacidad y Datos
                </h2>
                <div class="bg-green-50 border border-green-200 rounded p-4">
                    <ul class="text-gray-700 text-sm space-y-2">
                        <li>• Solo almacenamos datos necesarios para el funcionamiento</li>
                        <li>• Los tokens se encriptan y almacenan de forma segura</li>
                        <li>• No compartimos datos con terceros</li>
                        <li>• Los logs se mantienen por tiempo limitado</li>
                        <li>• Puedes solicitar eliminación de tus datos</li>
                    </ul>
                </div>
            </section>

            <!-- 5. Contacto y Soporte -->
            <section>
                <h2 class="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <span class="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-2">5</span>
                    📞 Contacto y Soporte
                </h2>
                <div class="bg-purple-50 border border-purple-200 rounded p-4">
                    <ul class="text-gray-700 text-sm space-y-2">
                        <li>• Para soporte técnico contacta a tu instructor</li>
                        <li>• Reporta problemas o abusos inmediatamente</li>
                        <li>• El soporte es limitado a horarios de clase</li>
                        <li>• No brindamos soporte comercial o de producción</li>
                    </ul>
                </div>
            </section>

        </div>

        <!-- Aceptación -->
        <div class="bg-gray-100 border border-gray-300 rounded-lg p-4 mt-6">
            <p class="text-gray-700 text-sm text-center">
                <span class="font-medium">Al usar este servicio, aceptas estas políticas de uso.</span><br>
                Última actualización: ${new Date().toLocaleDateString("es-ES")}
            </p>
        </div>

        <!-- Navegación -->
        <div class="text-center mt-6 space-y-3">
            <div>
                <a href="/" class="inline-block btn-primary text-white font-medium py-2 px-6 rounded-md">
                    ← Volver al registro
                </a>
            </div>
            <div>
                <a href="/policies" class="text-gray-500 hover:text-gray-700 text-xs underline">📋 Términos y políticas de uso</a>
            </div>
        </div>
    </div>

    <script>
        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(function() {
                const button = event.target;
                const originalText = button.textContent;
                button.textContent = '✅ Copiado!';
                setTimeout(() => {
                    button.textContent = originalText;
                }, 2000);
            });
        }
    </script>
</body>
</html>`;
}

// HTML del formulario para editar configuración existente
function getEditConfigHTML(): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Editar Configuración - WhatsApp Bot</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .btn-primary {
            background-color: #69c2aa;
            transition: all 0.2s;
        }
        .btn-primary:hover {
            background-color: #5ab096;
        }
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <div class="max-w-2xl mx-auto py-12 px-4">
        <!-- Header -->
        <div class="text-center mb-6">
            <img src="https://www.fixtergeek.com/logo.png" alt="FixterGeek" class="h-12 mx-auto mb-3">
            <h1 class="text-xl font-bold text-gray-900 mb-1">✏️ Editar Configuración</h1>
            <p class="text-gray-600 text-sm">Actualiza tu configuración de WhatsApp Bot</p>
        </div>

        <!-- Paso 1: Autenticación -->
        <div class="bg-white shadow-lg rounded-lg p-6 mb-6" id="authStep">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">🔐 Identificarse</h2>

            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Phone Number ID</label>
                    <input type="text" id="authPhoneId" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                           placeholder="123456789">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Webhook Verify Token</label>
                    <input type="password" id="authToken" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                           placeholder="Tu token secret actual">
                    <p class="text-xs text-gray-500 mt-1">Introduce tu token secret actual para verificar identidad</p>
                </div>

                <button onclick="authenticate()"
                        class="w-full btn-primary text-white font-medium py-2 px-4 rounded-md">
                    🔐 Acceder a mi configuración
                </button>
            </div>
        </div>

        <!-- Paso 2: Editar configuración (oculto inicialmente) -->
        <div class="bg-white shadow-lg rounded-lg p-6 mb-6 hidden" id="editStep">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">✏️ Modificar mi configuración</h2>

            <form method="POST" class="space-y-4" id="editForm">
                <input type="hidden" name="action" value="update">
                <input type="hidden" id="editPhoneId" name="phoneNumberId">
                <input type="hidden" id="editVerifyToken" name="verifyToken">

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                    <input type="text" id="editName" name="studentName" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">URL completa de tu flujo IA</label>
                    <input type="url" id="editFlowiseUrl" name="completeFlowiseUrl" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <p class="text-xs text-gray-500 mt-1">URL completa del endpoint de tu Agent Flow</p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">WhatsApp Access Token</label>
                    <input type="text" id="editAccessToken" name="accessToken" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <p class="text-xs text-gray-500 mt-1">Token actual o nuevo token</p>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Webhook Verify Token</label>
                    <input type="text" id="editWebhookToken" name="webhookVerifyToken" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                    <p class="text-xs text-gray-500 mt-1">Token secret que tienes configurado en WhatsApp Business API</p>
                </div>

                <button type="submit"
                        class="w-full btn-primary text-white font-medium py-2 px-4 rounded-md">
                    💾 Guardar cambios
                </button>
            </form>
        </div>

        <!-- Mensaje de error -->
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 hidden" id="errorMsg">
            <p class="text-red-800 text-sm"></p>
        </div>

        <!-- Enlaces de navegación -->
        <div class="text-center mt-6 space-y-3">
            <div>
                <a href="/" class="text-blue-600 hover:text-blue-700 text-sm">← Volver al registro</a>
            </div>
            <div>
                <a href="/policies" class="text-gray-500 hover:text-gray-700 text-xs underline">📋 Términos y políticas de uso</a>
            </div>
        </div>
    </div>

    <script>
        async function authenticate() {
            const phoneId = document.getElementById('authPhoneId').value;
            const token = document.getElementById('authToken').value;

            if (!phoneId || !token) {
                showError('Por favor completa todos los campos');
                return;
            }

            try {
                const response = await fetch('/edit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'authenticate', phoneNumberId: phoneId, verifyToken: token })
                });

                const data = await response.json();

                if (response.ok) {
                    // Pre-llenar formulario con config actual
                    document.getElementById('editPhoneId').value = data.phoneNumberId;
                    document.getElementById('editVerifyToken').value = token;
                    document.getElementById('editName').value = data.studentName;
                    document.getElementById('editFlowiseUrl').value = data.completeFlowiseUrl;
                    document.getElementById('editAccessToken').value = data.accessToken;
                    document.getElementById('editWebhookToken').value = data.webhookVerifyToken || token;

                    // Mostrar formulario de edición pre-llenado
                    document.getElementById('authStep').classList.add('hidden');
                    document.getElementById('editStep').classList.remove('hidden');
                    hideError();
                } else {
                    showError(data.error || 'Credenciales incorrectas');
                }
            } catch (error) {
                showError('Error de conexión');
            }
        }

        function showError(message) {
            const errorDiv = document.getElementById('errorMsg');
            errorDiv.querySelector('p').textContent = message;
            errorDiv.classList.remove('hidden');
        }

        function hideError() {
            document.getElementById('errorMsg').classList.add('hidden');
        }
    </script>
</body>
</html>`;
}

// Manejar edición de configuración
async function handleConfigEdit(request: Request, env: any): Promise<Response> {
  try {
    const contentType = request.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      const body = await request.json();

      // Autenticación para edición profesional
      if (body.action === "authenticate") {
        const { phoneNumberId, verifyToken } = body;

        // Validar que se proporcionen ambos campos
        if (!phoneNumberId || !verifyToken) {
          return new Response(
            JSON.stringify({
              error: "Phone Number ID y Webhook Verify Token son requeridos",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        // Buscar configuración
        const configString = await env.KV.get(phoneNumberId);
        if (!configString) {
          return new Response(
            JSON.stringify({
              error: "No se encontró configuración con ese Phone Number ID",
            }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        const config = JSON.parse(configString);

        // Validar token webhook (puede ser personalizado por estudiante o global)
        const validToken =
          config.webhookVerifyToken || env.WEBHOOK_VERIFY_TOKEN;
        if (verifyToken !== validToken) {
          return new Response(
            JSON.stringify({ error: "Webhook Verify Token incorrecto" }),
            {
              status: 401,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        return new Response(JSON.stringify(config), {
          headers: { "Content-Type": "application/json" },
        });
      }

      // Búsqueda de configuración (deprecated)
      if (body.action === "search") {
        const { phoneNumberId } = body;

        const configString = await env.KV.get(phoneNumberId);
        if (!configString) {
          return new Response(
            JSON.stringify({
              error: "No se encontró configuración con ese Phone Number ID",
            }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        const config = JSON.parse(configString);
        return new Response(JSON.stringify(config), {
          headers: { "Content-Type": "application/json" },
        });
      }
    } else {
      // Actualización de configuración
      const formData = await request.formData();

      if (formData.get("action") === "update") {
        const phoneNumberId = formData.get("phoneNumberId")?.toString() || "";
        const verifyToken = formData.get("verifyToken")?.toString() || "";
        const studentName = formData.get("studentName")?.toString() || "";
        const completeUrl =
          formData.get("completeFlowiseUrl")?.toString() || "";
        const accessToken = formData.get("accessToken")?.toString() || "";
        const webhookVerifyToken =
          formData.get("webhookVerifyToken")?.toString() || "";

        // Buscar configuración existente para validar token
        const existingConfigString = await env.KV.get(phoneNumberId);
        if (!existingConfigString) {
          throw new Error("Configuración no encontrada");
        }

        const existingConfig = JSON.parse(existingConfigString);

        // Validar webhook verify token (puede ser personalizado o global)
        const validToken =
          existingConfig.webhookVerifyToken || env.WEBHOOK_VERIFY_TOKEN;
        if (verifyToken !== validToken) {
          throw new Error("Token de verificación incorrecto");
        }

        // Extraer flowiseUrl y chatflowId de la URL completa
        let flowiseUrl = "";
        let chatflowId = "";

        try {
          const url = new URL(completeUrl);
          const pathParts = url.pathname.split("/");
          const predictionIndex = pathParts.indexOf("prediction");

          if (
            predictionIndex !== -1 &&
            predictionIndex < pathParts.length - 1
          ) {
            chatflowId = pathParts[predictionIndex + 1];
            flowiseUrl = `${url.protocol}//${url.host}`;
          } else {
            throw new Error("URL no válida");
          }
        } catch (error) {
          throw new Error("La URL del flujo IA no tiene el formato correcto");
        }

        // Actualizar configuración
        const updatedConfig = {
          ...existingConfig,
          studentName: studentName,
          flowiseUrl: flowiseUrl,
          chatflowId: chatflowId,
          completeFlowiseUrl: completeUrl,
          accessToken: accessToken,
          webhookVerifyToken: webhookVerifyToken,
          lastUpdate: new Date().toISOString(),
          lastTokenUpdate: new Date().toISOString(),
        };

        // Guardar configuración actualizada
        await env.KV.put(phoneNumberId, JSON.stringify(updatedConfig));

        // Mostrar página de éxito con instrucciones actualizadas
        return new Response(getSuccessHTML(updatedConfig), {
          headers: { "Content-Type": "text/html" },
        });
      }
    }

    return new Response("Bad Request", { status: 400 });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Error desconocido",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Función eliminada - ahora se usa solo /edit

// HTML del formulario para actualizar token
function getUpdateTokenHTML_DEPRECATED(): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Actualizar Token - WhatsApp Bot</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .btn-primary {
            background-color: #69c2aa;
            transition: all 0.2s;
        }
        .btn-primary:hover {
            background-color: #5ab096;
        }
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <div class="max-w-2xl mx-auto py-12 px-4">
        <!-- Header -->
        <div class="text-center mb-6">
            <img src="https://www.fixtergeek.com/logo.png" alt="FixterGeek" class="h-12 mx-auto mb-3">
            <h1 class="text-xl font-bold text-gray-900 mb-1">🔄 Actualizar Token</h1>
            <p class="text-gray-600 text-sm">Tu token de WhatsApp ha expirado, actualízalo aquí</p>
        </div>

        <!-- Info sobre expiración -->
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div class="flex items-start">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="ml-3">
                    <h3 class="text-sm font-medium text-yellow-800">
                        Token Expirado
                    </h3>
                    <div class="mt-2 text-sm text-yellow-700">
                        <p>Los tokens de WhatsApp (Meta for Developers) expiran en pocas horas. Obtén un nuevo token y actualízalo aquí para que tu bot siga funcionando.</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Formulario de actualización -->
        <form method="POST" class="bg-white shadow-lg rounded-lg p-6">
            <div class="space-y-4">
                <!-- Phone Number ID -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Phone Number ID</label>
                    <input type="text" name="phoneNumberId" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                           placeholder="123456789">
                </div>

                <!-- Webhook Verify Token -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Webhook Verify Token</label>
                    <input type="password" name="verifyToken" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                           placeholder="fixtergeek_2024">
                    <p class="text-xs text-gray-500 mt-1">Para verificar que eres tú</p>
                </div>

                <!-- Nuevo WhatsApp Access Token -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Nuevo WhatsApp Access Token</label>
                    <input type="text" name="newAccessToken" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                           placeholder="EAAF...">
                    <p class="text-xs text-gray-500 mt-1">Nuevo token de Meta for Developers → WhatsApp → API Setup</p>
                </div>

                <!-- Submit button -->
                <button type="submit"
                        class="w-full btn-primary text-white font-medium py-2 px-4 rounded-md">
                    ✏️ Editar
                </button>
            </div>
        </form>

        <!-- Instrucciones -->
        <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 class="text-sm font-medium text-blue-900 mb-2">📝 Cómo obtener un nuevo token:</h3>
            <ol class="text-sm text-blue-800 space-y-1">
                <li>1. Ve a <a href="https://developers.facebook.com" target="_blank" class="underline">developers.facebook.com</a></li>
                <li>2. Selecciona tu app → WhatsApp → API Setup</li>
                <li>3. Copia el nuevo "Access Token" temporal</li>
                <li>4. Pégalo arriba y actualiza</li>
            </ol>
        </div>

        <!-- Link para volver -->
        <div class="text-center mt-6">
            <a href="/" class="text-blue-600 hover:text-blue-700 text-sm">← Volver al registro</a>
        </div>
    </div>
</body>
</html>`;
}

// HTML de éxito para actualización de token
function getTokenUpdateSuccessHTML(config: any): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Token Actualizado - WhatsApp Bot</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .btn-primary {
            background-color: #69c2aa;
            transition: all 0.2s;
        }
        .btn-primary:hover {
            background-color: #5ab096;
        }
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <div class="max-w-2xl mx-auto py-12 px-4">
        <!-- Header de éxito -->
        <div class="text-center mb-8">
            <img src="https://www.fixtergeek.com/logo.png" alt="FixterGeek" class="h-12 mx-auto mb-3">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
            </div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">¡Token actualizado! 🎉</h1>
            <p class="text-gray-600">Tu bot ya puede volver a funcionar normalmente</p>
        </div>

        <!-- Información actualizada -->
        <div class="bg-white shadow-lg rounded-lg p-6 mb-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">📋 Configuración actualizada</h2>

            <div class="grid grid-cols-1 gap-4">
                <div class="bg-gray-50 rounded-lg p-3">
                    <label class="block text-sm font-medium text-gray-700">Estudiante:</label>
                    <p class="text-gray-900 font-medium">${
                      config.studentName
                    }</p>
                </div>

                <div class="bg-gray-50 rounded-lg p-3">
                    <label class="block text-sm font-medium text-gray-700">Phone Number ID:</label>
                    <p class="text-gray-900 font-mono">${
                      config.phoneNumberId
                    }</p>
                </div>

                <div class="bg-gray-50 rounded-lg p-3">
                    <label class="block text-sm font-medium text-gray-700">Token actualizado el:</label>
                    <p class="text-gray-900">${new Date(
                      config.lastTokenUpdate
                    ).toLocaleString("es-ES")}</p>
                </div>
            </div>
        </div>

        <!-- Importante -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 class="text-blue-900 font-medium mb-2">✅ Todo listo</h3>
            <ul class="text-blue-800 text-sm space-y-1">
                <li>• Tu bot ya puede procesar mensajes nuevamente</li>
                <li>• El nuevo token está guardado y activo</li>
                <li>• No necesitas cambiar nada en Flowise</li>
            </ul>
        </div>

        <!-- Recordatorio -->
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 class="text-yellow-900 font-medium mb-2">💡 Recordatorio importante</h3>
            <p class="text-yellow-800 text-sm">
                Los tokens de WhatsApp expiran frecuentemente. Guarda este enlace para futuras actualizaciones:
                <br><strong>https://tu-dominio.workers.dev/update-token</strong>
            </p>
        </div>

        <!-- Botones de navegación -->
        <div class="text-center space-x-4">
            <a href="/" class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition">
                ← Volver al inicio
            </a>
            <a href="/edit" class="inline-block bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded-md transition">
                🔄 Actualizar otro token
            </a>
        </div>
    </div>
</body>
</html>`;
}

// HTML del formulario de registro refactorizado con validación en tiempo real
function getRegistrationHTML(): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhatsApp Bot - Registro de Estudiantes</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .btn-primary {
            background-color: #69c2aa;
            transition: all 0.2s;
        }
        .btn-primary:hover:not(:disabled) {
            background-color: #5ab096;
        }
        .btn-primary:disabled {
            background-color: #9ca3af;
            cursor: not-allowed;
        }
        .loading-spinner {
            border: 2px solid #f3f3f3;
            border-radius: 50%;
            border-top: 2px solid #69c2aa;
            width: 16px;
            height: 16px;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .field-error {
            border-color: #ef4444;
            background-color: #fef2f2;
        }
        .field-success {
            border-color: #10b981;
            background-color: #f0fdf4;
        }
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <div class="max-w-2xl mx-auto py-12 px-4">
        <!-- Header -->
        <div class="text-center mb-6">
            <img src="https://www.fixtergeek.com/logo.png" alt="FixterGeek" class="h-12 mx-auto mb-3">
            <h1 class="text-xl font-bold text-gray-900 mb-1">WhatsApp Bot</h1>
            <p class="text-gray-600 text-sm">Registra tu bot en 30 segundos</p>
        </div>

        <!-- Enlace para editar configuración existente -->
        <div class="text-center mb-6">
            <a href="/edit" class="text-blue-600 hover:text-blue-700 text-sm underline">
                ✏️ ¿Ya tienes un bot registrado? Editar mi configuración
            </a>
        </div>

        <!-- Mensaje de estado -->
        <div id="statusMessage" class="hidden mb-4 p-4 rounded-md">
            <div class="flex items-center">
                <div id="statusIcon" class="flex-shrink-0 mr-3"></div>
                <div id="statusText" class="text-sm font-medium"></div>
            </div>
        </div>

        <!-- Formulario de registro -->
        <form id="registrationForm" class="bg-white shadow-lg rounded-lg p-6">
            <div class="space-y-4">
                <!-- Nombre del estudiante -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                    <input type="text" id="studentName" name="studentName" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                           placeholder="Tu nombre completo">
                    <div id="studentName-error" class="hidden text-red-600 text-xs mt-1"></div>
                </div>

                <!-- Phone Number ID -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Phone Number ID</label>
                    <div class="relative">
                        <input type="text" id="phoneNumberId" name="phoneNumberId" required
                               class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                               placeholder="123456789">
                        <div id="phoneNumberId-spinner" class="hidden absolute right-3 top-3">
                            <div class="loading-spinner"></div>
                        </div>
                    </div>
                    <div id="phoneNumberId-error" class="hidden text-red-600 text-xs mt-1"></div>
                    <div id="phoneNumberId-success" class="hidden text-green-600 text-xs mt-1"></div>
                </div>

                <!-- URL Completa de Flowise -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">URL completa de tu flujo IA</label>
                    <input type="url" id="completeFlowiseUrl" name="completeFlowiseUrl" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                           placeholder="https://tu-flowise.com/api/v1/prediction/uuid-chatflow">
                    <p class="text-xs text-gray-500 mt-1">URL completa del endpoint de tu Agent Flow</p>
                    <div id="completeFlowiseUrl-error" class="hidden text-red-600 text-xs mt-1"></div>
                </div>

                <!-- WhatsApp Access Token -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">WhatsApp Access Token</label>
                    <input type="text" id="accessToken" name="accessToken" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                           placeholder="EAAF...">
                    <p class="text-xs text-gray-500 mt-1">De Meta for Developers → WhatsApp → API Setup</p>
                    <div id="accessToken-error" class="hidden text-red-600 text-xs mt-1"></div>
                </div>

                <!-- Webhook Verify Token (personalizado) -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Webhook Verify Token</label>
                    <input type="text" id="webhookVerifyToken" name="webhookVerifyToken" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                           placeholder="Ej: mi_token_secreto_2024">
                    <p class="text-xs text-gray-500 mt-1">Token secret que configurarás en WhatsApp Business API</p>
                    <div id="webhookVerifyToken-error" class="hidden text-red-600 text-xs mt-1"></div>
                </div>

                <!-- Submit button -->
                <button type="submit" id="submitBtn"
                        class="w-full btn-primary text-white font-medium py-2 px-4 rounded-md flex items-center justify-center">
                    <span id="submitText">Registrar Bot</span>
                    <div id="submitSpinner" class="hidden ml-2">
                        <div class="loading-spinner"></div>
                    </div>
                </button>

                <!-- Políticas -->
                <div class="text-center mt-3">
                    <p class="text-xs text-gray-500">
                        Al registrarte aceptas las
                        <a href="/policies" target="_blank" class="text-blue-600 hover:text-blue-700 underline">
                            Políticas de Uso
                        </a>
                    </p>
                </div>
            </div>
        </form>
    </div>

    <script>
        let validationTimer;
        let isSubmitting = false;

        // Validación en tiempo real del Phone Number ID
        document.getElementById('phoneNumberId').addEventListener('input', function() {
            clearTimeout(validationTimer);
            const phoneId = this.value.trim();

            if (phoneId.length < 3) {
                resetPhoneValidation();
                return;
            }

            showPhoneSpinner();

            validationTimer = setTimeout(async () => {
                await validatePhoneId(phoneId);
            }, 500);
        });

        function showPhoneSpinner() {
            document.getElementById('phoneNumberId-spinner').classList.remove('hidden');
            hidePhoneMessages();
        }

        function hidePhoneSpinner() {
            document.getElementById('phoneNumberId-spinner').classList.add('hidden');
        }

        function hidePhoneMessages() {
            document.getElementById('phoneNumberId-error').classList.add('hidden');
            document.getElementById('phoneNumberId-success').classList.add('hidden');
        }

        function resetPhoneValidation() {
            hidePhoneSpinner();
            hidePhoneMessages();
            document.getElementById('phoneNumberId').classList.remove('field-error', 'field-success');
        }

        async function validatePhoneId(phoneId) {
            try {
                const response = await fetch('/api/check-phone', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phoneNumberId: phoneId })
                });

                const result = await response.json();
                hidePhoneSpinner();

                if (result.exists) {
                    showPhoneError(\`Ya existe un registro con este Phone Number ID para "\${result.studentName}"\`);
                } else {
                    showPhoneSuccess('Phone Number ID disponible');
                }
            } catch (error) {
                hidePhoneSpinner();
                showPhoneError('Error verificando Phone Number ID');
            }
        }

        function showPhoneError(message) {
            const input = document.getElementById('phoneNumberId');
            const errorDiv = document.getElementById('phoneNumberId-error');

            input.classList.add('field-error');
            input.classList.remove('field-success');
            errorDiv.textContent = message;
            errorDiv.classList.remove('hidden');
            document.getElementById('phoneNumberId-success').classList.add('hidden');
        }

        function showPhoneSuccess(message) {
            const input = document.getElementById('phoneNumberId');
            const successDiv = document.getElementById('phoneNumberId-success');

            input.classList.add('field-success');
            input.classList.remove('field-error');
            successDiv.textContent = message;
            successDiv.classList.remove('hidden');
            document.getElementById('phoneNumberId-error').classList.add('hidden');
        }

        // Validación de URL de Flowise
        document.getElementById('completeFlowiseUrl').addEventListener('input', function() {
            const url = this.value.trim();
            if (url.length === 0) return;

            try {
                const urlObj = new URL(url);
                const pathParts = urlObj.pathname.split('/');
                const predictionIndex = pathParts.indexOf('prediction');

                if (predictionIndex === -1 || predictionIndex >= pathParts.length - 1) {
                    showFieldError('completeFlowiseUrl', 'La URL debe contener "/api/v1/prediction/chatflow-id"');
                } else {
                    hideFieldError('completeFlowiseUrl');
                    this.classList.add('field-success');
                }
            } catch (error) {
                showFieldError('completeFlowiseUrl', 'URL no válida');
            }
        });

        // Validación de Access Token
        document.getElementById('accessToken').addEventListener('input', function() {
            const token = this.value.trim();
            if (token.length === 0) return;

            if (!token.startsWith('EAAF') && !token.startsWith('EAA')) {
                showFieldError('accessToken', 'El token debe comenzar con "EAAF" o "EAA"');
            } else if (token.length < 50) {
                showFieldError('accessToken', 'El token parece muy corto');
            } else {
                hideFieldError('accessToken');
                this.classList.add('field-success');
            }
        });

        function showFieldError(fieldId, message) {
            const input = document.getElementById(fieldId);
            const errorDiv = document.getElementById(fieldId + '-error');

            input.classList.add('field-error');
            input.classList.remove('field-success');
            errorDiv.textContent = message;
            errorDiv.classList.remove('hidden');
        }

        function hideFieldError(fieldId) {
            const input = document.getElementById(fieldId);
            const errorDiv = document.getElementById(fieldId + '-error');

            input.classList.remove('field-error');
            errorDiv.classList.add('hidden');
        }

        // Manejo del envío del formulario
        document.getElementById('registrationForm').addEventListener('submit', async function(e) {
            e.preventDefault();

            if (isSubmitting) return;

            isSubmitting = true;
            setSubmitState(true);

            try {
                const formData = new FormData(this);

                showStatus('info', 'Registrando tu bot...', true);

                const response = await fetch('/', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    const result = await response.text();

                    // Verificar si la respuesta contiene la página de éxito
                    if (result.includes('¡Registro Exitoso!')) {
                        showStatus('success', 'Bot registrado exitosamente! Verificando guardado...', true);

                        // Verificar que se guardó correctamente
                        setTimeout(async () => {
                            const phoneId = formData.get('phoneNumberId');
                            const saved = await verifyRegistration(phoneId);

                            if (saved) {
                                showStatus('success', \`✅ Confirmado: Tu bot "\${formData.get('studentName')}" está registrado y funcionando\`, false);
                                setTimeout(() => {
                                    window.location.href = '/?success=1&phone=' + phoneId;
                                }, 2000);
                            } else {
                                showStatus('error', 'Registro completado pero hay un problema con el guardado. Contacta soporte.', false);
                            }
                        }, 1000);
                    } else {
                        throw new Error('Respuesta inesperada del servidor');
                    }
                } else {
                    const errorText = await response.text();
                    throw new Error('Error en el registro: ' + response.status);
                }
            } catch (error) {
                showStatus('error', 'Error durante el registro: ' + error.message, false);
            } finally {
                isSubmitting = false;
                setSubmitState(false);
            }
        });

        async function verifyRegistration(phoneId) {
            try {
                const response = await fetch('/api/verify-registration', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phoneNumberId: phoneId })
                });

                const result = await response.json();
                return result.exists;
            } catch (error) {
                return false;
            }
        }

        function setSubmitState(loading) {
            const submitBtn = document.getElementById('submitBtn');
            const submitText = document.getElementById('submitText');
            const submitSpinner = document.getElementById('submitSpinner');

            submitBtn.disabled = loading;

            if (loading) {
                submitText.textContent = 'Registrando...';
                submitSpinner.classList.remove('hidden');
            } else {
                submitText.textContent = 'Registrar Bot';
                submitSpinner.classList.add('hidden');
            }
        }

        function showStatus(type, message, loading) {
            const statusDiv = document.getElementById('statusMessage');
            const statusIcon = document.getElementById('statusIcon');
            const statusText = document.getElementById('statusText');

            statusDiv.classList.remove('hidden', 'bg-blue-50', 'border-blue-200', 'bg-green-50', 'border-green-200', 'bg-red-50', 'border-red-200');
            statusText.classList.remove('text-blue-800', 'text-green-800', 'text-red-800');

            if (type === 'info') {
                statusDiv.classList.add('bg-blue-50', 'border', 'border-blue-200');
                statusText.classList.add('text-blue-800');
                statusIcon.innerHTML = loading ? '<div class="loading-spinner"></div>' : '💡';
            } else if (type === 'success') {
                statusDiv.classList.add('bg-green-50', 'border', 'border-green-200');
                statusText.classList.add('text-green-800');
                statusIcon.innerHTML = loading ? '<div class="loading-spinner"></div>' : '✅';
            } else if (type === 'error') {
                statusDiv.classList.add('bg-red-50', 'border', 'border-red-200');
                statusText.classList.add('text-red-800');
                statusIcon.innerHTML = '❌';
            }

            statusText.textContent = message;
        }
    </script>
</body>
</html>`;
}

// Manejar registro de estudiante
async function handleRegistration(
  request: Request,
  env: any
): Promise<Response> {
  try {
    const formData = await request.formData();

    const completeUrl = formData.get("completeFlowiseUrl")?.toString() || "";

    // Extraer flowiseUrl y chatflowId de la URL completa
    let flowiseUrl = "";
    let chatflowId = "";

    try {
      const url = new URL(completeUrl);
      const pathParts = url.pathname.split("/");
      const predictionIndex = pathParts.indexOf("prediction");

      if (predictionIndex !== -1 && predictionIndex < pathParts.length - 1) {
        chatflowId = pathParts[predictionIndex + 1];
        flowiseUrl = `${url.protocol}//${url.host}`;
      } else {
        throw new Error("URL no válida");
      }
    } catch (error) {
      throw new Error("La URL del flujo IA no tiene el formato correcto");
    }

    const phoneNumberId = formData.get("phoneNumberId")?.toString() || "";
    const accessToken = formData.get("accessToken")?.toString() || "";

    const webhookVerifyToken = formData.get("webhookVerifyToken")?.toString();

    const studentConfig = {
      studentName: formData.get("studentName")?.toString() || "",
      phoneNumberId: phoneNumberId,
      flowiseUrl: flowiseUrl,
      chatflowId: chatflowId,
      completeFlowiseUrl: completeUrl,
      accessToken: accessToken,
      ...(webhookVerifyToken && { webhookVerifyToken }), // Solo guarda si se especificó
      registeredAt: new Date().toISOString(),
    };

    // Validar datos básicos
    if (
      !studentConfig.studentName ||
      !studentConfig.phoneNumberId ||
      !studentConfig.flowiseUrl ||
      !studentConfig.chatflowId ||
      !studentConfig.accessToken
    ) {
      throw new Error("Todos los campos son requeridos");
    }

    // Verificar si ya existe una configuración con este Phone Number ID
    const existingConfig = await env.KV.get(studentConfig.phoneNumberId);
    if (existingConfig) {
      const existing = JSON.parse(existingConfig);
      throw new Error(
        `Ya existe un registro con Phone Number ID "${studentConfig.phoneNumberId}" para "${existing.studentName}". Si eres tú, usa el enlace "Editar mi configuración" desde la página principal.`
      );
    }

    // Guardar en KV usando phoneNumberId como clave
    await env.KV.put(
      studentConfig.phoneNumberId,
      JSON.stringify(studentConfig)
    );

    // Mostrar página de éxito con instrucciones
    return new Response(getSuccessHTML(studentConfig), {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    return new Response(
      getErrorHTML(
        error instanceof Error ? error.message : "Error desconocido"
      ),
      {
        headers: { "Content-Type": "text/html" },
        status: 400,
      }
    );
  }
}

// API para verificar si un Phone Number ID ya existe
async function handleCheckPhone(request: Request, env: any): Promise<Response> {
  try {
    const body = await request.json();
    const { phoneNumberId } = body;

    if (!phoneNumberId) {
      return new Response(
        JSON.stringify({ error: "Phone Number ID requerido" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Buscar en KV si ya existe
    const existingConfigString = await env.KV.get(phoneNumberId.toString());

    if (existingConfigString) {
      const existingConfig = JSON.parse(existingConfigString);
      return new Response(
        JSON.stringify({
          exists: true,
          studentName: existingConfig.studentName,
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          exists: false,
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Error verificando Phone Number ID" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// API para verificar que un registro se guardó correctamente
async function handleVerifyRegistration(
  request: Request,
  env: any
): Promise<Response> {
  try {
    const body = await request.json();
    const { phoneNumberId } = body;

    if (!phoneNumberId) {
      return new Response(
        JSON.stringify({ error: "Phone Number ID requerido" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Verificar en KV que existe y tiene datos completos
    const configString = await env.KV.get(phoneNumberId.toString());

    if (configString) {
      const config = JSON.parse(configString);

      // Verificar que tenga los campos esenciales
      const hasRequiredFields = !!(
        config.studentName &&
        config.phoneNumberId &&
        config.flowiseUrl &&
        config.chatflowId &&
        config.accessToken
      );

      return new Response(
        JSON.stringify({
          exists: true,
          valid: hasRequiredFields,
          studentName: config.studentName,
          registeredAt: config.registeredAt,
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          exists: false,
          valid: false,
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({
        exists: false,
        valid: false,
        error: "Error verificando registro",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// HTML de éxito con diseño moderno estilo GitHub
function getSuccessHTML(config: any): string {
  const webhookUrl = `https://whatsapp-flowise-webhook.fixtergeek.workers.dev/webhook/`;
  const verifyToken = config.webhookVerifyToken || "fixtergeek_2024";

  const customFunctionCode = generateCustomFunctionCode(config);

  return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>¡Registro Exitoso! - WhatsApp Bot</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
    <style>
        .btn-primary {
            background-color: #69c2aa;
            transition: all 0.2s;
        }
        .btn-primary:hover {
            background-color: #5ab096;
        }
        .github-style {
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem 1rem;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        }
        .success-header {
            text-align: center;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #e1e4e8;
        }
        .step-section {
            margin-bottom: 1.5rem;
            padding: 1rem;
            border: 1px solid #e1e4e8;
            border-radius: 8px;
            background: #ffffff;
        }
        .step-title {
            display: flex;
            align-items: center;
            margin-bottom: 0.75rem;
            font-size: 1rem;
            font-weight: 600;
            color: #24292e;
        }
        .step-number {
            background: #69c2aa;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            font-weight: 600;
            margin-right: 0.5rem;
        }
        .copy-section {
            background: #f6f8fa;
            border: 1px solid #e1e4e8;
            border-radius: 6px;
            padding: 0.5rem;
            margin: 0.5rem 0;
        }
        .copy-button {
            background: #69c2aa;
            color: white;
            border: none;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            cursor: pointer;
            margin-left: 0.5rem;
        }
        .copy-button:hover {
            background: #5ab096;
        }
        .code-block {
            background: #f6f8fa;
            border: 1px solid #e1e4e8;
            border-radius: 6px;
            padding: 1rem;
            margin: 0.5rem 0;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
            font-size: 0.875rem;
            overflow-x: auto;
        }
        .footer-actions {
            text-align: center;
            margin-top: 2rem;
            padding-top: 1rem;
            border-top: 1px solid #e1e4e8;
        }
    </style>
</head>
<body style="background-color: #f6f8fa; margin: 0; padding: 0;">
    <div class="github-style">
        <!-- Header estilo GitHub -->
        <div class="success-header">
            <img src="https://www.fixtergeek.com/logo.png" alt="FixterGeek" style="height: 40px; margin-bottom: 1rem;">
            <h1 style="font-size: 1.5rem; font-weight: 600; color: #24292e; margin: 0 0 0.5rem 0;">
                ¡Configuración exitosa! 🎉
            </h1>
            <p style="color: #586069; margin: 0; font-size: 1rem;">
                ${config.studentName}, tu bot de WhatsApp está listo
            </p>
        </div>

        <!-- Pasos en layout vertical moderno -->

            <!-- Paso 1: Configurar Webhook -->
            <div class="bg-white shadow-lg rounded-lg step-card">
                <div class="p-3 flex-shrink-0">
                    <h2 class="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                        <span class="btn-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-2">1</span>
                        📱 Webhook
                    </h2>
                </div>
                <div class="step-content p-3 pt-0">
                    <div class="space-y-2">
                        <p class="text-xs text-gray-600 mb-2">Meta for Developers → WhatsApp → Configuration</p>

                        <div class="bg-gray-50 rounded p-2 mb-2">
                            <label class="block text-xs font-medium text-gray-700 mb-1">URL:</label>
                            <div class="flex">
                                <input type="text" value="${webhookUrl}" readonly class="flex-1 px-1 py-1 bg-white border text-xs rounded-l">
                                <button onclick="copyToClipboard('${webhookUrl}')" class="btn-primary text-white px-2 py-1 rounded-r text-xs">📋</button>
                            </div>
                        </div>

                        <div class="bg-gray-50 rounded p-2 mb-2">
                            <label class="block text-xs font-medium text-gray-700 mb-1">Token:</label>
                            <div class="flex">
                                <input type="text" value="${verifyToken}" readonly class="flex-1 px-1 py-1 bg-white border text-xs rounded-l">
                                <button onclick="copyToClipboard('${verifyToken}')" class="btn-primary text-white px-2 py-1 rounded-r text-xs">📋</button>
                            </div>
                        </div>

                        <div class="bg-yellow-50 border border-yellow-200 rounded p-2">
                            <p class="text-yellow-800 text-xs mb-1 font-medium">Solo activar: ✅ messages</p>
                            <p class="text-red-600 text-xs">Desactivar todo lo demás</p>
                        </div>

                        <div class="mt-2 text-center">
                            <a href="/policies" target="_blank" class="text-xs text-gray-600 hover:text-blue-600 underline">
                                📋 Ver Términos y Condiciones
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Paso 2: Custom Function -->
            <div class="bg-white shadow-lg rounded-lg step-card">
                <div class="p-3 flex-shrink-0">
                    <h2 class="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                        <span class="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mr-2">2</span>
                        💻 Custom Function
                    </h2>
                </div>
                <div class="step-content p-3 pt-0">
                    <p class="text-xs text-gray-600 mb-2">Añadir Custom Function Node en Flowise:</p>

                    <div class="border rounded">
                        <button onclick="toggleCode()" class="w-full flex justify-between items-center p-2 bg-gray-50 hover:bg-gray-100 transition">
                            <span class="text-xs font-medium">📄 Ver código</span>
                            <svg id="chevron" class="w-3 h-3 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                            </svg>
                        </button>
                        <div id="codeContent" class="hidden">
                            <div class="relative">
                                <pre class="bg-gray-900 text-gray-100 p-2 text-xs overflow-x-auto max-h-32 overflow-y-auto"><code>${customFunctionCode}</code></pre>
                                <button onclick="copyCode(event)" class="copy-button absolute top-1 right-1">📋 Copiar</button>
                            </div>
                        </div>
                    </div>
                    <div class="mt-2 bg-green-50 border border-green-200 rounded p-1">
                        <p class="text-green-800 text-xs">✅ Código con tus datos</p>
                    </div>
                </div>
            </div>

        </div>

        <!-- Footer compacto -->
        <div class="flex-shrink-0 text-center mt-2">
            <div class="flex justify-center gap-3">
                <a href="/" class="btn-primary text-white font-medium py-1 px-3 rounded text-xs">← Registrar otro</a>
                <a href="/edit" class="btn-primary text-white font-medium py-1 px-3 rounded text-xs">✏️ Editar configuración</a>
            </div>
        </div>
    </div>

    <script>
        // Confetti celebration on page load
        document.addEventListener('DOMContentLoaded', function() {
            // First confetti burst
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });

            // Second burst after delay
            setTimeout(() => {
                confetti({
                    particleCount: 50,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 }
                });
            }, 300);

            // Third burst
            setTimeout(() => {
                confetti({
                    particleCount: 50,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 }
                });
            }, 600);
        });

        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(function() {
                // Mostrar feedback visual
                const button = event.target;
                const originalText = button.textContent;
                button.textContent = '✅ Copiado!';
                setTimeout(() => {
                    button.textContent = originalText;
                }, 2000);

                // Mini confetti on copy
                confetti({
                    particleCount: 30,
                    spread: 60,
                    origin: { y: 0.8 }
                });
            });
        }

        function copyCode(event) {
            const codeElement = document.querySelector('pre code');
            const codeText = codeElement.textContent;
            const button = event.target;

            navigator.clipboard.writeText(codeText).then(function() {
                const originalText = button.textContent;
                button.textContent = '✅ Copiado!';
                setTimeout(() => {
                    button.textContent = originalText;
                }, 2000);

                confetti({
                    particleCount: 30,
                    spread: 60,
                    origin: { y: 0.8 }
                });
            });
        }

        function toggleCode() {
            const content = document.getElementById('codeContent');
            const chevron = document.getElementById('chevron');

            if (content.classList.contains('hidden')) {
                content.classList.remove('hidden');
                chevron.style.transform = 'rotate(180deg)';
            } else {
                content.classList.add('hidden');
                chevron.style.transform = 'rotate(0deg)';
            }
        }
    </script>
</body>
</html>`;
}

// Generar código Custom Function personalizado
function generateCustomFunctionCode(config: any): string {
  return `/**
 * 🕵️ DETECTIVE CUSTOM FUNCTION - WhatsApp Bot
 * Configurado para: ${config.phoneNumberId}
 */

// 🔐 TUS TOKENS ESPECÍFICOS
const ACCESS_TOKEN = "${config.accessToken}";
const PHONE_NUMBER_ID = "${config.phoneNumberId}";

// 📱 WHATSAPP FUNCTION - ULTRATHINK REFACTORED
const https = require('https');

function makeWhatsAppRequest(phoneNumber, message, accessToken, phoneNumberId) {
  return new Promise((resolve, reject) => {
    // Payload exacto como curl exitoso
    const requestBody = JSON.stringify({
      "messaging_product": "whatsapp",
      "to": phoneNumber,
      "type": "text",
      "text": { "body": message }
    });

    // Options simplificadas
    const options = {
      hostname: 'graph.facebook.com',
      path: \`/v22.0/\${phoneNumberId}/messages\`,
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${accessToken}\`,
        'Content-Type': 'application/json'
        // NO Content-Length - se calcula automático
      }
    };


    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          res.statusCode === 200 ? resolve(parsed) : reject(parsed);
        } catch (e) {
          reject({ error: 'Invalid JSON', body: data });
        }
      });
    });

    req.on('error', err => {
      reject(err);
    });

    req.write(requestBody);
    req.end();
  });
}

// MAIN EXECUTION
try {
  // 1. Validar flow state
  if (!$flow.state.whatsapp_data) {
    return '❌ No whatsapp_data in flow state';
  }

  // 2. Parse data
  const whatsappData = JSON.parse($flow.state.whatsapp_data);
  const message = $flow.state.output || 'Sin respuesta';

  // 3. Validar datos requeridos
  if (!whatsappData.from) {
    return '❌ Missing phone number in whatsapp_data';
  }


  // 4. Enviar a WhatsApp API v22.0
  const response = await makeWhatsAppRequest(
    whatsappData.from,
    message,
    "${config.accessToken}",
    "${config.phoneNumberId}"
  );

  return \`✅ Sent to \${whatsappData.from}: \${message}\`;

} catch (error) {
  return \`❌ Failed: \${JSON.stringify(error)}\`;
}`;
}

// HTML de error
function getErrorHTML(errorMessage: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error - WhatsApp Bot</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .btn-primary {
            background-color: #69c2aa;
            transition: all 0.2s;
        }
        .btn-primary:hover {
            background-color: #5ab096;
        }
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <div class="max-w-2xl mx-auto py-12 px-4">
        <div class="text-center mb-6">
            <img src="https://www.fixtergeek.com/logo.png" alt="FixterGeek" class="h-12 mx-auto mb-3">
        </div>
        <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div class="text-red-600 text-4xl mb-4">❌</div>
            <h1 class="text-xl font-semibold text-red-900 mb-2">Error en el registro</h1>
            <p class="text-red-700 mb-4">${errorMessage}</p>
            <a href="/" class="inline-block bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition">
                ← Volver al formulario
            </a>
        </div>
    </div>
</body>
</html>`;
}

// Manejar webhook de WhatsApp
async function handleWhatsAppWebhook(
  request: Request,
  env: any
): Promise<Response> {
  try {
    const body = await request.json();

    // Validación básica del webhook
    if (!body?.entry || !Array.isArray(body.entry)) {
      return new Response("OK", { status: 200 });
    }

    // Procesar cada entrada del webhook
    for (const entry of body.entry) {
      if (!entry?.changes || !Array.isArray(entry.changes)) {
        continue;
      }

      for (const change of entry.changes) {
        // Solo procesar cambios de mensajes
        if (change.field !== "messages") {
          continue;
        }

        const value = change.value;
        if (!value?.messages || !Array.isArray(value.messages)) {
          continue;
        }

        // 🔍 EXTRACCIÓN DEL PHONE NUMBER ID
        let phoneNumberId: string | null = null;

        // Método 1: Desde metadata (principal)
        if (value.metadata?.phone_number_id) {
          phoneNumberId = value.metadata.phone_number_id.toString().trim();
        }

        // Método 2: Backup desde cambios anteriores en el webhook
        if (!phoneNumberId && value.phone_number_id) {
          phoneNumberId = value.phone_number_id.toString().trim();
        }

        // Método 3: Backup desde entry level
        if (!phoneNumberId && entry.id) {
          // A veces el phone_number_id puede estar implícito en el entry.id
        }

        // ❌ VALIDACIÓN ESTRICTA
        if (
          !phoneNumberId ||
          phoneNumberId === "" ||
          phoneNumberId === "undefined" ||
          phoneNumberId === "null"
        ) {
          continue; // Saltar este mensaje
        }


        // 📋 BÚSQUEDA ROBUSTA EN KV
        let studentConfig: any = null;
        try {
          const studentConfigString = await env.KV.get(phoneNumberId);

          if (!studentConfigString) {
            continue;
          }

          studentConfig = JSON.parse(studentConfigString);
        } catch (kvError) {
          continue;
        }

        // Filtrar mensajes echo (del propio bot)
        const validMessages = value.messages.filter((message: any) => {
          // Filtrar mensajes business_initiated (echo)
          if (value.metadata?.origin?.type === "business_initiated") {
            return false;
          }
          return true;
        });

        if (validMessages.length === 0) {
          continue;
        }

        // Procesar cada mensaje válido
        for (const message of validMessages) {

          // Extraer texto del mensaje de forma robusta
          let messageText = "";
          if (message.text?.body) {
            messageText = message.text.body;
          } else if (message.type === "image") {
            messageText = `[Imagen] ${
              message.image?.caption || "Sin descripción"
            }`;
          } else if (message.type === "audio") {
            messageText = "[Audio recibido]";
          } else if (message.type === "document") {
            messageText = `[Documento] ${
              message.document?.filename || "Sin nombre"
            }`;
          } else {
            messageText = `[Mensaje tipo: ${message.type}]`;
          }

          // 📦 CONTEXTO WHATSAPP PARA PROMPT
          const whatsappContext = {
            // Variables principales del webhook
            whatsapp_from: message.from || "unknown",
            whatsapp_message_id: message.id || "unknown",
            whatsapp_phone_number_id: phoneNumberId,
            whatsapp_message_type: message.type || "text",
            whatsapp_timestamp: message.timestamp || Date.now().toString(),

            // Variables de contacto
            contact_name: value.contacts?.[0]?.profile?.name || "Usuario",
            contact_wa_id: message.from || "unknown",

            // Variables adicionales útiles
            display_phone_number:
              value.metadata?.display_phone_number || phoneNumberId,
            webhook_entry_id: entry.id || "unknown",

            // Info del estudiante
            student_name: studentConfig.studentName,
            student_phone_id: studentConfig.phoneNumberId,
          };

          // 🎯 PROMPT CON CONTEXTO INTEGRADO
          const promptWithContext = `CONTEXTO_WHATSAPP: ${JSON.stringify(
            whatsappContext
          )}

MENSAJE_USUARIO: ${messageText}`;

          // 📦 PAYLOAD SIMPLIFICADO PARA FLOWISE
          const flowisePayload = {
            question: promptWithContext,
          };

          const flowiseUrl = `${studentConfig.flowiseUrl}/api/v1/prediction/${studentConfig.chatflowId}`;

          // 🎯 ENVÍO FIRE-AND-FORGET A FLOWISE
          try {
            const flowiseResponse = await fetch(flowiseUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "User-Agent": "WhatsApp-Webhook-Proxy/1.0",
              },
              body: JSON.stringify(flowisePayload),
            });

            if (!flowiseResponse.ok) {
              const errorText = await flowiseResponse.text();
            } else {
            }
          } catch (fetchError) {
          }

        }
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    return new Response("OK", { status: 200 }); // Siempre retornar 200 para WhatsApp
  }
}
