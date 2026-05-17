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

  try {
    const ep = type === "manga" ? "manga" : "anime";
    const field = type === "manga" ? "chapters" : "episodes";

    // Intentar MangaDex por MAL ID
    const mdxUrl = `https://api.mangadex.org/manga?links%5Bmal%5D=${malId}&limit=5&includes%5B%5D=none&contentRating%5B%5D=safe&contentRating%5B%5D=suggestive&contentRating%5B%5D=erotica&contentRating%5B%5D=pornographic`;
    const mdxRes = await fetch(mdxUrl, { headers: { "Accept": "application/json" } });

    if(mdxRes.ok){
      const mdxData = await mdxRes.json();
      const item = mdxData?.data?.[0];
      if(item){
        const mdxId = item.id;
        const lastChapter = item.attributes?.lastChapter;
        if(lastChapter && lastChapter !== "none" && lastChapter !== ""){
          const n = Math.floor(parseFloat(lastChapter));
          if(n > 0) return { statusCode: 200, headers, body: JSON.stringify({ count: n, source: "mangadex-last" }) };
        }

        // Feed japonés para manga en emisión
        const feedUrl = `https://api.mangadex.org/manga/${mdxId}/feed?translatedLanguage[]=ja&translatedLanguage[]=ja-ro&order[chapter]=desc&limit=10&includes[]=none&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&contentRating[]=pornographic`;
        const feedRes = await fetch(feedUrl, { headers: { "Accept": "application/json" } });
        if(feedRes.ok){
          const feedData = await feedRes.json();
          for(const entry of (feedData?.data || [])){
            const chStr = entry?.attributes?.chapter;
            if(!chStr || chStr === "none") continue;
            const n = parseFloat(chStr);
            if(Number.isFinite(n) && n > 0){
              return { statusCode: 200, headers, body: JSON.stringify({ count: Math.floor(n), source: "mangadex-feed-jp" }) };
            }
          }
        }

        // Feed cualquier idioma como fallback
        const feedAnyUrl = `https://api.mangadex.org/manga/${mdxId}/feed?order[chapter]=desc&limit=10&includes[]=none&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&contentRating[]=pornographic`;
        const feedAnyRes = await fetch(feedAnyUrl, { headers: { "Accept": "application/json" } });
        if(feedAnyRes.ok){
          const feedAnyData = await feedAnyRes.json();
          for(const entry of (feedAnyData?.data || [])){
            const chStr = entry?.attributes?.chapter;
            if(!chStr || chStr === "none") continue;
            const n = parseFloat(chStr);
            if(Number.isFinite(n) && n > 0){
              return { statusCode: 200, headers, body: JSON.stringify({ count: Math.floor(n), source: "mangadex-feed-any" }) };
            }
          }
        }
      }
    }

    // Fallback: Jikan individual
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
