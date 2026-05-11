# ✅ CHECKLIST POC AWS — À FAIRE DANS L'ORDRE

Copiez ce fichier, et **cochezles cases** au fur et à mesure. **Lire avant de commencer!**

---

## 🎯 PRÉ-REQUIS (Déjà Fait)

- [x] Compte AWS créé (ID: 447580526137)
- [x] IAM admin user créé sur le compte
- [x] AWS CLI + SAM CLI installés
- [x] AWS profile `influ-admin` configuré localement
- [x] Repo GitHub créé
- [x] Environnement GitHub `develop` créé
- [x] Template SAM modifié (DynamoDB PROVISIONED) ✅

---

## 🔐 PHASE 1: SECRETS & AUTHENTIFICATION (5 min)

### Local (votre machine)

- [ ] **1.1 Générer JWT secret**
  ```bash
  openssl rand -hex 16
  # Copier la sortie (ex: a3f8c2d9e1b4f6a7c8d9e1f2a3b4c5d6)
  ```
  
  > **Sauvegarder dans un bloc-notes temporaire**

- [ ] **1.2 Créer secret dans AWS Secrets Manager**
  ```bash
  aws secretsmanager create-secret \
    --name influ/dev/jwt \
    --secret-string '{"JWT_SECRET":"YOUR_SECRET_HERE"}' \
    --region eu-west-3 \
    --profile influ-admin
  ```
  
  > **Copier l'ARN retourné** (ressemble à: `arn:aws:secretsmanager:eu-west-3:447580526137:secret:influ/dev/jwt-XXXXX`)
  > **Sauvegarder dans bloc-notes**

---

## 🤖 PHASE 2: OIDC GITHUB (5 min)

### Local

- [ ] **2.1 Exécuter bootstrap-oidc.sh**
  
  D'abord, **trouvez votre GitHub username et repo name**:
  
  ```bash
  # Remplacez les valeurs ci-dessous
  bash scripts/deploy/bootstrap-oidc.sh \
    --owner YOUR_GITHUB_USERNAME \
    --repo YOUR_REPO_NAME \
    --aws-account-id 447580526137 \
    --region eu-west-3
  ```
  
  > **Exemple réel:**
  > ```bash
  > bash scripts/deploy/bootstrap-oidc.sh \
  >   --owner asofynany \
  >   --repo INFLU_V16 \
  >   --aws-account-id 447580526137 \
  >   --region eu-west-3
  > ```
  
- [ ] **2.2 Copier l'ARN du rôle de la sortie**
  
  Vous verrez à la fin:
  ```
  arn:aws:iam::447580526137:role/influ-gha-deploy-dev
  ```
  
  > **Sauvegarder dans bloc-notes**

---

## 🔧 PHASE 3: CONFIGURATION GITHUB (5 min)

### GitHub Web UI

