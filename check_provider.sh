#!/bin/bash
echo "[*] Polling Microsoft.ContainerRegistry registration status..."
while true; do
    status=$(az provider show -n Microsoft.ContainerRegistry --query registrationState -o tsv 2>/dev/null || echo "Error")
    echo "Current status: $status"
    if [ "$status" = "Registered" ]; then
        echo "[+] Registered!"
        break
    fi
    sleep 15
done
