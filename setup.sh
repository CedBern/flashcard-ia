#!/bin/bash

# FLE Flashcards - Script d'installation
echo "================================================"
echo "   FLE Flashcards - Installation              "
echo "================================================"

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez installer Node.js depuis https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé."
    exit 1
fi

echo "✅ npm version: $(npm -v)"

# Installer les dépendances
echo ""
echo "📦 Installation des dépendances..."
npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Installation terminée avec succès !"
    echo ""
    echo "Pour lancer l'application :"
    echo "  npm start"
    echo ""
    echo "Pour créer une version de production :"
    echo "  npm run build"
else
    echo ""
    echo "❌ Erreur lors de l'installation des dépendances"
    exit 1
fi
