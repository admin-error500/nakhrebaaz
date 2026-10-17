
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit"],

  outputFileTracingIncludes: {
    "/api/orders/[id]/invoice": [
      "./node_modules/pdfkit/js/standard-fonts/**/*",
      "./node_modules/pdfkit/js/data/**/*",
      "./public/nakhrebaaz-logo.png",
    ],
  },
};

export default nextConfig;
