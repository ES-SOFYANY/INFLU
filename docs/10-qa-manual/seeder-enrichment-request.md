# Seeder Enrichment Request — Iteration 1

The following observations are not bugs in the application code but gaps or
inconsistencies in `docs/05-database/seed-data.json` that produced empty / cosmetic
issues during the manual QA tour. Routing these to **Database Seeder** for the next
seed iteration.

| Page / Surface | Persona | Symptom | Suspected Seed Gap | Suggested Action |
|----------------|---------|---------|--------------------|------------------|
| `/creator/marketplace/:id` for product `11111111-aaaa-4aaa-aaaa-000000000004` | nano | "Total compensation: 0", "Deliverables: empty" | Product has no `MarketplaceDeliverable` rows in seed | Add 2-3 deliverables (post / story / reel) with realistic compensation per tier |
| `/creator/marketplace` cards | all creators | Some cards display title pattern "<Product> for " (empty tier suffix) | Some products have empty `tier` or template renders empty when tier is null | Either (a) populate `tier` for all marketplace products in seed, or (b) confirm the i18n template should hide " for " when tier is empty (FE concern, not seed) |
| `/creator/collaborations` | nano | Empty list | nano has 0 collaborations (only marketplace applications) | Add 2-3 `Collaboration` rows linking nano to seeded brands |
| `/creator/messaging` | all | Empty | No `Conversation` / `Message` rows in seed | Add a few seeded conversations between brands ↔ creators |
| `/business/crm` | yassir | Empty | No CRM contact rows in seed for the brand | Add seeded CRM rows per brand |
| `/business/messaging` | yassir | Empty | No conversations | Same as creator messaging |
| `/business/dashboard` | yassir | Greeting shows "Khadija Ouazzani" instead of expected Yassir name | `BUSINESS#…` row's `fullName` may be wrong, or the dashboard pulls from the wrong user record | Verify `fullName` field for `marketing@yassir.com` vs the `Khadija Ouazzani` user — possibly two seeded users share the same business org |
| `/admin/*` | admin | Page is a placeholder shell only | Not a seed issue — admin UI is unimplemented (Story Implementer scope) | Track as a separate US for admin UI implementation |

## Notes

After enrichment, please re-run `npm run db:seed -- --force` and re-verify with
`scripts/smoke-seed-login.sh` plus a Seed Login Verifier round before re-handing
to QA Manual for iteration 2.
