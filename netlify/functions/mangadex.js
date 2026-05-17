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

  // ── AniList GraphQL ──────────────────────────────────────────────────────────
  async function srcAniList(id){
    try{
      const mediaType = type === "manga" ? "MANGA" : "ANIME";
      const fields = type === "manga"
        ? "chapters volumes status"
        : "episodes status nextAiringEpisode{episode}";
      const query = `{Media(idMal:${id},type:${mediaType}){${fields}}}`;
      const res = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: {"Content-Type":"application/json","Accept":"application/json"},
        body: JSON.stringify({query})
      });
      if(!res.ok) return 0;
      const json = await res.json();
      const media = json?.data?.Media;
      if(!media) return 0;
      if(type === "manga"){
        if(media.chapters > 0) return media.chapters;
        if(media.volumes > 0) return media.volumes * 8;
        return 0;
      }
      if(media.nextAiringEpisode?.episode > 0) return media.nextAiringEpisode.episode - 1;
      return media.episodes || 0;
    }catch(e){ return 0; }
  }

  // ── MangaDex helpers ─────────────────────────────────────────────────────────
  async function getFeedCount(mdxId){
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

  async function processItem(item){
    const mdxId = item.id;
    const lastChapter = item.attributes?.lastChapter;
    if(lastChapter && lastChapter !== "none" && lastChapter !== "" && lastChapter !== null){
      const n = Math.floor(parseFloat(lastChapter));
      if(n > 0) return { count: n, source: "mangadex-last" };
    }
    const feedCount = await getFeedCount(mdxId);
    if(feedCount > 0) return { count: feedCount, source: "mangadex-feed" };
    return null;
  }

  try {
    // ── Intento 1: MangaDex por MAL ID ──
    const byMalRes = await fetch(
      `https://api.mangadex.org/manga?links[mal]=${malId}&limit=5&includes[]=none&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&contentRating[]=pornographic`,
      { headers: { "Accept": "application/json" } }
    );
    if(byMalRes.ok){
      const items = (await byMalRes.json())?.data || [];
      for(const item of items){
        const result = await processItem(item);
        if(result) return { statusCode: 200, headers, body: JSON.stringify(result) };
      }
    }

    // ── Intento 2: MangaDex por título ──
    if(title){
      const byTitleRes = await fetch(
        `https://api.mangadex.org/manga?title=${encodeURIComponent(title)}&limit=5&includes[]=none&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&contentRating[]=pornographic&order[relevance]=desc`,
        { headers: { "Accept": "application/json" } }
      );
      if(byTitleRes.ok){
        const items = (await byTitleRes.json())?.data || [];
        for(const item of items){
          const itemMalId = item.attributes?.links?.mal;
          const titleMatch = (item.attributes?.title?.en || "").toLowerCase().includes(title.toLowerCase().slice(0,8));
          if(String(itemMalId) === String(malId) || titleMatch){
            const result = await processItem(item);
            if(result) return { statusCode: 200, headers, body: JSON.stringify(result) };
          }
        }
        if(items.length > 0){
          const result = await processItem(items[0]);
          if(result) return { statusCode: 200, headers, body: JSON.stringify(result) };
        }
      }
    }

    // ── Intento 3: AniList ──
    const alCount = await srcAniList(malId);
    if(alCount > 0){
      return { statusCode: 200, headers, body: JSON.stringify({ count: alCount, source: "anilist" }) };
    }

    // ── Intento 4: Jikan como último recurso ──
    const jikanRes = await fetch(`https://api.jikan.moe/v4/${ep}/${malId}`);
    if(jikanRes.ok){
      const jikanData = await jikanRes.json();
      const cnt = jikanData?.data?.[field] || 0;
      if(cnt > 0) return { statusCode: 200, headers, body: JSON.stringify({ count: cnt, source: "jikan" }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ count: 0, source: "none" }) };

  } catch(e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
