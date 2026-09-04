(() => {
  const ANALYTICS_URL = "/analytics.json";

  function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  function loadScript(src, attributes) {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    if (attributes) {
      for (const [key, value] of Object.entries(attributes)) {
        script.setAttribute(key, value);
      }
    }
    document.head.appendChild(script);
    return script;
  }

  function enablePostHog(key, host) {
    const script = loadScript("https://us-assets.i.posthog.com/static/array.js");
    script.addEventListener("load", () => {
      if (typeof window.posthog?.init !== "function") {
        return;
      }
      const apiHost = isNonEmptyString(host) ? host.trim() : "https://us.i.posthog.com";
      window.posthog.init(key.trim(), {
        api_host: apiHost,
        autocapture: false,
        capture_pageview: true,
        disable_session_recording: true,
        persistence: "memory",
      });
    });
  }

  function enablePlausible(domain) {
    loadScript("https://plausible.io/js/script.js", {
      defer: "true",
      "data-domain": domain.trim(),
    });
  }

  function enableGa4(measurementId) {
    const id = measurementId.trim();
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`);
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;
    gtag("js", new Date());
    gtag("config", id, { anonymize_ip: true });
  }

  async function start() {
    let config;
    try {
      const response = await fetch(ANALYTICS_URL, { credentials: "same-origin" });
      if (!response.ok) {
        return;
      }
      config = await response.json();
    } catch {
      return;
    }
    if (!config || typeof config !== "object") {
      return;
    }
    if (isNonEmptyString(config.posthogKey)) {
      enablePostHog(config.posthogKey, config.posthogHost);
      return;
    }
    if (isNonEmptyString(config.plausibleDomain)) {
      enablePlausible(config.plausibleDomain);
      return;
    }
    if (isNonEmptyString(config.ga4MeasurementId)) {
      enableGa4(config.ga4MeasurementId);
    }
  }

  void start();
})();
