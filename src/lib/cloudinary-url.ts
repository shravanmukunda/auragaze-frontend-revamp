/** Inject f_auto,q_auto (+ optional width) into Cloudinary delivery URLs. */
export function optimizeCloudinaryUrl(
  url: string,
  options?: { width?: number },
): string {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }

  const afterUpload = url.split("/upload/")[1] ?? "";
  const firstSegment = afterUpload.split("/")[0] ?? "";
  const alreadyTransformed =
    firstSegment.includes(",") ||
    /^(f_|q_|w_|h_|c_|e_|dpr_)/.test(firstSegment);

  if (alreadyTransformed) {
    return url;
  }

  const transforms = ["f_auto", "q_auto"];
  if (options?.width && options.width > 0) {
    transforms.push(`w_${Math.round(options.width)}`, "c_limit");
  }

  return url.replace("/upload/", `/upload/${transforms.join(",")}/`);
}
