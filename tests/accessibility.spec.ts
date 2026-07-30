import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const routes = ['/zh/', '/zh/benchmarks/', '/zh/blog/', '/zh/timeline/', '/zh/bench/code-qa-bench/'];

for (const route of routes) {
	test(`has no automatic accessibility violations: ${route}`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
		const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
		expect(results.violations).toEqual([]);
	});

	test(`exposes a single main landmark and page heading: ${route}`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
		await expect(page.locator('main')).toHaveCount(1);
		await expect(page.locator('h1')).toHaveCount(1);
	});
}

test('keyboard users can skip navigation and operate the theme toggle', async ({ page }) => {
    await page.goto('/zh/', { waitUntil: 'domcontentloaded' });
	await page.keyboard.press('Tab');
	const skipLink = page.getByRole('link', { name: '跳到主要内容' });
	await expect(skipLink).toBeFocused();
	await page.keyboard.press('Enter');
	await expect(page.locator('main')).toBeFocused();

	const themeToggle = page.getByRole('button', { name: '切换到暗色模式' });
	await themeToggle.focus();
	await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('article images expose meaningful text alternatives and keyboard names', async ({ page }) => {
  await page.goto('/zh/opinions/t2i-multi-module-evaluation/', { waitUntil: 'domcontentloaded' });
  const images = page.locator('.article-body img');
  await expect(images).toHaveCount(1);
  await expect(images).toHaveAttribute('alt', '评估系统整体流程');
  await expect(images).toHaveAttribute('role', 'button');
  await expect(images).toHaveAttribute('aria-label', '查看大图: 评估系统整体流程');
});
