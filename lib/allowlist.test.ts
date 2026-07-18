import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { limit, where, from, select, getDb } = vi.hoisted(() => {
  const limit = vi.fn();
  const where = vi.fn(() => ({ limit }));
  const from = vi.fn(() => ({ where }));
  const select = vi.fn(() => ({ from }));
  const getDb = vi.fn(() => ({ select }));
  return { limit, where, from, select, getDb };
});

vi.mock("@/lib/db", () => ({ getDb }));

describe("isEmailAllowlisted", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete process.env.ELIGIBILITY_SKIP_ALLOWLIST;
  });

  afterEach(() => {
    delete process.env.ELIGIBILITY_SKIP_ALLOWLIST;
  });

  it("returns true when ELIGIBILITY_SKIP_ALLOWLIST is true", async () => {
    process.env.ELIGIBILITY_SKIP_ALLOWLIST = "true";
    const { isEmailAllowlisted } = await import("@/lib/allowlist");
    await expect(isEmailAllowlisted(null)).resolves.toBe(true);
    expect(getDb).not.toHaveBeenCalled();
  });

  it("returns false for a missing email", async () => {
    const { isEmailAllowlisted } = await import("@/lib/allowlist");
    await expect(isEmailAllowlisted(null)).resolves.toBe(false);
    await expect(isEmailAllowlisted("")).resolves.toBe(false);
    expect(getDb).not.toHaveBeenCalled();
  });

  it("normalizes email and returns true when a row exists", async () => {
    limit.mockResolvedValueOnce([{ id: "citizen-1" }]);
    const { isEmailAllowlisted } = await import("@/lib/allowlist");

    await expect(
      isEmailAllowlisted("  Voter@Example.COM "),
    ).resolves.toBe(true);

    expect(getDb).toHaveBeenCalledOnce();
    expect(select).toHaveBeenCalledOnce();
  });

  it("returns false when no allowlist row matches", async () => {
    limit.mockResolvedValueOnce([]);
    const { isEmailAllowlisted } = await import("@/lib/allowlist");

    await expect(isEmailAllowlisted("missing@example.com")).resolves.toBe(
      false,
    );
  });
});
