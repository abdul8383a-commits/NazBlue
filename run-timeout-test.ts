async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError' || error.name === 'FetchError' || error.message.includes('fetch failed')) {
      throw new Error(`NETWORK_TIMEOUT: ${error.message}`);
    }
    throw error;
  }
}

async function run() {
  console.log("Testing fetchWithTimeout with 10ms timeout on a slow/blackhole endpoint...");
  try {
    await fetchWithTimeout("https://httpbin.org/delay/2", {}, 10);
    console.log("SUCCESS (This should not happen)");
  } catch (err: any) {
    console.log("CAUGHT ERROR:", err.message);
    if (err.message.includes("NETWORK_TIMEOUT")) {
       console.log("Timeout correctly identified!");
    } else {
       console.log("Timeout NOT correctly identified.");
    }
  }
}

run();
