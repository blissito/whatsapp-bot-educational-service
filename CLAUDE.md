# WhatsApp Bot Educational Service

Sistema educativo para que estudiantes experimenten con bots de WhatsApp + Flowise de forma segura.

## ✅ Estado Actual
**Worker como PROXY LIMPIO + Custom Function responde** - El worker envía contexto WhatsApp integrado en el prompt a Flowise sin logs de depuración. El Custom Function en Flowise maneja el envío a WhatsApp con tokens hardcodeados.

## 🌐 Worker Principal
**URL ÚNICA:** `whatsapp-flowise-webhook.fixtergeek.workers.dev`
- **IMPORTANTE:** Siempre usar este worker, NO crear workers separados
- **WEBHOOK ÚNICO:** `/webhook/` para TODOS los estudiantes - NO personalizado
- **Identificación automática:** Por `phone_number_id` del metadata de WhatsApp
- **Tokens del KV:** Cada estudiante puede tener token personalizado o usar el global

## 🎯 Principios
- **Máxima simplicidad, cero fricción**
- **Solo Phone Number ID** como identificación única
- **Solo para fines educativos**

## 🏗️ Arquitectura
- **Cloudflare Worker** con KV storage
- **Multi-estudiante**: Cada estudiante registra su propia configuración
- **Autenticación simple**: Phone Number ID únicamente

## 🛠️ Rutas Principales
- `/` - Registro de nuevos bots + enlace a edición
- `/edit` - **Edición profesional** (2 pasos: autenticación → modificación pre-llenada)
- `/policies` - Políticas de uso (URL copyable)
- `/webhook/` - **WEBHOOK ÚNICO GLOBAL** para TODOS los estudiantes

## 📊 Storage (KV)
**Clave**: `phoneNumberId`
**Valor**:
```json
{
  "studentName": "Nombre Estudiante",
  "phoneNumberId": "123456789",
  "flowiseUrl": "https://flowise.com",
  "chatflowId": "uuid-flow",
  "completeFlowiseUrl": "https://flowise.com/api/v1/prediction/uuid-flow",
  "accessToken": "EAAF...",
  "webhookVerifyToken": "token_personalizado", // OPCIONAL - si no existe, usa el global
  "registeredAt": "2024-01-01T00:00:00.000Z",
  "lastTokenUpdate": "2024-01-01T00:00:00.000Z"
}
```

## 🎨 UI/UX
- **Color principal**: #69c2aa (verde turquesa)
- **Sin scroll vertical** en página de éxito (3 columnas)
- **Código colapsado** con botón de copia
- **Logo consistente** en todas las páginas

## 🔧 Deployment
```bash
# Desplegar al worker principal (IMPORTANTE: sin sufijos)
wrangler deploy

# O usar el script (que despliega a diferentes entornos)
./deploy.sh
```

## 🌐 URLs del Sistema
- **Principal:** `https://whatsapp-flowise-webhook.fixtergeek.workers.dev`
- **Health:** `https://whatsapp-flowise-webhook.fixtergeek.workers.dev/health`
- **Webhook ÚNICO:** `https://whatsapp-flowise-webhook.fixtergeek.workers.dev/webhook/`

## 🚨 Validaciones
- **Duplicados**: Avisa si Phone Number ID ya existe
- **Token expirado**: Mensajes claros con enlace a `/edit`
- **URLs Flowise**: Valida formato correcto de prediction endpoint
- **Webhook único global**: Identifica estudiantes por `phone_number_id` automáticamente
- **Autenticación profesional**:
  - Paso 1: Valida Phone Number ID + Webhook Verify Token
  - Paso 2: Pre-llena datos existentes para modificación
- **Seguridad**: Token verificado en ambos pasos (auth + update)

## 📋 Variables de Entorno
- `WEBHOOK_VERIFY_TOKEN` - Token global para verificar webhooks WhatsApp (fallback)
- `KV` - Namespace para almacenamiento

## 🎓 Flujo Estudiante
1. **Nuevo**: Registro en `/` → Recibe webhook ÚNICO `/webhook/` para TODOS
2. **Configurar WhatsApp**: Usar webhook global + token personalizado o global
3. **Identificación**: Sistema identifica automáticamente por `phone_number_id`
4. **Existente**: `/edit` - Flujo profesional de edición:
   - **Paso 1**: Autenticación (Phone Number ID + Webhook Verify Token)
   - **Paso 2**: Modificación pre-llenada de configuración existente