- [ ] **3.1 Ajouter VARIABLES repo** (Settings → Secrets and variables → Actions → Variables tab)
  
  | Nom | Valeur |
  |-----|--------|
  | `AWS_REGION` | `eu-west-3` |
  | `AWS_DEPLOY_ROLE_DEV` | ARN de Phase 2 |
  | `CORS_ALLOWED_ORIGINS_DEV` | `*` |
  | `ALERT_EMAIL` | votre@email.com |
  
  - [ ] Créer `AWS_REGION`
  - [ ] Créer `AWS_DEPLOY_ROLE_DEV` (coller l'ARN du rôle)
  - [ ] Créer `CORS_ALLOWED_ORIGINS_DEV`
  - [ ] Créer `ALERT_EMAIL`

- [ ] **3.2 Ajouter SECRET repo** (Secrets tab)
  
  | Nom | Valeur |
  |-----|--------|
  | `JWT_SECRET_ARN_DEV` | ARN de Phase 1.2 |
  
  - [ ] Créer `JWT_SECRET_ARN_DEV` (coller l'ARN du secret)

---

## 💾 PHASE 4: CODE LOCAL (3 min)

### Local

- [ ] **4.1 Vérifier que les modifications SAM existent**
  ```bash
  cd /Users/asofynany/Desktop/TEST/INFLU_V16
  
  grep -A 3 "BillingMode:" infrastructure/sam/template.yaml
  # Doit montrer: PROVISIONED (pas PAY_PER_REQUEST)
  ```

- [ ] **4.2 Vérifier que bootstrap-oidc.sh existe**
  ```bash
  ls -la scripts/deploy/bootstrap-oidc.sh
  # Doit exister
  ```

- [ ] **4.3 Rendre le script exécutable**
  ```bash
  chmod +x scripts/deploy/bootstrap-oidc.sh
  chmod +x scripts/deploy/package-lambda.sh
  ```

---

## 📤 PHASE 5: GIT PUSH (3 min)

### Local

- [ ] **5.1 Stage tous les changements**
  ```bash
  cd /Users/asofynany/Desktop/TEST/INFLU_V16
  git add -A
  ```

- [ ] **5.2 Vérifier ce qui va être commité**
  ```bash
  git status
  # Doit montrer:
  # - modified: infrastructure/sam/template.yaml
  # - new file: scripts/deploy/bootstrap-oidc.sh
  # - new file: QUICK_START_POC.md
  # - new file: CHECKLIST_POC.md (ce fichier)
  ```

- [ ] **5.3 Commit**
  ```bash
  git commit -m "chore(infra): configure free tier deployment (PROVISIONED DynamoDB, OIDC)"
  ```

- [ ] **5.4 Push vers develop (IMPORTANT: develop, pas main)**
  ```bash
  git push origin develop
  ```

---

## 🚀 PHASE 6: DÉCLENCHER LE DÉPLOIEMENT (2 min)

### GitHub Web UI

- [ ] **6.1 Aller dans Actions**
  ```
  GitHub → Actions tab → "Deploy dev" workflow
  ```

- [ ] **6.2 Cliquer "Run workflow"**
  - Branch: `develop`
  - Cliquer le bouton vert **"Run workflow"**

---

## ⏳ PHASE 7: ATTENDRE LE DÉPLOIEMENT (15 min)

### Monitoring (optionnel mais cool)

- [ ] **7.1 Voir la progression dans GitHub Actions**
  ```
  GitHub → Actions → "Deploy dev" run → Voir les logs
  ```

- [ ] **7.2 Alternative: Voir CloudFormation en direct (AWS CLI)**
  ```bash
  aws cloudformation describe-stacks \
    --stack-name influ-dev \
    --region eu-west-3 \
    --profile influ-admin \
    --query 'Stacks[0].StackStatus'
  
  # Vous verrez:
  # CREATE_IN_PROGRESS (5-10 min)
  # puis CREATE_COMPLETE (succès!)
  ```

- [ ] **7.3 Quand StackStatus = `CREATE_COMPLETE`, passer à Phase 8**

---

## 📋 PHASE 8: RÉCUPÉRER LES URLs (2 min)

### Local

- [ ] **8.1 Obtenir les Outputs CloudFormation**
  ```bash
  aws cloudformation describe-stacks \
    --stack-name influ-dev \
    --region eu-west-3 \
    --profile influ-admin \
    --query 'Stacks[0].Outputs' \
    --output table
  ```

- [ ] **8.2 Copier les URLs**
  ```
  Vous verrez quelque chose comme:
  
  ApiUrl       | https://abc123def456.execute-api.eu-west-3.amazonaws.com/
  WebUrl       | https://d123abc456def.cloudfront.net/
  ```
  
  > **Sauvegarder ces URLs!** Ce sont vos endpoints publics.

---

## ✅ PHASE 9: VÉRIFICATION FINALE (2 min)

### Local + Navigateur

- [ ] **9.1 Tester que l'API répond**
  ```bash
  # Remplacer ABC par votre vrai URL
  curl https://ABC.execute-api.eu-west-3.amazonaws.com/health
  
  # Doit retourner du JSON (même si erreur 401, c'est bon, c'est que l'API répond)
  ```

- [ ] **9.2 Vérifier le mode de facturation DynamoDB (vérification coût)**
  ```bash
  aws dynamodb describe-table \
    --table-name influ_main_dev \
    --region eu-west-3 \
    --profile influ-admin \
    --query 'Table.BillingModeSummary'
  
  # Doit montrer:
  # "BillingMode": "PROVISIONED"
  # ✅ C'est le mode GRATUIT!
  ```

- [ ] **9.3 Tester le frontend dans un navigateur**
  ```
  Ouvrir: https://D123ABC.cloudfront.net/
  
  Doit charger votre app Angular
  (peut prendre 1-2 min si CloudFront cache pas à jour)
  ```

---

## 🎉 PHASE 10: CONFIRMATION DE SUCCÈS

Cochez tout ceci pour confirmer que ça marche:

- [ ] GitHub Actions a exécuté CI/CD avec succès
- [ ] CloudFormation stack = `CREATE_COMPLETE`
- [ ] ApiUrl répond (curl health endpoint)
- [ ] WebUrl charge dans le navigateur
- [ ] DynamoDB mode = PROVISIONED (gratuit)

---

## 💰 CONFIRMATION DE COÛT = 0

```bash
# Vérifiez le mode de facturation final
aws dynamodb describe-table \
  --table-name influ_main_dev \
  --region eu-west-3 \
  --profile influ-admin | grep -i billing

# Doit afficher: "PROVISIONED" ✅ = Gratuit
```

| Service | Coût | Raison |
|---------|------|--------|
| DynamoDB | $0 | PROVISIONED mode + 5 RCU/WCU = gratuit 12 mois |
| Lambda | $0 | 1M invocations gratuites/mois |
| API Gateway | $0 | 1M requêtes gratuites/mois |
| S3 | $0 | 5 GB gratuit, vous utilisez ~50 MB |
| CloudFront | $0 | 1 TB transfert gratuit |
| CloudWatch | $0 | 5 GB logs gratuit |
| **TOTAL** | **$0/mois** | **ou $0.40/mois après 30j** |

---

## 🔄 DÉPLOIEMENTS FUTURS (Auto)

Après cette première fois, **c'est ultra simple**:

```bash
# À chaque fois que vous voulez déployer
cd /Users/asofynany/Desktop/TEST/INFLU_V16

git add -A
git commit -m "feat: your feature here"
git push origin develop

# ✅ GitHub Actions déploie AUTOMATIQUEMENT
# Plus besoin de cliquer sur "Run workflow"!
```

---

## 🐛 TROUBLESHOOTING RAPIDE

| Problème | Solution |
|----------|----------|
| Deploy fail: "JWT_SECRET_ARN_DEV not found" | Allez Phase 3.2: vérifiez que le secret est créé, pas une variable |
| Deploy fail: "AssumeRole failed" | Phase 3.1: comparez l'ARN du rôle dans GitHub avec Phase 2 output |
| Frontend: "Cannot GET /" | Attendez 1-2 min (CloudFront cache), puis refresh le navigateur |
| Lambda: "PROVISIONED_THROUGHPUT_EXCEEDED" | Improbable pour un POC, mais augmentez les RCU/WCU dans le template |

---

## 📝 NOTES

- Une fois Phase 9 complète, **votre app est LIVE sur internet** 🌍
- Les URLs CloudFront/API Gateway sont **gratuites à perpétuité**
- Chaque `git push origin develop` redéploie automatiquement
- Pour arrêter les coûts: `aws cloudformation delete-stack --stack-name influ-dev --region eu-west-3 --profile influ-admin`

---

## ✨ Prêt? Commencez par Phase 1! ✨

