# PLAYBET V4 — Première construction backend

Cette version conserve l'interface du prototype et ajoute un backend Node.js sans dépendance externe.

## Lancer
1. Installer Node.js 18+.
2. Dans ce dossier : `npm start`
3. Ouvrir `http://localhost:3000`

## Déjà connecté au serveur
- inscription / connexion
- bonus de bienvenue : 10 000 PX ; les 4 premiers inscrits reçoivent 30 000 PX à la place
- portefeuille PX serveur
- bonus quotidien 2 000 PX, une fois par jour et par compte
- création d'un défi privé
- réservation de la mise
- acceptation par un autre compte
- pot du match
- code privé unique
- statut OPEN → READY → LIVE
- historique de transactions serveur

## Stockage
La première version utilise `data.json` comme stockage local du serveur. C'est volontairement une étape de développement. Avant mise en production, il faudra migrer vers une vraie base de données, ajouter une authentification renforcée, validation serveur complète, protections anti-fraude et journalisation robuste.

Les PX restent virtuels dans cette version : aucun dépôt/retrait réel n'est activé.
