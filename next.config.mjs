/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // All photography is local in public/images — nothing hotlinks to a remote
    // CDN. That is what caused the black panels in the earlier build, per
    // design/images/README.md.
    //
    // Serve those files directly, WITHOUT the on-demand optimiser. On a
    // memory- and CPU-starved host (e.g. Render's free tier) the optimiser
    // (sharp) intermittently fails to re-encode the larger heroes — paris.jpg
    // is ~400KB — so the panel renders blank while the small thumbnails scrape
    // through. That is the "photo flashes for an instant then disappears"
    // symptom. The photos are already reasonably sized and the platform serves
    // /public statically, so bypassing the optimiser is the reliable choice.
    unoptimized: true,
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
