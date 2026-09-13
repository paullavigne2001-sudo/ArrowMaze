#!/data/data/com.termux/files/usr/bin/bash

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
ANDROID_DIR="$PROJECT_DIR/android-twa"
KEYSTORE="$PROJECT_DIR/keystore/arrowmaze-release.jks"
ALIAS="arrowmaze"

UNSIGNED="$ANDROID_DIR/app/build/outputs/apk/release/app-release-unsigned.apk"
ALIGNED="$ANDROID_DIR/app-release-aligned.apk"
FINAL="$ANDROID_DIR/ArrowMaze-1.0.apk"

echo "========================================"
echo "       ArrowMaze — Build APK"
echo "========================================"

echo
echo "[1/7] Vérification du keystore..."
if [ ! -f "$KEYSTORE" ]; then
    echo "ERREUR : keystore introuvable :"
    echo "$KEYSTORE"
    exit 1
fi
echo "OK"

echo
echo "[2/7] Nettoyage..."
cd "$ANDROID_DIR"
gradle clean

echo
echo "[3/7] Compilation..."
gradle assembleRelease

echo
echo "[4/7] Alignement..."
rm -f "$ALIGNED"
zipalign -f -p 4 "$UNSIGNED" "$ALIGNED"

echo
echo "[5/7] Signature..."
rm -f "$FINAL"
apksigner sign \
    --ks "$KEYSTORE" \
    --ks-key-alias "$ALIAS" \
    --out "$FINAL" \
    "$ALIGNED"

echo
echo "[6/7] Vérification de la signature..."
apksigner verify --verbose --print-certs "$FINAL"

echo
echo "[7/7] Nettoyage des fichiers intermédiaires..."
rm -f "$ALIGNED"

echo
echo "========================================"
echo "          BUILD TERMINÉ"
echo "========================================"
echo
echo "APK :"
echo "$FINAL"
echo
ls -lh "$FINAL"
