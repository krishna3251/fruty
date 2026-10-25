import test from "node:test";
import assert from "node:assert/strict";
import { enquiryEmail, enquiryWhatsApp } from "../src/lib/contact.ts";
import { siteConfig } from "../src/lib/config.ts";
test("contact links encode enquiry drafts without submitting messages", () => {
  const draft = "Pineapple & cucumber: ₹200 each\nPlease confirm delivery.";
  const whatsapp = new URL(enquiryWhatsApp(draft)!);
  assert.equal(whatsapp.origin, "https://wa.me");
  assert.equal(whatsapp.pathname, "/919398152226");
  assert.equal(whatsapp.searchParams.get("text"), draft);
  const email = new URL(enquiryEmail(draft)!);
  assert.equal(email.protocol, "mailto:");
  assert.equal(email.pathname, "tropicalfeast7@gmail.com");
  assert.equal(email.searchParams.get("body"), draft);
  const original = siteConfig.email;
  try {
    siteConfig.email = "bad\r\naddress";
    assert.equal(enquiryEmail(draft), null);
  } finally {
    siteConfig.email = original;
  }
});
