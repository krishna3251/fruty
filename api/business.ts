import { json, requireOwner } from "../server/admin.js";
import { readJson, customerFailure } from "../server/customerAuth.js";
import { publicSettings, saveSettings, rateLimit } from "../server/commerce.js";
import { businessDefaults } from "../src/lib/business.js";
export async function GET() {
  try {
    return json(await publicSettings());
  } catch {
    return json({ settings: businessDefaults, version: 0, configured: false });
  }
}
export async function POST(request: Request) {
  try {
    const owner = await requireOwner(request);
    await rateLimit(`settings:${owner}`, 30);
    const data = await readJson(request);
    return json(
      data.action === "load"
        ? await publicSettings()
        : await saveSettings(data.settings, data.version),
    );
  } catch (e) {
    return customerFailure(e);
  }
}
