const cloudFrontDomain = import.meta.env.VITE_AWS_CLOUDFRONT_DOMAIN || "";

// The AWS docs placeholder (d12345abcdefgh.cloudfront.net) is not a real
// distribution. Treat it as unconfigured so uploaded files fall back to their
// raw S3 URL instead of a broken CloudFront host.
const isPlaceholderDomain = cloudFrontDomain.includes("d12345abcdefgh.cloudfront.net");

/**
 * Transforms a raw S3 object URL (or S3 key) into a CloudFront CDN URL.
 *
 * @param urlOrKey The original S3 URL (e.g. https://my-bucket.s3.region.amazonaws.com/path/to/video.mp4) or just the object key (path/to/video.mp4).
 * @returns The CloudFront CDN URL (e.g. https://d12345abcdefgh.cloudfront.net/path/to/video.mp4)
 */
export function getCloudFrontUrl(urlOrKey: string): string {
  if (!urlOrKey) return "";

  if (!cloudFrontDomain || isPlaceholderDomain) {
    // Fallback: If CloudFront domain is not configured (or is the docs
    // placeholder), just return the original URL
    return urlOrKey;
  }

  try {
    // If it's a full URL
    if (urlOrKey.startsWith("http")) {
      const url = new URL(urlOrKey);

      // Check if it's an S3 URL
      if (url.hostname.includes("amazonaws.com")) {
        const pathname = url.pathname.startsWith("/") ? url.pathname : `/${url.pathname}`;
        // Construct new URL using CloudFront domain
        return `${cloudFrontDomain.replace(/\/$/, "")}${pathname}`;
      }

      // If it's some other URL, return as is
      return urlOrKey;
    }

    // If it's just an S3 key (e.g., videos/lesson1.mp4)
    const normalizedKey = urlOrKey.startsWith("/") ? urlOrKey : `/${urlOrKey}`;
    return `${cloudFrontDomain.replace(/\/$/, "")}${normalizedKey}`;
  } catch (err) {
    console.error("Error transforming URL for CloudFront:", err);
    return urlOrKey; // Return original on error
  }
}
