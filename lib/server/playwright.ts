export async function launchChromiumBrowser() {
  const isServerlessRuntime = Boolean(
    process.env.VERCEL || process.env.AWS_REGION || process.env.LAMBDA_TASK_ROOT
  );

  if (isServerlessRuntime) {
    const [{ chromium }, chromiumModule] = await Promise.all([
      import("playwright-core"),
      import("@sparticuz/chromium"),
    ]);

    const serverlessChromium = chromiumModule.default;

    return chromium.launch({
      args: serverlessChromium.args,
      executablePath: await serverlessChromium.executablePath(),
      headless: true,
    });
  }

  const playwright = await import("playwright");
  return playwright.chromium.launch({
    headless: true,
  });
}
