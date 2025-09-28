# 🤖 WhatsApp Bot Educational Service

<div align="center">

![WhatsApp Bot Multi-Estudiante](https://img.shields.io/badge/WhatsApp-Bot-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)
![Flowise](https://img.shields.io/badge/Flowise-AI%20Agent-1E90FF?style=for-the-badge&logo=flow&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)

**Sistema educativo para que estudiantes experimenten con bots de WhatsApp + Flowise de forma segura.**

*Desarrollado por [@blissito](https://github.com/blissito) 💫*

[![Deploy to Cloudflare Workers](https://img.shields.io/badge/Deploy-Cloudflare%20Workers-F38020?style=flat-square&logo=cloudflare)](https://dash.cloudflare.com)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=flat-square&logo=github)](https://github.com)

</div>

---

## 🎯 ¿Qué hace este sistema?

**Para estudiantes:** Registro ultra-simple para crear bots de WhatsApp experimentales usando Flowise.
**Para profesores:** Un webhook único que maneja múltiples estudiantes automáticamente identificándolos por phone_number_id.

### ⚡ Características Principales:

- **🔗 Webhook Único Global** - Una sola URL `/webhook/` para TODOS los estudiantes
- **🔒 Identificación Automática** - Por phone_number_id en el metadata de WhatsApp
- **📱 Multi-Estudiante** - Un solo worker maneja cientos de estudiantes
- **🎨 Interfaz Moderna** - UI responsive con fines educativos
- **⚡ Fire-and-Forget** - Worker como proxy simple que no espera respuestas
- **🔧 Fácil Setup** - Solo fines educativos, máxima simplicidad

---

## 🏗️ Arquitectura (Worker como Proxy Simple)

```
WhatsApp Usuario → Worker (webhook único) → Flowise (con contexto en prompt) → Custom Function → WhatsApp
```

### Flujo Completo:

1. **Usuario** envía mensaje → **WhatsApp**
2. **WhatsApp** → **Worker** (webhook único `/webhook/`)
3. **Worker** identifica estudiante por `phone_number_id` y reenvía a **Flowise**
4. **Worker NO espera respuesta** - devuelve 200 OK inmediatamente
5. **Flowise** procesa mensaje con agente y ejecuta **Custom Function**
6. **Custom Function** (con tokens hardcodeados) envía respuesta a **WhatsApp**

---

## 🚀 Para Profesores: Configuración Inicial

### 1. Desplegar Worker Centralizado

```bash
# Clonar e instalar
git clone https://github.com/tu-usuario/whatsapp-bot-multi-estudiante
cd WBApi

# Configurar Cloudflare
npm install -g wrangler
wrangler login

# Desplegar
./deploy.sh
```

### 2. Obtener URL del Sistema

Después del despliegue obtienes:
```
🔗 Sistema: https://whatsapp-flowise-webhook.fixtergeek.workers.dev
📊 Health: https://whatsapp-flowise-webhook.fixtergeek.workers.dev/health
```

### 3. Compartir con Estudiantes

Solo envía a tus estudiantes:
- **URL de registro:** `https://tu-worker.workers.dev`
- **Token global:** `fixtergeek_2024` (o que cada uno use su token personalizado)

---

## 👨‍🎓 Para Estudiantes: Configuración Ultra-Simple

### Paso 1: Registrarse (2 minutos)

1. **Ve a:** La URL que te dio tu profesor
2. **Llena el formulario** con:
   - Tu nombre
   - Phone Number ID (de WhatsApp Business)
   - URL de tu Flowise
   - Chatflow ID de tu agente
   - Access Token de WhatsApp
   - **Token personalizado** (opcional - si no, usa el global)

3. **Da click en "Registrar"**
4. **Recibes el webhook ÚNICO GLOBAL:** `/webhook/` (mismo para TODOS)

### Paso 2: Configurar Webhook en WhatsApp (1 minuto)

1. **Ve a:** [developers.facebook.com](https://developers.facebook.com)
2. **Tu app → WhatsApp → Configuration**
3. **Webhook URL:** La URL ÚNICA para TODOS los estudiantes:
   ```
   https://whatsapp-flowise-webhook.fixtergeek.workers.dev/webhook/
   ```
4. **Verify Token:** Tu token personalizado (o el global del profesor)
5. **Subscribe to:** `messages`

### Paso 3: LLM Extractor + Custom Function en Flowise (1 minuto)

1. **En tu Flow** agrega un **LLM Node** para extraer contexto del prompt
2. **Agrega Custom Function Node** después del LLM
3. **Copia y pega** el código personalizado con tus tokens hardcodeados
4. **El contexto WhatsApp** llega automáticamente en el prompt como JSON

### ¡Listo! 🎉

---

## 🔧 Mejoras del Sistema v2

### ✅ Webhook Único Global
- **Simplicidad máxima:** Una sola URL `/webhook/` para TODOS
- **Identificación automática:** Por `phone_number_id` del metadata
- **Zero fricción:** No necesidad de URLs personalizadas

### ✅ Worker como Proxy Simple
- **Fire-and-forget:** Worker NO espera respuestas de Flowise
- **Performance:** Respuesta inmediata 200 OK
- **Flexibilidad:** Custom Function maneja el envío a WhatsApp

### ✅ Contexto en Prompt (LLM Extractor)
- **Sin variables $vars.*:** Contexto integrado en el prompt
- **LLM Extractor:** Nodo LLM parsea automáticamente el contexto
- **Tokens hardcodeados:** En Custom Function personalizado por estudiante

---

## 🧪 Testing y Debugging Mejorado

### Para Profesores:

```bash
# Ver logs del worker en tiempo real
wrangler tail

# Verificar salud del sistema
curl https://tu-worker.workers.dev/health

# Verificar webhook ÚNICO GLOBAL
curl "https://tu-worker.workers.dev/webhook/?hub.mode=subscribe&hub.verify_token=token_global&hub.challenge=test"
```

### Para Estudiantes:

1. **Verificar webhook ÚNICO GLOBAL:**
   ```bash
   curl "https://tu-worker.workers.dev/webhook/?hub.mode=subscribe&hub.verify_token=TU_TOKEN&hub.challenge=test"
   ```
2. **Revisar logs específicos:** Busca tu phoneNumberId en los logs
3. **Editar configuración:** Usa `/edit` para actualizar tu configuración

---

## 📊 Monitoreo por Estudiante

### Logs Específicos:

```bash
# Ver actividad de estudiante específico
wrangler tail --search "123456789"

# Ver errores de verificación
wrangler tail --search "Webhook verification failed"

# Ver procesamiento de mensajes
wrangler tail --search "Processing message.*for student"
```

### Métricas por Estudiante:
- **Mensajes procesados** por phoneNumberId
- **Errores de token** específicos
- **Tiempo de respuesta** por configuración
- **Estado de Flowise** individual

---

## 🔒 Características de Seguridad

### Identificación Automática por Estudiante:
- **Phone Number ID único** identifica automáticamente al estudiante
- **Tokens personalizados opcionales** para seguridad adicional
- **Validación en KV** antes de procesar mensajes
- **Logs específicos** para auditoría por phone_number_id

### Fallbacks Inteligentes:
- Token personalizado → Token global si no existe
- Configuración individual → Configuración base
- Error handling específico por estudiante

---

## 🎨 Interfaz de Usuario Mejorada

### Página de Registro:
- **🎨 Diseño moderno** estilo GitHub
- **📱 Responsive** para móvil y desktop
- **⚡ Validación en tiempo real**
- **🔧 URLs generadas automáticamente**

### Página de Edición:
- **🔐 Autenticación** con phoneNumberId + token
- **📝 Formulario pre-llenado** con datos existentes
- **✅ Validación** de tokens y configuración
- **🔄 Actualización** sin re-entrada de datos

### Página de Políticas:
- **📋 URL copyable** para compartir fácilmente
- **⚖️ Términos claros** de uso educativo
- **🎯 Enfoque educativo** exclusivamente

---

## 📂 Estructura del Proyecto

```
WBApi/
├── cloudflare_worker_students.ts    # Worker principal multi-estudiante
├── student_custom_function.js       # Template de Custom Function
├── wrangler.toml                    # Configuración de Cloudflare
├── deploy.sh                        # Script de despliegue automático
├── new_success_page.html           # Template de página de éxito
├── CLAUDE.md                       # Instrucciones del proyecto
└── README.md                       # Esta documentación
```

---

## 🚨 Troubleshooting v2

### Estudiante: "Webhook verification failed"

```bash
# 1. Verificar en logs qué token esperamos:
wrangler tail --search "tu_phone_number_id"

# 2. Verificar tu configuración:
curl "https://tu-worker.workers.dev/webhook/TU_PHONE_ID?hub.mode=subscribe&hub.verify_token=TU_TOKEN&hub.challenge=test"

# 3. Si devuelve "test" → ✅ Configurado correctamente
# 4. Si devuelve "Forbidden" → ❌ Token incorrecto
```

### Profesor: "No encuentro logs de estudiante"

```bash
# Buscar por phoneNumberId específico:
wrangler tail --search "123456789"

# Ver todos los estudiantes registrados (indirectamente):
wrangler tail --search "Student not found"
```

---

## 💫 Créditos

**Desarrollado con ❤️ por [@blissito](https://github.com/blissito)**

### 🛠️ Tecnologías Utilizadas:
- **Cloudflare Workers** - Serverless compute
- **Cloudflare KV** - Edge storage
- **TypeScript** - Type safety
- **WhatsApp Business API** - Messaging
- **Flowise** - No-code AI workflows

### 🤝 Contribuciones:
Las contribuciones son bienvenidas. Por favor:
1. Fork del repositorio
2. Crear feature branch
3. Commit con mensaje descriptivo
4. Push y crear Pull Request

---

## 📄 Licencia

Este proyecto está bajo licencia MIT. Ver archivo `LICENSE` para más detalles.

---

## 📞 Soporte

### Para Reportar Issues:
- **GitHub Issues:** [Crear nuevo issue](https://github.com/tu-usuario/whatsapp-bot-multi-estudiante/issues)
- **Documentación:** Este README
- **Logs:** Siempre incluir logs al reportar problemas

### Para Contacto Directo:
- **Twitter:** [@blissito](https://twitter.com/blissito)
- **GitHub:** [@blissito](https://github.com/blissito)

---

<div align="center">

**🚀 ¡Tu sistema de WhatsApp Bots para estudiantes está listo!**

[![Deploy Now](https://img.shields.io/badge/Deploy%20Now-Cloudflare%20Workers-F38020?style=for-the-badge&logo=cloudflare)](https://dash.cloudflare.com)

*Made with 💫 by [@blissito](https://github.com/blissito)*

</div>