function parseForwardedFor(forwarded) {
  if (!forwarded) {
    return "";
  }
  const match = forwarded.match(/for=(?:"?\[?([^;\],"]+)\]?"?)/i);
  return match?.[1] || "";
}

function normalizeIp(raw) {
  if (!raw) {
    return "";
  }

  let ip = raw.trim();
  if (ip.includes(",")) {
    ip = ip.split(",")[0].trim();
  }

  ip = ip.replace(/^"|"$/g, "");
  if (ip.startsWith("[") && ip.includes("]")) {
    ip = ip.slice(1, ip.indexOf("]"));
  }

  const ipv4WithPort = ip.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);
  if (ipv4WithPort) {
    ip = ipv4WithPort[1];
  }

  const zoneIndex = ip.indexOf("%");
  if (zoneIndex > 0) {
    ip = ip.slice(0, zoneIndex);
  }

  return ip;
}

function isValidIp(ip) {
  if (!ip) {
    return false;
  }
  const isIpv4 = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(ip);
  const isIpv6 = ip.includes(":");
  return isIpv4 || isIpv6;
}

export function extractClientIp(request) {
  const candidateHeaders = [
    request.headers.get("cf-connecting-ip"),
    request.headers.get("cf-connecting-ipv6"),
    request.headers.get("true-client-ip"),
    request.headers.get("x-forwarded-for"),
    request.headers.get("x-real-ip"),
    parseForwardedFor(request.headers.get("forwarded")),
  ];

  for (const candidate of candidateHeaders) {
    const ip = normalizeIp(candidate);
    if (isValidIp(ip)) {
      return ip;
    }
  }

  return "unknown";
}
