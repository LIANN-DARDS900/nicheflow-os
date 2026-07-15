const rawUrl = process.env.PRODUCTION_URL;

if (!rawUrl) {
  console.error("PRODUCTION_URL is required.");
  process.exit(1);
}

const baseUrl = rawUrl.replace(/\/$/, "");
const healthUrl = `${baseUrl}/api/health`;

try {
  const response = await fetch(healthUrl, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`Health endpoint returned HTTP ${response.status}.`);
  }

  const payload = await response.json();
  if (payload.status !== "ready" || payload.mode !== "live") {
    throw new Error(`Deployment is not live-ready: ${JSON.stringify(payload)}`);
  }

  console.log(`NicheFlow OS production is ready: ${healthUrl}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
