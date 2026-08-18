# ONYX FIT v0.1 — Installation

## Pour tester sur PC
1. Installe Node.js LTS.
2. Télécharge ou clone le dépôt.
3. Ouvre un terminal dans le dossier.
4. Lance `npm install`.
5. Lance `npm run dev`.
6. Ouvre l’adresse affichée par Vite.

## Pour tester sur iPhone sur le même Wi‑Fi
1. Sur le PC, lance `npm run dev -- --host`.
2. Ouvre l’adresse réseau affichée par Vite dans Safari sur l’iPhone.
3. Si Windows le demande, autorise Node.js sur le réseau privé.

## Prévu pour les prochaines versions
- Supabase : comptes et synchronisation.
- OpenAI côté serveur : recettes/programmes IA.
- Capacitor/Xcode : vraie app iPhone.
- HealthKit : pas, activité, poids, masse grasse.

## Sécurité
- Ne jamais mettre une clé OpenAI dans le frontend.
- Ne jamais mettre une clé Supabase `service_role` dans le frontend.
