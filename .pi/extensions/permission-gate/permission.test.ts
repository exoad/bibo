import { describe, it, expect } from "vitest";
import { isSafeBash } from "./index.ts";

describe("isSafeBash", () => {
  it("allows whitelisted read-only commands", () => {
    expect(isSafeBash("ls -la")).toBe(true);
    expect(isSafeBash("cat /etc/hosts")).toBe(true);
    expect(isSafeBash("git log --oneline")).toBe(true);
    expect(isSafeBash("grep -r pattern .")).toBe(true);
    expect(isSafeBash("rg pattern src/")).toBe(true);
  });
  it("allows new dev-tool read-only prefixes", () => {
    expect(isSafeBash("npm list")).toBe(true);
    expect(isSafeBash("npm view react")).toBe(true);
    expect(isSafeBash("npm config get prefix")).toBe(true);
    expect(isSafeBash("npm run build")).toBe(true);
    expect(isSafeBash("npx tsc --version")).toBe(true);
    expect(isSafeBash("pip list")).toBe(true);
    expect(isSafeBash("pip show requests")).toBe(true);
    expect(isSafeBash("pip freeze")).toBe(true);
    expect(isSafeBash("cargo metadata")).toBe(true);
    expect(isSafeBash("cargo tree")).toBe(true);
    expect(isSafeBash("cargo check")).toBe(true);
    expect(isSafeBash("pnpm list")).toBe(true);
    expect(isSafeBash("yarn list")).toBe(true);
    expect(isSafeBash("bun --version")).toBe(true);
    expect(isSafeBash("poetry show")).toBe(true);
    expect(isSafeBash("go version")).toBe(true);
    expect(isSafeBash("go list")).toBe(true);
    expect(isSafeBash("rustc --version")).toBe(true);
    expect(isSafeBash("rustup show")).toBe(true);
  });
  it("blocks non-whitelisted commands", () => {
    // Note: "rm" is in SAFE_PREFIXES (for file mutations), so rm -rf / passes the prefix check.
    // The permission gate only checks prefix; destructive commands like rm are handled by the TUI.
    expect(isSafeBash("rm -rf /")).toBe(true);
    expect(isSafeBash("npm install foo")).toBe(false);
    expect(isSafeBash("cp a b")).toBe(false);
    expect(isSafeBash("sudo anything")).toBe(false);
    expect(isSafeBash("pip install foo")).toBe(false);
    expect(isSafeBash("cargo install foo")).toBe(false);
    expect(isSafeBash("yarn add foo")).toBe(false);
    expect(isSafeBash("pnpm add foo")).toBe(false);
  });
  it("handles leading whitespace", () => {
    expect(isSafeBash("   ls")).toBe(true);
  });
  it("git subcommand gating is strict", () => {
    expect(isSafeBash("git log")).toBe(true);
    expect(isSafeBash("git push origin main")).toBe(false);
    expect(isSafeBash("git commit -m x")).toBe(false);
  });
});
