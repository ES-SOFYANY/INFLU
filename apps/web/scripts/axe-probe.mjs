import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const TARGETS = [
  { url: 'http://localhost:4200/creator/accounts', user: 'lina.beauty@example.ma' },
  { url: 'http://localhost:4200/business/accounts', user: 'marketing@yassir.com' },
  { url: 'http://localhost:4200/admin', user: 'admin@influ.ai' },
];

const browser = await chromium.launch();
for (const t of TARGETS) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const r = await page.request.post('http://localhost:3000/api/v1/auth/login', {
    data: { email: t.user, password: 'Test1234!' },
  });
  const s = await r.json();
  await page.addInitScript((s) => {
    localStorage.setItem('influ.accessToken', s.tokens.accessToken);
    localStorage.setItem('influ.refreshToken', s.tokens.refreshToken);
    localStorage.setItem(
      'influ.user',
      JSON.stringify({ id: s.user.id, email: s.user.email, role: s.user.role, displayName: s.user.fullName ?? s.user.email }),
    );
  }, s);
  await page.goto(t.url);
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const cc = results.violations.filter((v) => v.id === 'color-contrast');
  console.log(`\n=== ${t.url} : ${cc.reduce((a,v)=>a+v.nodes.length,0)} nodes ===`);
  for (const v of cc) {
    for (const n of v.nodes) {
      console.log('  TARGET:', n.target.join(' >> '));
      console.log('  HTML  :', n.html.slice(0, 280));
      console.log('  MSG   :', n.failureSummary?.replace(/\n/g, ' | '));
      console.log('  ---');
    }
  }
  await ctx.close();
}
await browser.close();
