/**
 * Add 10 New Dummy Content Script
 * Adds 10 new Bangla stories and poems to the database
 */

require('dotenv').config();
const db = require('../config/database');

const supabase = db.getClient();

async function addDummyContent() {
    console.log('📝 Starting to add 10 new dummy content items...\n');

    try {
        // First, get existing data
        const { data: categories, error: catError } = await supabase
            .from('categories')
            .select('id, slug');

        if (catError) throw catError;

        const { data: users, error: userError } = await supabase
            .from('users')
            .select('id, username');

        if (userError) throw userError;

        // Create lookup maps
        const categoryMap = {};
        categories.forEach(c => categoryMap[c.slug] = c.id);

        const userMap = {};
        users.forEach(u => userMap[u.username] = u.id);

        // Define 10 new content items
        const newContents = [
            {
                author_id: userMap['rafiqul_islam'],
                title: 'গ্রামের স্মৃতি',
                slug: 'gramer-smriti',
                content_type: 'story',
                body: `# গ্রামের স্মৃতি

শহর ছেড়ে যখন আমি গ্রামে ফিরলাম, সবকিছুই ছিল যেমন ছিল। একই পুকুর, একই মাঠ, একই পুরানো বটগাছ।

কিন্তু চোখ ছিল নতুন। মন ছিল দূর্বল এবং আহত। শহরের চকচকে জীবন আমাকে খাইয়েছে, কিন্তু শেখায়নি কীভাবে ভালো থাকতে হয়।

সেই দিন আমি বুঝলাম যে আসল সম্পদ কখনো শহরে নয়। সম্পদ লুকানো থাকে গ্রামের মাটিতে, প্রকৃতির কোলে। এবং সেই সম্পদ খুঁজে পেতে আমার সারা জীবন লাগবে।`,
                excerpt: 'শহর থেকে গ্রামে ফেরার একটি অভিজ্ঞতা...',
                cover_image_url: 'https://images.unsplash.com/photo-1500595046891-9d81ca66ff77?w=400&h=600&fit=crop',
                category_id: categoryMap['social'],
                status: 'approved',
                is_published: true,
                is_premium: false,
                price: 0,
                language: 'bn',
                view_count: 5300,
                published_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                author_id: userMap['nasir_uddin'],
                title: 'রাতের চাঁদ',
                slug: 'rater-chand',
                content_type: 'poem',
                body: `# রাতের চাঁদ

রূপোলি চাঁদ উঠেছে রাতের আকাশে,
আলোয় আলোয় ভেসে যায় সারা পৃথিবী।
তারাগুলো দেখছে তাকিয়ে নীচে,
চাঁদের সৌন্দর্যে হারিয়ে যায় সবী।

ঘুমন্ত পৃথিবীতে শান্তি নেমে আসে,
চাঁদের আলোয় স্বপ্ন দেখি আমরা।
জাগা থাকি রাত ভর তার জন্য,
এই সৌন্দর্য দেখতে, চাঁদ আমাদের প্রিয় সারা।`,
                excerpt: 'চাঁদকে নিয়ে লেখা একটি রোমান্টিক কবিতা...',
                cover_image_url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=600&fit=crop',
                category_id: categoryMap['poetry'],
                status: 'approved',
                is_published: true,
                is_premium: false,
                price: 0,
                language: 'bn',
                view_count: 7200,
                published_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                author_id: userMap['sumitra_debi'],
                title: 'বৃদ্ধ যাত্রীর গল্প',
                slug: 'briddho-jatrir-golpo',
                content_type: 'story',
                body: `# বৃদ্ধ যাত্রীর গল্প

ট্রেনের একটি শেয়ার কোচে বসেছিলেন একজন বৃদ্ধ মানুষ। তার চেহারায় ছিল অসংখ্য রেখা, প্রতিটি রেখা বলছিল একটি করে গল্প।

এক নীরব যাত্রা শুরু হয়েছিল। তিনি বসে বসে জানালা দিয়ে তাকিয়ে ছিলেন। মাঝে মাঝে একটি দীর্ঘ শ্বাস ফেলতেন। যেন অতীতের কোন স্মৃতি হঠাৎ ফিরে আসত।

একজন ছোট্ট শিশু তার পাশে বসে অনেক প্রশ্ন করেছিল। বৃদ্ধ মানুষ প্রতিটি প্রশ্নের উত্তর দিয়েছিল ধৈর্যের সাথে। এবং ট্রেন যখন স্টেশনে থামল, শিশুর পরিবার গিয়ে গেল। বৃদ্ধ মানুষ আবার একা হয়ে গেলেন।

কিন্তু এবার তার হাসি ছিল ভিন্ন। কারণ সে জানত, সে একটি শিশুর মনে ছাপ ফেলে গেছে। এবং সেটাই বোধ হয় জীবনের একমাত্র সার্থকতা।`,
                excerpt: 'ট্রেনে এক বৃদ্ধ যাত্রীর সাথে দেখা হওয়ার একটি গল্প...',
                cover_image_url: 'https://images.unsplash.com/photo-1518013696086-5217270d3158?w=400&h=600&fit=crop',
                category_id: categoryMap['social'],
                status: 'approved',
                is_published: true,
                is_premium: true,
                price: 75.00,
                language: 'bn',
                view_count: 9800,
                published_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                author_id: userMap['nasir_uddin'],
                title: 'মানুষের মূল্য',
                slug: 'manushyer-mulyo',
                content_type: 'poem',
                body: `# মানুষের মূল্য

মানুষ নয় পণ্য কোনো দোকানের,
মানুষ নয় পাথর বাট করা অবিকল।
মানুষের মূল্য নিহিত থাকে হৃদয়ে,
তার করুণা, ভালোবাসায়, সেবায়।

ধনী হোক বা দরিদ্র, উচ্চজাত বা নিম্নবর্ণ,
সবার মধ্যে থাকে এক অনন্য সৌন্দর্য।
তাকে খুঁজে বের করা আমাদের দায়িত্ব,
প্রতিটি মানুষের ভিতর লুকানো সম্পদ।

তাই বলি, মানুষকে শ্রদ্ধা করো,
তার কথা শোনো, তাকে বুঝো।
কারণ মানুষই পৃথিবীর সবচেয়ে সুন্দর সৃষ্টি,
এবং তার মূল্য অমূল্য, চিরকালের।`,
                excerpt: 'মানুষের মূল্য নিয়ে লেখা একটি সামাজিক কবিতা...',
                cover_image_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop',
                category_id: categoryMap['poetry'],
                status: 'approved',
                is_published: true,
                is_premium: false,
                price: 0,
                language: 'bn',
                view_count: 5600,
                published_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                author_id: userMap['mahmud_haque'],
                title: 'সাগরের রহস্য',
                slug: 'sager-rohosho',
                content_type: 'story',
                body: `# সাগরের রহস্য

সমুদ্র সৈকতে একটি পুরানো বাতিঘর দাঁড়িয়ে ছিল নিঃসঙ্গভাবে। বছরের পর বছর ঝড়ঝঞ্ঝা সহ্য করে এসেছে এটি।

একদিন এক যুবক সেখানে পৌঁছাল। তার উদ্দেশ্য ছিল বাতিঘরের রক্ষক হওয়া। ভিতরে ঢুকে সে পেল একটি ডায়েরি। ডায়েরিতে লেখা ছিল আগের বাতিঘর রক্ষকের গল্প।

প্রতিটি পৃষ্ঠায় ছিল এক অপূর্ব প্রেমের গল্প। কীভাবে সে প্রতিদিন সন্ধ্যায় জানালা দিয়ে তাকিয়ে থাকত সমুদ্রের দিকে, অপেক্ষা করত তার প্রেমিকার জন্য যে কখনো আর ফেরত আসেনি।

যুবক ডায়েরি পড়ে দীর্ঘ ঘন্টা কাটিয়ে দিল। এবং সেই রাতে, আলোর নিয়মে বাতিঘর জ্বালিয়ে, সে সিদ্ধান্ত নিল যে সে এই বাতিঘরের রক্ষক হিসেবে থাকবে। শুধু নাবিকদের জন্য নয়, অতীতের সেই যুবকের স্বপ্নকে রক্ষা করার জন্যও।`,
                excerpt: 'একটি বাতিঘরের মধ্যে লুকানো অপূর্ব প্রেমের গল্প...',
                cover_image_url: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400&h=600&fit=crop',
                category_id: categoryMap['mystery'],
                status: 'approved',
                is_published: true,
                is_premium: false,
                price: 0,
                language: 'bn',
                view_count: 8400,
                published_at: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                author_id: userMap['nasir_uddin'],
                title: 'মায়ের হাত',
                slug: 'mayer-hat',
                content_type: 'poem',
                body: `# মায়ের হাত

মায়ের হাত আমার কপালে,
স্পর্শ করে যায় সব দুঃখ।
মায়ের স্পর্শে মিলিয়ে যায় অন্ধকার,
আলোয় ভেসে যায় পুরো জগৎ।

ছোটবেলায় কখনো আঘাত পেলে,
মায়ের হাত স্পর্শ করিয়ে দিত।
ব্যথা চলে যেত, অবশ রয়ে যেত শুধু ভালোবাসা।
সেই স্পর্শের মূল্য কি বুঝি আমরা সবাই?

বড় হয়ে যখন চলে যাই দূরে,
মায়ের হাত খুঁজি প্রতিটি রাতে।
তার ডাকে ফিরে যাই হোঁচট খেয়ে,
কারণ মায়ের হাতেই আমার সব প্রশান্তি।`,
                excerpt: 'মায়ের স্পর্শ নিয়ে লেখা একটি আবেগময় কবিতা...',
                cover_image_url: 'https://images.unsplash.com/photo-1535382455541-c5b8e6ad6c43?w=400&h=600&fit=crop',
                category_id: categoryMap['poetry'],
                status: 'approved',
                is_published: true,
                is_premium: false,
                price: 0,
                language: 'bn',
                view_count: 11200,
                published_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                author_id: userMap['rafiqul_islam'],
                title: 'রঙের স্বপ্ন',
                slug: 'ronger-swopno',
                content_type: 'story',
                body: `# রঙের স্বপ্ন

ছোট্ট একটি শহরের ছোট্ট একটি ঘরে বাস করত এক শিল্পী। তার নাম আর্থার। সে অনেক প্রতিভাবান ছিল, কিন্তু দরিদ্র অত্যন্ত।

প্রতিদিন সে ফুটপাতে বসে ছবি আঁকত। তার ছবিগুলো অসাধারণ ছিল, কিন্তু কেউ কেনার মতো অর্থ রাখত না।

একদিন এক অমনি খ্যাত শিল্প সংগ্রাহক তার ছবি দেখে মুগ্ধ হলেন। তিনি আর্থারকে তার গ্যালারিতে প্রদর্শনীর সুযোগ দিলেন।

সেই প্রদর্শনী আর্থারের জীবন বদলে দিল। তার সব ছবি বিক্রি হয়ে গেল। এবং আর্থার হয়ে উঠল বিখ্যাত শিল্পী।

কিন্তু তিনি কখনো ভুলে যাননি সেই দিনগুলো। প্রতি বছর তিনি আরেকটি প্রতিভাবান শিল্পীকে খুঁজে বের করেন এবং তাকে সাহায্য করেন। কারণ তিনি জানেন, একটি সুযোগ কীভাবে জীবন বদলে দিতে পারে।`,
                excerpt: 'একজন প্রতিভাবান শিল্পীর সফলতার গল্প...',
                cover_image_url: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=600&fit=crop',
                category_id: categoryMap['social'],
                status: 'approved',
                is_published: true,
                is_premium: false,
                price: 0,
                language: 'bn',
                view_count: 6900,
                published_at: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                author_id: userMap['nasir_uddin'],
                title: 'বৃষ্টির সুর',
                slug: 'brishti-sur',
                content_type: 'poem',
                body: `# বৃষ্টির সুর

মেঘ আসে ভারী পায়ে,
নীল আকাশ হয়ে যায় কালো।
বৃষ্টি পড়ে টাপুর টুপুর,
ধরণী নাচে রিমঝিম সুরে।

তালের সাথে গাছেরা দুলে যায়,
ফুলেরা খোলে নতুন পাঁপড়ি।
বৃষ্টির প্রতিটি বুন্দ নিয়ে আসে জীবন,
নতুন সম্ভাবনা, নতুন আশা।

ছাদে বসে শুনি বৃষ্টির গান,
মনে জাগে এক মধুর স্পন্দন।
পৃথিবী হয়ে ওঠে সবুজ সতেজ,
এবং আমি হারিয়ে যাই বৃষ্টির সুরে।`,
                excerpt: 'বৃষ্টির সৌন্দর্য নিয়ে লেখা একটি সুন্দর কবিতা...',
                cover_image_url: 'https://images.unsplash.com/photo-1534274988757-a28bf1a4c817?w=400&h=600&fit=crop',
                category_id: categoryMap['poetry'],
                status: 'approved',
                is_published: true,
                is_premium: false,
                price: 0,
                language: 'bn',
                view_count: 7800,
                published_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                author_id: userMap['taslima_akter'],
                title: 'আশার আলো',
                slug: 'ashar-alo',
                content_type: 'story',
                body: `# আশার আলো

অন্ধকার রাত। শহরের পথে একটি ছোট্ট দোকান। সেখানে কাজ করে একটি দরিদ্র যুবক যার নাম করিম।

প্রতিদিন সকাল থেকে রাত পর্যন্ত কাজ করত। কোনো সপ্তাহান্তের দিন ছিল না, কোনো ছুটি ছিল না। তবুও তার মুখে থাকত হাসি।

একদিন একজন বয়স্ক মানুষ দোকানে এসে তার পড়াশোনার কথা জিজ্ঞেস করল। করিম বলল যে তার স্বপ্ন ছিল পড়াশোনা করা কিন্তু অর্থের অভাবে পারেনি।

সেই বুড়ো মানুষ করিমের জন্য একটি বৃত্তির ব্যবস্থা করে দিল। আজ করিম একজন সফল প্রকৌশলী। এবং প্রতি মাসে সে তার বৃত্তি দাতার কথা মনে করে এবং অন্য একজন গরিব শিক্ষার্থীকে সাহায্য করে।`,
                excerpt: 'দরিদ্র যুবক থেকে সফল প্রকৌশলীর গল্প...',
                cover_image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
                category_id: categoryMap['social'],
                status: 'approved',
                is_published: true,
                is_premium: false,
                price: 0,
                language: 'bn',
                view_count: 8900,
                published_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                author_id: userMap['nasir_uddin'],
                title: 'প্রকৃতির বন্দনা',
                slug: 'prokriti-bandan',
                content_type: 'poem',
                body: `# প্রকৃতির বন্দনা

সবুজ পাতা, কাঁচা ডাল,
পাখির ডাক, হাওয়ার ঝাঁপটা।
প্রকৃতির কোলে শান্তি খুঁজি আমরা,
জীবনের সব কষ্ট ভুলে যাই এখানে।

পর্বত উঁচু, সমুদ্র গভীর,
বন ঘন, নদী বহমান।
প্রতিটি সৃষ্টিতে আছে এক অপূর্ব সৌন্দর্য,
যা মানুষের হৃদয় স্পর্শ করে যায়।

প্রকৃতি আমাদের শিক্ষক, আমাদের পথপ্রদর্শক,
তার কোলে আমরা নিরাপদ, আমরা সুখী।
তাই প্রকৃতিকে ভালোবাসি, তাকে রক্ষা করি,
কারণ প্রকৃতি ছাড়া আমাদের কোনো ভবিষ্যৎ নেই।`,
                excerpt: 'প্রকৃতির প্রতি ভালোবাসা নিয়ে লেখা কবিতা...',
                cover_image_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=600&fit=crop',
                category_id: categoryMap['poetry'],
                status: 'approved',
                is_published: true,
                is_premium: false,
                price: 0,
                language: 'bn',
                view_count: 6500,
                published_at: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];

        console.log(`📥 Inserting ${newContents.length} new content items...\n`);

        const { data: insertedData, error: insertError } = await supabase
            .from('content')
            .insert(newContents)
            .select();

        if (insertError) throw insertError;

        console.log(`✅ Successfully inserted ${insertedData.length} new content items!\n`);

        console.log('📊 Summary of inserted content:');
        insertedData.forEach((item, index) => {
            console.log(`   ${index + 1}. "${item.title}" (${item.content_type}) - ${item.slug}`);
        });

        console.log('\n✨ New content addition completed successfully!');

    } catch (error) {
        console.error('❌ Error adding content:', error);
        throw error;
    }
}

// Run the script
if (require.main === module) {
    addDummyContent()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = addDummyContent;
