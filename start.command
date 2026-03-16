#!/bin/bash
cd "$(dirname "$0")"
echo "GulfTech AI Sunucusu Başlatılıyor..."
echo "-----------------------------------"
# Python3 kontrolü ve sunucu başlatma
if command -v python3 &>/dev/null; then
    echo "Web sitesi şu adreste açılıyor: http://localhost:3000"
    open "http://localhost:3000"
    python3 -m http.server 3000
else
    echo "Hata: Mac'inizde Python3 bulunamadı."
fi
