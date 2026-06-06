#!/bin/bash
# ─── SomaSync Azure Container Apps Deployment Script ──────────────────────────
# Manual step-by-step deployment pipeline.
# Builds the Docker image locally via Docker daemon and pushes it to ACR.
# Hosts it on Azure Container Apps with a secure HTTPS endpoint.

set -e

# Configuration
RG_NAME="somasync-backend-swiss-rg"
LOCATION="switzerlandnorth"
APP_NAME="somasync-backend"
SOURCE_DIR="./backend"

echo "================================================================"
echo "🚀 Starting SomaSync FastAPI Backend Deployment to Azure..."
echo "================================================================"

# Load credentials and environment variables from local .env
ENV_FILE="$SOURCE_DIR/.env"
if [ -f "$ENV_FILE" ]; then
    echo "[*] Loading environment variables from $ENV_FILE..."
    while IFS= read -r line || [ -n "$line" ]; do
        if [[ ! "$line" =~ ^# ]] && [[ ! -z "$line" ]]; then
            key=$(echo "$line" | cut -d '=' -f 1 | xargs)
            value=$(echo "$line" | cut -d '=' -f 2- | xargs)
            export "$key=$value"
        fi
    done < "$ENV_FILE"
    echo "[+] Environment variables loaded successfully."
else
    echo "[!] Warning: $ENV_FILE not found! Script will attempt to use variables from current shell."
fi

# Ensure critical variables are set
if [ -z "$GEMINI_API_KEY" ]; then
    echo "[X] Error: GEMINI_API_KEY is not defined. Please set it in your environment or in $ENV_FILE."
    exit 1
fi

# 1. Register Required Azure Resource Providers
echo "[*] Step 1: Registering resource providers..."
az provider register --namespace Microsoft.App --wait
az provider register --namespace Microsoft.OperationalInsights --wait
az provider register --namespace Microsoft.ContainerRegistry --wait

# Ensure Swiss North Resource Group exists
echo "[*] Ensuring resource group $RG_NAME exists in $LOCATION..."
az group create --name "$RG_NAME" --location "$LOCATION"

# 2. Find or Create Azure Container Registry
ACR_NAME=$(az acr list -g "$RG_NAME" --query "[0].name" -o tsv 2>/dev/null || echo "")
if [ -z "$ACR_NAME" ]; then
    ACR_NAME="somasyncacr$(date +%s)"
    echo "[*] Step 2: Creating Azure Container Registry '$ACR_NAME'..."
    az acr create \
      --resource-group "$RG_NAME" \
      --name "$ACR_NAME" \
      --location "$LOCATION" \
      --sku Basic \
      --admin-enabled true
else
    echo "[+] Found existing Azure Container Registry '$ACR_NAME'. Reusing it."
fi

# 3. Log Docker in and build/push locally
echo "[*] Step 3: Logging local Docker daemon into ACR '$ACR_NAME'..."
az acr login --name "$ACR_NAME"

echo "[*] Building Docker image locally..."
docker build -t "$ACR_NAME.azurecr.io/$APP_NAME:latest" "$SOURCE_DIR"

echo "[*] Pushing Docker image to ACR..."
docker push "$ACR_NAME.azurecr.io/$APP_NAME:latest"

# 4. Fetch ACR Admin Credentials
echo "[*] Fetching ACR Admin Credentials..."
ACR_USER=$(az acr credential show -n "$ACR_NAME" -g "$RG_NAME" --query username -o tsv)
ACR_PASS=$(az acr credential show -n "$ACR_NAME" -g "$RG_NAME" --query passwords[0].value -o tsv)

# 5. Create or Update Container App Environment
echo "[*] Step 5: Ensuring Container App Environment 'somasync-backend-env' exists..."
# Since environment list already confirmed it exists, we can use it directly

# 6. Deploy Container App
echo "[*] Step 6: Creating Container App '$APP_NAME'..."
az containerapp create \
  --resource-group "$RG_NAME" \
  --name "$APP_NAME" \
  --environment "somasync-backend-env" \
  --image "$ACR_NAME.azurecr.io/$APP_NAME:latest" \
  --target-port 8000 \
  --ingress external \
  --registry-server "$ACR_NAME.azurecr.io" \
  --registry-username "$ACR_USER" \
  --registry-password "$ACR_PASS" \
  --env-vars \
    PORT=8000 \
    ENVIRONMENT=production \
    GEMINI_API_KEY="$GEMINI_API_KEY" \
    AZURE_DOC_INTELLIGENCE_ENDPOINT="$AZURE_DOC_INTELLIGENCE_ENDPOINT" \
    AZURE_DOC_INTELLIGENCE_KEY="$AZURE_DOC_INTELLIGENCE_KEY" \
    MOODLE_BASE_URL="$MOODLE_BASE_URL" \
    MOODLE_WS_TOKEN="$MOODLE_WS_TOKEN" \
    MOODLE_USER_ID="$MOODLE_USER_ID"

echo "================================================================"
echo "🎉 SomaSync FastAPI Backend successfully deployed on Azure Container Apps!"
echo "================================================================"
# Print the FQDN URL
FQDN=$(az containerapp show -g "$RG_NAME" -n "$APP_NAME" --query properties.configuration.ingress.fqdn -o tsv)
echo "Secure HTTPS FQDN URL: https://$FQDN"
echo "================================================================"
