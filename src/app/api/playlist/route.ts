import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const listId = searchParams.get("listId") || "PLaF3yTH5TI68";

  try {
    const url = `https://www.youtube.com/playlist?list=${listId}&hl=en`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch YouTube page: ${res.status}` },
        { status: 500 }
      );
    }

    const html = await res.text();
    const match = html.match(/ytInitialData\s*=\s*({.*?});/);

    if (!match) {
      return NextResponse.json(
        { error: "Could not extract ytInitialData from YouTube page" },
        { status: 500 }
      );
    }

    const data = JSON.parse(match[1]);
    const tracks = extractTracksRecursively(data);

    if (tracks.length === 0) {
      // Try a secondary check for search occurrences
      const videoIds = Array.from(html.matchAll(/"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"/g)).map(m => m[1]);
      const uniqueVideoIds = Array.from(new Set(videoIds));
      if (uniqueVideoIds.length > 0) {
        // Fallback simple playlist structure if initialData format differed
        uniqueVideoIds.slice(0, 50).forEach((vid, i) => {
          tracks.push({
            videoId: vid,
            title: `Track #${i + 1}`,
            artist: "YouTube Video",
            art: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
          });
        });
      }
    }

    return NextResponse.json({ playlist: tracks });
  } catch (error: any) {
    console.error("API Playlist parser error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function extractTracksRecursively(obj: any): any[] {
  const tracks: any[] = [];
  const seenVids = new Set<string>();

  function traverse(node: any) {
    if (!node) return;

    if (typeof node === "object") {
      // 1. Check if it's a playlistVideoRenderer
      if (node.playlistVideoRenderer) {
        const pvr = node.playlistVideoRenderer;
        const videoId = pvr.videoId;
        if (videoId && !seenVids.has(videoId)) {
          seenVids.add(videoId);
          
          let title = "Unknown Title";
          if (pvr.title) {
            title = pvr.title.simpleText || 
                    pvr.title.runs?.map((r: any) => r.text).join("") || 
                    "Unknown Title";
          }
          
          let artist = "Unknown Creator";
          if (pvr.shortBylineText) {
            artist = pvr.shortBylineText.runs?.map((r: any) => r.text).join("") || 
                     "Unknown Creator";
          }
          
          tracks.push({
            videoId,
            title,
            artist,
            art: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          });
        }
      }
      
      // 2. Check if it's a lockupViewModel (modern layout)
      if (node.lockupViewModel) {
        const lvm = node.lockupViewModel;
        const watchEndpoint = lvm.rendererContext?.commandContext?.onTap?.innertubeCommand?.watchEndpoint;
        const videoId = watchEndpoint?.videoId;
        
        if (videoId && !seenVids.has(videoId)) {
          seenVids.add(videoId);
          
          const metadata = lvm.metadata?.lockupMetadataViewModel;
          const title = metadata?.title?.content || "Unknown Title";
          
          let artist = "Unknown Creator";
          try {
            const rows = metadata?.metadata?.contentMetadataViewModel?.metadataRows;
            if (rows && rows.length > 0) {
              const parts = rows[0]?.metadataParts;
              if (parts && parts.length > 0) {
                artist = parts[0]?.text?.content || "Unknown Creator";
              }
            }
          } catch (e) {}

          tracks.push({
            videoId,
            title,
            artist,
            art: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          });
        }
      }

      // 3. Check if it's a videoRenderer
      if (node.videoRenderer) {
        const vr = node.videoRenderer;
        const videoId = vr.videoId;
        if (videoId && !seenVids.has(videoId)) {
          seenVids.add(videoId);
          
          let title = "Unknown Title";
          if (vr.title) {
            title = vr.title.simpleText || 
                    vr.title.runs?.map((r: any) => r.text).join("") || 
                    "Unknown Title";
          }
          
          let artist = "Unknown Creator";
          if (vr.ownerText || vr.shortBylineText) {
            const byline = vr.ownerText || vr.shortBylineText;
            artist = byline.runs?.map((r: any) => r.text).join("") || 
                     "Unknown Creator";
          }
          
          tracks.push({
            videoId,
            title,
            artist,
            art: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          });
        }
      }

      // Traverse children keys
      for (const key in node) {
        if (Object.prototype.hasOwnProperty.call(node, key)) {
          traverse(node[key]);
        }
      }
    } else if (Array.isArray(node)) {
      for (const item of node) {
        traverse(item);
      }
    }
  }

  traverse(obj);
  return tracks;
}
