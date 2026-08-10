/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // All photography is local in public/images — nothing hotlinks to a remote
    // CDN. That is what caused the black panels in the earlier build, per
    // design/images/README.md.
    //
    // WebP only, deliberately. AVIF encoding is an order of magnitude slower
    // and the optimiser serialises it, which stalled the ~40 sidebar tiles on
    // this page for tens of seconds. The saving on a 96px tile does not come
    // close to paying for that.
    formats: ['image/webp'],
  },
  experimental: {
    /**
     * pdfkit reads its font-metric (.afm) files from disk at runtime. Webpack
     * bundles the JS but not those data files, so a bundled pdfkit throws
     * ENOENT on Helvetica.afm the first time a document is rendered.
     */
    serverComponentsExternalPackages: ['pdfkit', 'nodemailer'],
  },
};

export default nextConfig;
