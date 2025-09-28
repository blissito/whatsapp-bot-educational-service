#!/bin/bash

# Script para desplegar WhatsApp-Flowise Worker a Cloudflare
# Uso: ./deploy.sh [dev|production]

set -e

ENV=${1:-dev}
echo "🚀 Desplegando WhatsApp-Flowise Worker en entorno: $ENV"

# Verificar que wrangler esté instalado
if ! command -v wrangler &> /dev/null; then
    echo "❌ Error: wrangler no está instalado"
    echo "Instálalo con: npm install -g wrangler"
    exit 1
fi

# Verificar que esté autenticado
if ! wrangler whoami &> /dev/null; then
    echo "❌ Error: No estás autenticado en Cloudflare"
    echo "Ejecuta: wrangler login"
    exit 1
fi

echo "✅ Wrangler configurado correctamente"

# Verificar que el archivo wrangler.toml existe
if [ ! -f "wrangler.toml" ]; then
    echo "❌ Error: No se encontró wrangler.toml"
    echo "Asegúrate de estar en el directorio correcto"
    exit 1
fi

# Verificar KV Namespace
echo "📦 Verificando KV Namespace..."
KV_ID=$(grep 'id = "REPLACE_WITH_YOUR_KV_ID"' wrangler.toml || true)
if [ ! -z "$KV_ID" ]; then
    echo "⚠️  KV Namespace no configurado. Creando..."

    # Crear KV namespace
    echo "Creando KV namespace 'webhook-storage'..."
    KV_CREATE_OUTPUT=$(wrangler kv:namespace create "webhook-storage")
    NEW_KV_ID=$(echo "$KV_CREATE_OUTPUT" | grep -o '"id": "[^"]*"' | cut -d'"' -f4)

    if [ ! -z "$NEW_KV_ID" ]; then
        echo "✅ KV Namespace creado: $NEW_KV_ID"

        # Actualizar wrangler.toml
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/REPLACE_WITH_YOUR_KV_ID/$NEW_KV_ID/" wrangler.toml
        else
            # Linux
            sed -i "s/REPLACE_WITH_YOUR_KV_ID/$NEW_KV_ID/" wrangler.toml
        fi

        echo "✅ wrangler.toml actualizado con el KV ID"
    else
        echo "❌ Error creando KV namespace"
        exit 1
    fi
else
    echo "✅ KV Namespace ya configurado"
fi

# Verificar variables de entorno
echo "🔍 Verificando configuración..."

# Verificar variables en wrangler.toml
FLOWISE_URL=$(grep 'FLOWISE_API_URL = ' wrangler.toml | head -1)
CHATFLOW_ID=$(grep 'CHATFLOW_ID = ' wrangler.toml | head -1)
WEBHOOK_TOKEN=$(grep 'WEBHOOK_VERIFY_TOKEN = ' wrangler.toml | head -1)

if [[ "$FLOWISE_URL" == *"tu-flowise.tudominio.com"* ]]; then
    echo "⚠️  ADVERTENCIA: FLOWISE_API_URL no configurada en wrangler.toml"
fi

if [[ "$CHATFLOW_ID" == *"uuid-de-tu-chatflow"* ]]; then
    echo "⚠️  ADVERTENCIA: CHATFLOW_ID no configurado en wrangler.toml"
fi

if [[ "$WEBHOOK_TOKEN" == *"mi_token_super_secreto_123"* ]]; then
    echo "⚠️  ADVERTENCIA: WEBHOOK_VERIFY_TOKEN no configurado en wrangler.toml"
fi

# Preguntar si continuar con advertencias
if [[ "$FLOWISE_URL" == *"tu-flowise.tudominio.com"* ]] || [[ "$CHATFLOW_ID" == *"uuid-de-tu-chatflow"* ]]; then
    read -p "⚠️  Hay variables sin configurar. ¿Continuar? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Despliegue cancelado. Configura las variables en wrangler.toml"
        exit 1
    fi
fi

# Desplegar SIEMPRE al endpoint principal
echo "🚀 Desplegando worker..."
echo "📦 Desplegando al endpoint PRINCIPAL (whatsapp-flowise-webhook)..."
wrangler deploy

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ¡Despliegue exitoso!"
    echo ""
    echo "🔗 URLs del worker:"

    # SIEMPRE usar el endpoint principal
    WORKER_NAME="whatsapp-flowise-webhook"

    echo "   Webhook: https://$WORKER_NAME.fixtergeek.workers.dev/webhook/"
    echo "   Health:  https://$WORKER_NAME.fixtergeek.workers.dev/health"
    echo ""
    echo "📋 Próximos pasos:"
    echo "1. Configura el webhook en Meta for Developers"
    echo "2. Usa la URL del webhook mostrada arriba"
    echo "3. Prueba enviando un mensaje a tu número de WhatsApp"
    echo ""
    echo "🔧 Para ver logs en vivo:"
    echo "   wrangler tail"
    echo ""
else
    echo "❌ Error en el despliegue"
    exit 1
fi