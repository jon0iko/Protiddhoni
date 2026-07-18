import 'dotenv/config';
/**
 * Upload Audiobooks Script
 * -------------------------------------------------------------
 * Uploads narration MP3s to Supabase Storage (bucket: images, folder: audio)
 * and sets content.audio_url for each matching story — in one command.
 *
 * Filenames MUST match the story slug, e.g. `ashar-alo.mp3` -> slug `ashar-alo`.
 * Re-runnable (upsert): running it again just overwrites the same files/URLs.
 *
 * Prerequisite (run ONCE in Supabase -> SQL Editor):
 *   ALTER TABLE content ADD COLUMN IF NOT EXISTS audio_url TEXT;
 *
 * Usage (from the backend/ folder):
 *   pnpm run upload-audio                              # uses ../audio-mp3
 *   tsx scripts/uploadAudiobooks.ts /path/to/folder    # custom folder
 */

import fs from 'fs';
import path from 'path';
import db from '../config/database';

const supabase = db.getClient();

const BUCKET = 'images';
const FOLDER = 'audio';
const DEFAULT_DIR = path.resolve(__dirname, '../../audio-mp3');

async function main() {
    const dir = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_DIR;

    if (!fs.existsSync(dir)) {
        console.error(`❌ Audio folder not found: ${dir}`);
        process.exit(1);
    }

    const files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.mp3'));
    if (files.length === 0) {
        console.error(`❌ No .mp3 files found in ${dir}`);
        process.exit(1);
    }

    console.log(`🎧 Found ${files.length} audio file(s) in ${dir}\n`);

    // Pre-flight: make sure the audio_url column exists.
    const { error: colError } = await supabase.from('content').select('audio_url').limit(1);
    if (colError && /audio_url/.test(colError.message)) {
        console.error('❌ The `audio_url` column does not exist yet.\n');
        console.error('   Run this once in Supabase -> SQL Editor, then re-run this script:\n');
        console.error('     ALTER TABLE content ADD COLUMN IF NOT EXISTS audio_url TEXT;\n');
        process.exit(1);
    }

    let uploaded = 0;
    let linked = 0;
    const notFound: string[] = [];

    for (const file of files) {
        const slug = path.basename(file, path.extname(file));
        const storagePath = `${FOLDER}/${file}`;
        const buffer = fs.readFileSync(path.join(dir, file));

        // 1. Upload to Storage (upsert so the script is safely re-runnable).
        const { error: upErr } = await supabase.storage
            .from(BUCKET)
            .upload(storagePath, buffer, {
                contentType: 'audio/mpeg',
                cacheControl: '31536000',
                upsert: true,
            });

        if (upErr) {
            console.error(`  ✗ ${file} — upload failed: ${upErr.message}`);
            continue;
        }
        uploaded++;

        // 2. Public URL.
        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
        const publicUrl = urlData.publicUrl;

        // 3. Link to the story by slug.
        const { data: rows, error: dbErr } = await supabase
            .from('content')
            .update({ audio_url: publicUrl })
            .eq('slug', slug)
            .select('id, slug');

        if (dbErr) {
            console.error(`  ✗ ${file} — DB update failed: ${dbErr.message}`);
            continue;
        }

        if (!rows || rows.length === 0) {
            notFound.push(slug);
            console.warn(`  ⚠ ${file} — uploaded, but no story has slug "${slug}"`);
        } else {
            linked++;
            console.log(`  ✓ ${file} → "${slug}"`);
        }
    }

    console.log('\n── Summary ──');
    console.log(`  Uploaded to Storage : ${uploaded}/${files.length}`);
    console.log(`  Linked to a story   : ${linked}/${files.length}`);
    if (notFound.length) {
        console.log(`  ⚠ Slugs not found   : ${notFound.join(', ')}`);
        console.log('    (make sure the filename matches the story slug exactly)');
    }
    console.log('\n✅ Done.');
    process.exit(0);
}

main().catch((err) => {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
});
