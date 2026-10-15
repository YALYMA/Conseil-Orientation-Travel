"use client";

// Remplace le layout racine en cas d'erreur grave : styles en ligne (la feuille de style n'est pas garantie).
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#F6F8FB", color: "#10233F" }}>
        <main style={{ maxWidth: 520, margin: "0 auto", padding: "80px 16px", textAlign: "center" }}>
          <h1 style={{ fontSize: 24 }}>Le service est momentanément indisponible</h1>
          <p>Veuillez réessayer dans un instant.</p>
          {error.digest && <p style={{ fontSize: 12 }}>Code de référence : {error.digest}</p>}
          <button onClick={reset} style={{ minHeight: 44, padding: "0 20px", border: 0, borderRadius: 8, background: "#0B63F6", color: "#fff", fontWeight: 600, cursor: "pointer" }}>Réessayer</button>
        </main>
      </body>
    </html>
  );
}