5. **Token expirado**: Error claro → Redirect a `/edit`
6. **Un solo flujo**: Ruta homogenizada `/edit` para todo tipo de cambios

## 🔍 Debugging por Estudiante
```bash
# Ver logs de estudiante específico
wrangler tail --search "123456789"

# Ver verificaciones de webhook
wrangler tail --search "Webhook verified successfully"

# Testear webhook ÚNICO global
curl "https://whatsapp-flowise-webhook.fixtergeek.workers.dev/webhook/?hub.mode=subscribe&hub.verify_token=token_global&hub.challenge=test"
```

---

## 🚨 IMPORTANTE: WEBHOOK ÚNICO GLOBAL

### ❌ NO HACER - Webhooks personalizados:
```
https://worker.dev/webhook/123456789  ❌ MAL
https://worker.dev/webhook/987654321  ❌ MAL
```

### ✅ SÍ HACER - Webhook único para todos:
```
https://whatsapp-flowise-webhook.fixtergeek.workers.dev/webhook/  ✅ CORRECTO
```

### 🔧 Flujo Actualizado (Worker como Proxy + Contexto en Prompt):
1. **Usuario** envía mensaje → **WhatsApp**
2. **WhatsApp** → **Worker** (webhook único `/webhook/`)
3. **Worker** identifica estudiante por `phone_number_id` y construye prompt con contexto
4. **Worker** envía a **Flowise** el contexto WhatsApp **integrado en el prompt**
5. **Worker NO espera respuesta** - devuelve 200 OK inmediatamente
6. **Flowise** procesa con **nodo LLM extractor** que parsea contexto del prompt al flow state
7. **Custom Function** accede a variables del flow state y envía respuesta a **WhatsApp**

### 🎯 Beneficios del Nuevo Flujo:
- **Sin duplicación de respuestas** (eliminado doble envío)
- **Contexto en prompt** - Variables WhatsApp integradas en el mensaje principal
- **Nodo LLM extractor** - Parsea automáticamente el contexto al flow state
- **Worker limpio** - Sin logs de depuración para producción
- **Tokens hardcodeados** en Custom Function personalizado
- **Flexibilidad total** en Flowise para respuestas complejas
- **Términos y condiciones** incluidos en las instrucciones

### 📄 Formato de Payload Actualizado:
**Antes (v1):**
```json
{
  "question": "mensaje del usuario",
  "overrideConfig": {
    "vars": { /* variables WhatsApp */ }
  }
}
```

**Ahora (v2):**
```json
{
  "question": "CONTEXTO_WHATSAPP: {...JSON...}\n\nMENSAJE_USUARIO: mensaje del usuario"
}
```

---

## 🛠️ Custom Function Personalizado

Cada estudiante recibe un **Custom Function con sus tokens hardcodeados**:

```javascript
// ✅ TUS TOKENS ESPECÍFICOS (YA CONFIGURADOS)
const ACCESS_TOKEN = "EAAF..."; // Token real del estudiante
const PHONE_NUMBER_ID = "123456789"; // Phone Number ID real

// Variables extraídas del flow state por el nodo LLM extractor:
// El contexto WhatsApp es parseado automáticamente del prompt al flow state
const phoneNumber = $flow.whatsapp_from;  // Número destino
const contactName = $flow.contact_name;   // Nombre del contacto
const messageId = $flow.whatsapp_message_id; // ID del mensaje original
const phoneNumberId = $flow.whatsapp_phone_number_id; // Phone Number ID
const messageType = $flow.whatsapp_message_type; // Tipo de mensaje
const message = $flow.output;  // Respuesta del agente del flow state
```

### 🔧 Configuración en Flowise:
1. **Crear nodo LLM extractor** - Parsea contexto WhatsApp del prompt al flow state
2. **Crear Custom Function Node** - Usa variables del flow state (`$flow.*`)
3. **Copiar código personalizado** (desde página de éxito)
4. **Conectar pipeline**: Input → LLM Extractor → Agent → Custom Function
5. **¡Listo!** - Variables WhatsApp automáticamente disponibles en `$flow.*`