import { describe, expect, it } from "vitest";
import { navItemsForRole } from "@/lib/navigation";

describe("navItemsForRole", () => {
  it("gives OWNER access to every module", () => {
    const items = navItemsForRole("OWNER");
    expect(items.map((item) => item.href)).toEqual(
      expect.arrayContaining([
        "/dashboard",
        "/pdv",
        "/operacoes",
        "/reservas",
        "/produtos",
        "/estoque",
        "/producao",
        "/clientes",
        "/financeiro",
        "/relatorios",
        "/usuarios",
      ]),
    );
  });

  it("restricts SALES to sales-related modules", () => {
    const hrefs = navItemsForRole("SALES").map((item) => item.href);
    expect(hrefs).toContain("/pdv");
    expect(hrefs).toContain("/reservas");
    expect(hrefs).toContain("/clientes");
    expect(hrefs).not.toContain("/financeiro");
    expect(hrefs).not.toContain("/estoque");
    expect(hrefs).not.toContain("/usuarios");
  });

  it("restricts PRODUCTION to production-related modules", () => {
    const hrefs = navItemsForRole("PRODUCTION").map((item) => item.href);
    expect(hrefs).toContain("/estoque");
    expect(hrefs).toContain("/producao");
    expect(hrefs).toContain("/produtos");
    expect(hrefs).not.toContain("/pdv");
    expect(hrefs).not.toContain("/financeiro");
  });

  it("restricts FINANCE to financial modules and reports", () => {
    const hrefs = navItemsForRole("FINANCE").map((item) => item.href);
    expect(hrefs).toContain("/financeiro");
    expect(hrefs).toContain("/relatorios");
    expect(hrefs).not.toContain("/pdv");
    expect(hrefs).not.toContain("/estoque");
  });

  it("every role can see the dashboard", () => {
    const roles = ["OWNER", "MANAGER", "SALES", "PRODUCTION", "FINANCE"] as const;
    for (const role of roles) {
      expect(navItemsForRole(role).map((item) => item.href)).toContain("/dashboard");
    }
  });
});
