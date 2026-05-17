exports.handler = async function(event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if(event.httpMethod === "OPTIONS"){
    return { statusCode: 200, headers, body: "" };
  }

  const params = event.queryStringParameters || {};
  const malId = params.malId;
  const title = params.title || "";
  const type = params.type || "manga";

  if(!malId){
    return { statusCode: 400, headers, body: JSON.stringify({error: "malId required"}) };
  }

  const ep = type === "manga" ? "manga" : "anime";
  const field = type === "manga" ? "chapters" : "episodes";

  // Helper: obtener el capítulo más alto desde el feed de un manga en MangaDex
  async function getFeedCount(mdxId){
    // Feed japonés primero (más preciso para manga original)
    const feedJP = await fetch(
      `https://api.mangadex.org/manga/${mdxId}/feed?translatedLanguage[]=ja&translatedLanguage[]=ja-ro&order[chapter]=desc&limit=10&includes[]=none&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&contentRating[]=pornographic`,
      { headers: { "Accept": "application/json" } }
    );
    if(feedJP.ok){
      const data = (await feedJP.json())?.data || [];
      for(const entry of data){
        const chStr = entry?.attributes?.chapter;
        if(!chStr || chStr === "none" || chStr === "") continue;
        const n = parseFloat(chStr);
        if(Number.isFinite(n) && n > 0) return Math.floor(n);
      }
    }
    // Feed cualquier idioma como fallback
    const feedAny = await fetch(
      `https://api.mangadex.org/manga/${mdxId}/feed?order[chapter]=desc&limit=10&includes[]=none&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&contentRating[]=pornographic`,
      { headers: { "Accept": "application/json" } }
    );
    if(feedAny.ok){
      const data = (await feedAny.json())?.data || [];
      for(const entry of data){
        const chStr = entry?.attributes?.chapter;
        if(!chStr || chStr === "none" || chStr === "") continue;
        const n = parseFloat(chStr);
        if(Number.isFinite(n) && n > 0) return Math.floor(n);
      }
    }
    return 0;
  }

  // Helper: procesar un item de MangaDex y retornar el conteo
  async function processItem(item){
    const mdxId = item.id;
    const lastChapter = item.attributes?.lastChapter;
    // Si tiene lastChapter definido (manga finalizado), usarlo directamente
    if(lastChapter && lastChapter !== "none" && lastChapter !== "" && lastChapter !== null){
      const n = Math.floor(parseFloat(lastChapter));
      if(n > 0) return { count: n, source: "mangadex-last" };
    }
    // Para manga en emisión: usar el feed
    const feedCount = await getFeedCount(mdxId);
    if(feedCount > 0) return { count: feedCount, source: "mangadex-feed" };
    return null;
  }

  try {
    // ── Intento 1: buscar por MAL ID en links de MangaDex ──
    const byMalUrl = `https://api.mangadex.org/manga?links[mal]=${malId}&limit=5&includes[]=none&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&contentRating[]=pornographic`;
    const byMalRes = await fetch(byMalUrl, { headers: { "Accept": "application/json" } });
    if(byMalRes.ok){
      const byMalData = await byMalRes.json();
      const items = byMalData?.data || [];
      for(const item of items){
        const result = await processItem(item);
        if(result) return { statusCode: 200, headers, body: JSON.stringify(result) };
      }
    }

    // ── Intento 2: buscar por título en MangaDex ──
    if(title){
      const byTitleUrl = `https://api.mangadex.org/manga?title=${encodeURIComponent(title)}&limit=5&includes[]=none&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&contentRating[]=pornographic&order[relevance]=desc`;
      const byTitleRes = await fetch(byTitleUrl, { headers: { "Accept": "application/json" } });
      if(byTitleRes.ok){
        const byTitleData = await byTitleRes.json();
        const items = byTitleData?.data || [];
        for(const item of items){
          // Verificar que el link MAL coincide o que el título es similar
          const itemMalId = item.attributes?.links?.mal;
          const titleMatch = (item.attributes?.title?.en || "").toLowerCase().includes(title.toLowerCase().slice(0,8));
          if(String(itemMalId) === String(malId) || titleMatch){
            const result = await processItem(item);
            if(result) return { statusCode: 200, headers, body: JSON.stringify(result) };
          }
        }
        // Si no hay coincidencia exacta, intentar con el primer resultado
        if(items.length > 0){
          const result = await processItem(items[0]);
          if(result) return { statusCode: 200, headers, body: JSON.stringify(result) };
        }
      }
    }

    // ── Intento 3: Jikan individual como último recurso ──
    const jikanRes = await fetch(`https://api.jikan.moe/v4/${ep}/${malId}`);
    if(jikanRes.ok){
      const jikanData = await jikanRes.json();
      const cnt = jikanData?.data?.[field] || 0;
      if(cnt > 0) return { statusCode: 200, headers, body: JSON.stringify({ count: cnt, source: "jikan" }) };
      // Para manga en emisión, intentar paginado
      if(type === "manga"){
        const pagedRes = await fetch(`https://api.jikan.moe/v4/manga/${malId}/chapters?page=1`);
        if(pagedRes.ok){
          const pagedData = await pagedRes.json();
          const total = pagedData?.pagination?.items?.total || 0;
          const lastPage = pagedData?.pagination?.last_visible_page || 1;
          if(total > 0) return { statusCode: 200, headers, body: JSON.stringify({ count: total, source: "jikan-paged" }) };
          if(lastPage > 1){
            const lastRes = await fetch(`https://api.jikan.moe/v4/manga/${malId}/chapters?page=${lastPage}`);
            if(lastRes.ok){
              const lastData = await lastRes.json();
              const lastEntry = lastData?.data?.[lastData.data.length - 1];
              const chStr = lastEntry?.chapter || lastEntry?.title || "";
              const n = parseFloat(String(chStr).match(/\d+/)?.[0] || "0");
              if(n > 0) return { statusCode: 200, headers, body: JSON.stringify({ count: Math.floor(n), source: "jikan-paged-last" }) };
            }
          }
        }
      }
    }

    return { statusCode: 200, headers, body: JSON.stringify({ count: 0, source: "none" }) };

  } catch(e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
