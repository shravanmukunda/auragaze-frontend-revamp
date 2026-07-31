import type { MetadataRoute } from "next";
import { appOrigin } from "@/lib/mail";

export default function robots(): MetadataRoute.Robots {
  const origin = appOrigin();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/checkout", "/cart", "/profile", "/orders"],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
