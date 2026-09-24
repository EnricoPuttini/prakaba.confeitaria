import { describe, expect, it } from "vitest";
import { loginSchema, signUpSchema } from "@/lib/validations/auth";

describe("loginSchema", () => {
  it("accepts a valid email and non-empty password", () => {
    const result = loginSchema.safeParse({ email: "dona@prakaba.com", password: "123456" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "123456" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ email: "dona@prakaba.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("signUpSchema", () => {
  const valid = {
    organizationName: "Prakabá",
    fullName: "Dona Prakabá",
    email: "dona@prakaba.com",
    password: "senha-forte-123",
  };

  it("accepts a fully valid payload", () => {
    expect(signUpSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = signUpSchema.safeParse({ ...valid, password: "1234567" });
    expect(result.success).toBe(false);
  });

  it("rejects a blank organization name", () => {
    const result = signUpSchema.safeParse({ ...valid, organizationName: " " });
    expect(result.success).toBe(false);
  });

  it("rejects a blank full name", () => {
    const result = signUpSchema.safeParse({ ...valid, fullName: "" });
    expect(result.success).toBe(false);
  });
});
