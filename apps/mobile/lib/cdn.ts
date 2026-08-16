const cloudFrontDomain = process.env.EXPO_PUBLIC_AWS_CLOUDFRONT_DOMAIN || "";

const isPlaceholderDomain = cloudFrontDomain.includes("d12345abcdefgh.cloudfront.net");

export function getCloudFrontUrl(urlOrKey: string): string {
  if (!urlOrKey) return "";

  if (!cloudFrontDomain || isPlaceholderDomain) {
    return urlOrKey;
  }

  try {
    if (urlOrKey.startsWith("http")) {
      const url = new URL(urlOrKey);
      if (url.hostname.includes("amazonaws.com")) {
        const pathname = url.pathname.startsWith("/") ? url.pathname : `/${url.pathname}`;
        return `${cloudFrontDomain.replace(/\/$/, "")}${pathname}`;
      }
      return urlOrKey;
    }

    const normalizedKey = urlOrKey.startsWith("/") ? urlOrKey : `/${urlOrKey}`;
    return `${cloudFrontDomain.replace(/\/$/, "")}${normalizedKey}`;
  } catch (err) {
    console.error("Error transforming URL for CloudFront:", err);
    return urlOrKey;
  }
}

export function getYouTubeVideoId(url: string) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) return match[2];
  return null;
}
