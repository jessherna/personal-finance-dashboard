import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { generateResetToken, isValidPassword } from "../lib/utils/auth"

describe("auth utils", () => {
  it("generates a random reset token of expected length", () => {
    const token = generateResetToken()
    assert.strictEqual(typeof token, "string")
    assert.strictEqual(token.length, 64) // 32 bytes => 64 hex chars

    // ensure multiple calls differ
    const token2 = generateResetToken()
    assert.notStrictEqual(token2, token)
  })

  it("validates password length", () => {
    assert.ok(isValidPassword("123456"))
    assert.ok(isValidPassword("   123456   "))
    assert.ok(!isValidPassword("short"))
    assert.ok(!isValidPassword(""))
  })
})

