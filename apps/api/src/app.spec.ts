import { setupTestApp, type TestApp } from '../test/setup-test-app';

describe('AppModule (smoke)', () => {
  let ctx: TestApp;

  beforeAll(async () => {
    ctx = await setupTestApp();
  });

  afterAll(async () => {
    await ctx.close();
  });

  it('boots the Nest application', () => {
    expect(ctx.app).toBeDefined();
  });
});
