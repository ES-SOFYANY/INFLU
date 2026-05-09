---
name: final-verification-protocol
description: Protocole standard d'auto-vérification finale appliqué par les agents avant de conclure une mission. Définit la structure des checks, la correction directe des écarts détectés et le format du verdict final PASS/FAIL. À charger pour tout agent qui doit auto-valider ses livrables.
user-invocable: false
---

# Étape de vérification finale — Protocole standard

Avant de conclure une mission et de retourner la main, tout agent doit effectuer une **passe de vérification finale** suivant ce protocole.

## Structure attendue de la vérification

1. **Lister les checks spécifiques à l'agent** — Chaque agent définit sa liste numérotée de vérifications selon ses livrables (ex : couverture US, tests qui passent, contrat respecté, conformité wireframes, etc.).

2. **Pour CHAQUE check** :
   - ✅ Vérifier l'état réel (lire les fichiers produits, exécuter les scripts/tests, comparer avec la source de vérité)
   - ❌ Si écart détecté → **corriger directement** sans attendre (rester dans le même cycle)
   - ⚠️ Si correction impossible (blocage technique, manque d'info) → documenter dans `docs/00-questions-log.md` et signaler l'écart

3. **Verdict final** :
   - Si **tous les checks passent** → indiquer **`✅ Vérification finale : PASS`** dans le résumé de sortie
   - Sinon → lister les corrections appliquées + tout écart résiduel non résolu

## Règles dures du protocole

- ❌ **Ne pas conclure** tant qu'un check n'est pas passé OU explicitement documenté comme bloquant
- ❌ **Ne pas masquer** un problème en modifiant un test, en désactivant un check, ou en ignorant une incohérence
- ✅ **Corriger directement** dans le même cycle (sans incrémenter de compteur d'itérations s'il en existe un)
- ✅ **Tracer toute correction** dans le livrable concerné (notes, log, commentaire)
- ✅ **Le verdict est binaire** : PASS ou liste de blocages — pas de « partiellement OK »
