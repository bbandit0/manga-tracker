// netlify/functions/mangadex.js
// Proxy server-side para MangaDex + AniList + Jikan sin restricciones CORS.
// Deploy: colocar en /netlify/functions/mangadex.js en la raiz del proyecto.
// Netlify lo expone automaticamente en /.netlify/functions/mangadex

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  const { malId, title, type } = event.queryStringParameters || {};
  if (!malId) return { statusCode: 400, headers, body: JSON.stringify({ error: "malId required" }) };

  const isAnime = type === "anime";

  try {
    let count = 0;

    // ── MANGA en emision: MangaDex es la fuente correcta ─────────────────────
    if (!isAnime) {
      // Paso 1: buscar UUID de MangaDex via links[mal]
      let mdxId = null;
      try {
        const searchUrl = `https://api.mangadex.org/manga?links%5Bmal%5D=${encodeURIComponent(String(malId))}&limit=5&includes%5B%5D=none&contentRating%5B%5D=safe&contentRating%5B%5D=suggestive&contentRating%5B%5D=erotica&contentRating%5B%5D=pornographic`;
        const r = await fetch(searchUrl, { headers: { Accept: "application/json" } });
        if (r.ok) {
          const items = (await r.json())?.data || [];
          if (items.length) {
            const it = items[0];
            // Si el manga esta finalizado, lastChapter es suficiente
            const lc = it.attributes?.lastChapter;
            if (lc && lc !== "none" && lc !== "" && lc !== null && lc !== "null") {
              const n = Math.floor(parseFloat(lc));
              if (n > 0) count = Math.max(count, n);
            }
            mdxId = it.id;
          }
        }
      } catch (_) {}

      // Paso 2: si no se resolvio por lastChapter, obtener ultimo capitulo del feed JP
      if (!count && mdxId) {
        try {
          // Feed japones: el mas confiable para raws del manga original
          const feedUrl = `https://api.mangadex.org/manga/${mdxId}/feed?translatedLanguage[]=ja&translatedLanguage[]=ja-ro&order[chapter]=desc&limit=10&includes[]=none&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&contentRating[]=pornographic`;
          const rf = await fetch(feedUrl, { headers: { Accept: "application/json" } });
          if (rf.ok) {
            const data = (await rf.json())?.data || [];
            for (const entry of data) {
              const chStr = entry?.attributes?.chapter;
              if (!chStr || chStr === "none" || chStr === "") continue;
              const n = parseFloat(chStr);
              if (Number.isFinite(n) && n > 0) { count = Math.max(count, Math.floor(n)); break; }
            }
          }
        } catch (_) {}
      }

      // Paso 3: aggregate como segunda opcion (todos los idiomas, numero maximo)
      if (!count && mdxId) {
        try {
          const aggUrl = `https://api.mangadex.org/manga/${mdxId}/aggregate`;
          const ra = await fetch(aggUrl, { headers: { Accept: "application/json" } });
          if (ra.ok) {
            const vols = (await ra.json())?.volumes || {};
            let max = 0;
            for (const vol of Object.values(vols)) {
              for (const k of Object.keys(vol?.chapters || {})) {
                if (k === "none" || k === "" || k === "null") continue;
                const n = parseFloat(k);
                if (!isNaN(n) && n > max) max = n;
              }
            }
            if (max > 0) count = Math.max(count, Math.floor(max));
          }
        } catch (_) {}
      }

      // Paso 4: feed en cualquier idioma (scanlations en espanol/ingles)
      if (!count && mdxId) {
        try {
          const feedAnyUrl = `https://api.mangadex.org/manga/${mdxId}/feed?order[chapter]=desc&limit=10&includes[]=none&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&contentRating[]=pornographic`;
          const rfa = await fetch(feedAnyUrl, { headers: { Accept: "application/json" } });
          if (rfa.ok) {
            const data = (await rfa.json())?.data || [];
            for (const entry of data) {
              const chStr = entry?.attributes?.chapter;
              if (!chStr || chStr === "none" || chStr === "") continue;
              const n = parseFloat(chStr);
              if (Number.isFinite(n) && n > 0) { count = Math.max(count, Math.floor(n)); break; }
            }
          }
        } catch (_) {}
      }

      // Paso 5: busqueda por titulo si links[mal] no encontro nada
      if (!count && title) {
        try {
          const q = encodeURIComponent(title.slice(0, 80));
          const searchUrl2 = `https://api.mangadex.org/manga?title=${q}&limit=5&includes[]=none&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&contentRating[]=pornographic&order[relevance]=desc`;
          const rs = await fetch(searchUrl2, { headers: { Accept: "application/json" } });
          if (rs.ok) {
            const items = (await rs.json())?.data || [];
            for (const it of items) {
              const lc = it.attributes?.lastChapter;
              if (lc && lc !== "none" && lc !== "" && lc !== null) {
                const n = Math.floor(parseFloat(lc));
                if (n > 0) { count = Math.max(count, n); break; }
              }
            }
          }
        } catch (_) {}
      }
    }

    // ── ANIME en emision: AniList nextAiringEpisode es la fuente correcta ────
    if (isAnime) {
      try {
        const query = `{Media(idMal:${Number(malId)},type:ANIME){episodes status nextAiringEpisode{episode}}}`;
        const ral = await fetch("https://graphql.anilist.co", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ query })
        });
        if (ral.ok) {
          const media = (await ral.json())?.data?.Media;
          if (media?.nextAiringEpisode?.episode > 0) count = media.nextAiringEpisode.episode - 1;
          else if (media?.episodes > 0) count = media.episodes;
        }
      } catch (_) {}
    }

    return { statusCode: 200, headers, body: JSON.stringify({ count }) };
  } catch (e) {
    return { statusCode: 200, headers, body: JSON.stringify({ count: 0 }) };
  }
};
