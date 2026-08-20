import { NextResponse } from 'next/server';
import NodeID3 from 'node-id3';

export const runtime = 'nodejs';
export const maxDuration = 60;

const decodeHtml = (str) => {
    if (!str) return '';
    return str
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#39;/g, "'");
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    try {
        // 1. Fetch Song Details
        const res = await fetch(`https://zylaes-saavn.vercel.app/api/songs/${id}`);
        const json = await res.json();
        const song = json.data?.[0];

        if (!song) throw new Error('Song not found');

        // 2. Get highest quality URL
        const downloadUrl = song.downloadUrl?.at(-1)?.url;
        if (!downloadUrl) throw new Error('No download URL found');

        // 3. Prepare Metadata & Clean Filename
        const safeName = decodeHtml(song.name);
        const safeArtist = decodeHtml(song.artists?.primary?.map(a => a.name).join(', ') || 'Unknown');
        const safeAlbum = decodeHtml(song.album?.name || '');
        const filename = `${safeName} - ${safeArtist}.mp3`.replace(/[<>:"/\\|?*]/g, '');

        console.log(`Processing: ${filename}`);

        // 4. Download Audio Stream into Buffer
        const audioRes = await fetch(downloadUrl);
        if (!audioRes.ok) throw new Error('Failed to fetch audio stream');
        const audioBuffer = Buffer.from(await audioRes.arrayBuffer());

        // 5. Download Cover Art Image into Buffer
        let imageBuffer = null;
        const imageUrl = song.image?.at(-1)?.url;
        if (imageUrl) {
            try {
                const imgRes = await fetch(imageUrl);
                if (imgRes.ok) {
                    imageBuffer = Buffer.from(await imgRes.arrayBuffer());
                }
            } catch (e) {
                console.warn("Image fetch failed", e);
            }
        }

        // 6. Attach ID3 Tags & Cover Art in Memory using pure JS
        const tags = {
            title: safeName,
            artist: safeArtist,
            album: safeAlbum,
            year: song.year ? String(song.year) : undefined,
            ...(imageBuffer && {
                APIC: {
                    type: { id: 3, name: 'front cover' },
                    mime: 'image/jpeg',
                    description: 'Cover',
                    imageBuffer: imageBuffer
                }
            })
        };

        const taggedBuffer = NodeID3.write(tags, audioBuffer);

        // 7. Return Tagged MP3 Response directly
        return new Response(taggedBuffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
            },
        });

    } catch (error) {
        console.error("Download Handler Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
