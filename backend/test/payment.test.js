const test = require("node:test");
const assert = require("node:assert/strict");
const { resolveClientBaseUrl, isKhaltiCompletedStatus } = require("../src/services/payment/khalti");

test("resolveClientBaseUrl prefers CLIENT_URL over FRONTEND_URL", () => {
  const result = resolveClientBaseUrl({
    CLIENT_URL: "https://app.example.com",
    FRONTEND_URL: "http://localhost:5173",
  });

  assert.equal(result, "https://app.example.com");
});

test("isKhaltiCompletedStatus recognizes completed payment states", () => {
  assert.equal(isKhaltiCompletedStatus("Completed"), true);
  assert.equal(isKhaltiCompletedStatus("completed"), true);
  assert.equal(isKhaltiCompletedStatus("Pending"), false);
  assert.equal(isKhaltiCompletedStatus("Initiated"), false);
});
