import { NextResponse } from 'next/server';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Configure ffmpeg path explicitly
if (ffmpegStatic) {
    ffmpeg.setFfmpegPath(ffmpegStatic);
}

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

    // Cleanup paths
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `${id}_raw.mp3`);
    const outputFilePath = path.join(tempDir, `${id}_tagged.mp3`);
    let imagePath = null;

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

        const tags = {
            title: safeName,
            artist: safeArtist,
            album: safeAlbum,
            year: song.year,
            image: song.image?.at(-1)?.url // High res image
        };

        // Sanitize filename for OS
        const filename = `${safeName} - ${safeArtist}.mp3`.replace(/[<>:"/\\|?*]/g, '');

        console.log(`Processing: ${filename}`);

        // rest of logic...

        // Download raw file
        const audioRes = await fetch(downloadUrl);
        if (!audioRes.ok) throw new Error('Failed to fetch audio stream');
        const buffer = await audioRes.arrayBuffer();
        fs.writeFileSync(tempFilePath, Buffer.from(buffer));

        // Download Cover Art
        if (tags.image) {
            try {
                const imgRes = await fetch(tags.image);
                if (imgRes.ok) {
                    const imgBuf = await imgRes.arrayBuffer();
                    imagePath = path.join(tempDir, `${id}.jpg`);
                    fs.writeFileSync(imagePath, Buffer.from(imgBuf));
                }
            } catch (e) { console.warn("Image fetch failed", e); }
        }

        // Process with FFMPEG
        await new Promise((resolve, reject) => {
            let command = ffmpeg(tempFilePath);

            // Add metadata
            command
                .outputOptions('-id3v2_version', '3')
                .outputOptions('-metadata', `title=${tags.title}`)
                .outputOptions('-metadata', `artist=${tags.artist}`)
                .outputOptions('-metadata', `album=${tags.album}`)
                .outputOptions('-metadata', `date=${tags.year || ''}`);

            // Add cover art
            if (imagePath && fs.existsSync(imagePath)) {
                command
                    .input(imagePath)
                    .outputOptions('-map', '0:0')
                    .outputOptions('-map', '1:0')
                    .outputOptions('-c', 'copy')
                    .outputOptions('-metadata:s:v', 'title="Album cover"')
                    .outputOptions('-metadata:s:v', 'comment="Cover (front)"');
            } else {
                command.audioCodec('copy');
            }

            command
                .save(outputFilePath)
                .on('end', resolve)
                .on('error', (err) => {
                    console.error('FFMPEG Error:', err);
                    reject(err);
                });
        });

        // Read back
        const taggedBuffer = fs.readFileSync(outputFilePath);

        // Return
        return new Response(taggedBuffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
            },
        });

    } catch (error) {
        console.error("Download Handler Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        // Cleanup
        try {
            if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
            if (fs.existsSync(outputFilePath)) fs.unlinkSync(outputFilePath);
            if (imagePath && fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        } catch (e) { console.error("Cleanup error", e); }
    }
}
