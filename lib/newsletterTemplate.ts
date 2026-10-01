export function renderNewsletterEmail(opts: {
  title: string
  bodyHtml: string
  unsubscribeHref: string
}): string {
  return `<!DOCTYPE html>
<html lang="fr">
  <body style="margin:0;padding:0;background:#f6ecd9;font-family:Georgia,serif;color:#2a2420;">
    <div style="max-width:560px;margin:0 auto;padding:2.5rem 1.5rem;">
      <p style="font-size:0.72rem;letter-spacing:0.14em;text-transform:uppercase;color:#e0218a;margin:0 0 0.6rem;">
        Spill the News
      </p>
      <h1 style="font-size:1.6rem;margin:0 0 1.2rem;color:#2a2420;">${opts.title}</h1>
      <div style="font-size:1rem;line-height:1.6;">${opts.bodyHtml}</div>
      <hr style="margin:2.5rem 0 1rem;border:none;border-top:1px solid #e3d5bb;" />
      <p style="font-size:0.78rem;color:#8a7a5c;">
        Tu reçois cet email car tu es inscrit·e à la newsletter de Spill the News.
        <a href="${opts.unsubscribeHref}" style="color:#e0218a;">Se désabonner</a>
      </p>
    </div>
  </body>
</html>`
}
