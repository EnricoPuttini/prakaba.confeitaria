import { test, expect } from "@playwright/test";

test("unauthenticated user is redirected to /login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
});

test("login page renders the PRAKABÁ brand and form fields", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText("PRAKABÁ", { exact: true })).toBeVisible();
  await expect(page.getByLabel("E-mail")).toBeVisible();
  await expect(page.getByLabel("Senha")).toBeVisible();
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
});

test("login with invalid credentials shows an error", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill("naoexiste@prakaba.com");
  await page.getByLabel("Senha").fill("senha-incorreta");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("E-mail ou senha incorretos")).toBeVisible();
});

test("navigating to signup shows the account creation form", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("link", { name: "Criar confeitaria" }).click();
  await expect(page).toHaveURL(/\/signup/);
  await expect(page.getByLabel("Nome da confeitaria")).toBeVisible();
});
