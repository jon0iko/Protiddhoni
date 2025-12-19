/**
 * Add Series Chapters Script
 * Adds multiple chapters to existing series
 */

require('dotenv').config();
const db = require('../config/database');

const supabase = db.getClient();

async function addSeriesChapters() {
    console.log('📝 Starting to add series chapters...\n');

    try {
        // Get existing series
        const { data: series, error: seriesError } = await supabase
            .from('series')
            .select('*')
            .in('slug', ['ondhokar-series', 'bhuter-bari']);

        if (seriesError) throw seriesError;

        const ondhokarSeries = series.find(s => s.slug === 'ondhokar-series');
        const bhuterBariSeries = series.find(s => s.slug === 'bhuter-bari');

        // Define chapters for "অন্ধকারের সিরিজ"
        const ondhokarChapters = [
            {
                author_id: ondhokarSeries.author_id,
                series_id: ondhokarSeries.id,
                title: 'অন্ধকারের সিরিজ - অধ্যায় ২: ভয়ের শুরু',
                slug: 'ondhokar-series-chapter-2',
                content_type: 'chapter',
                chapter_number: 2,
                body: `# অধ্যায় ২: ভয়ের শুরু

রাত গভীর হচ্ছিল। ঘরের মধ্যে শুধু একটি মোমবাতির আলো জ্বলছিল। বাইরে বৃষ্টি পড়ছিল প্রবল বেগে।

রিয়া জানালা দিয়ে বাইরে তাকাল। অন্ধকারে কিছুই দেখা যাচ্ছিল না। হঠাৎ বিদ্যুৎ চমকাল এবং সে দেখল - জানালার বাইরে একটি ছায়া দাঁড়িয়ে আছে।

"কে সেখানে?" রিয়া চিৎকার করে উঠল।

কোনো উত্তর এল না। শুধু বাতাসের শব্দ আর বৃষ্টির টিপটিপ শব্দ। কিন্তু রিয়া নিশ্চিত ছিল - সে কাউকে দেখেছে।

সে ধীরে ধীরে জানালার কাছে এগিয়ে গেল। হাত বাড়িয়ে পর্দা সরাল। কিন্তু বাইরে কেউ ছিল না।

"আমি কি ভুল দেখলাম?" রিয়া নিজেকে প্রশ্ন করল।

হঠাৎ পিছন থেকে একটি ঠান্ডা স্পর্শ অনুভব করল সে। ঘুরে তাকাতেই...`,
                excerpt: 'অন্ধকারে লুকিয়ে থাকা ভয়ের সাথে প্রথম মুখোমুখি...',
                cover_image_url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=400&h=600&fit=crop',
                category_id: ondhokarSeries.category_id,
                status: 'approved',
                is_published: true,
                is_premium: false,
                language: 'bn',
                view_count: 4200,
                published_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                author_id: ondhokarSeries.author_id,
                series_id: ondhokarSeries.id,
                title: 'অন্ধকারের সিরিজ - অধ্যায় ৩: রহস্যময় চিঠি',
                slug: 'ondhokar-series-chapter-3',
                content_type: 'chapter',
                chapter_number: 3,
                body: `# অধ্যায় ৩: রহস্যময় চিঠি

পরদিন সকালে রিয়া দরজার নিচে একটি চিঠি পেল। খামে কোনো নাম ছিল না, কোনো ঠিকানা ছিল না।

চিঠি খুলে পড়তে লাগল:

"প্রিয় রিয়া,

তুমি যে বাড়িতে আছ, সেটি সাধারণ কোনো বাড়ি নয়। এখানে অনেক রহস্য লুকিয়ে আছে। অনেক বছর আগে এই বাড়িতে একটি ভয়ঙ্কর ঘটনা ঘটেছিল।

যদি বাঁচতে চাও, তাহলে এই বাড়ি ছেড়ে চলে যাও। আর যদি সত্য জানতে চাও, তাহলে বেসমেন্টে যাও। সেখানে একটি পুরানো ডায়েরি পাবে।

কিন্তু মনে রেখো - একবার সত্য জানলে আর ফিরে আসা যায় না।

- এক শুভাকাঙ্ক্ষী"

রিয়ার হাত কাঁপছিল। সে কি করবে? বাড়ি ছেড়ে চলে যাবে নাকি সত্য জানার চেষ্টা করবে?

রাত নামলে, রিয়া সিদ্ধান্ত নিল। সে বেসমেন্টে যাবে।`,
                excerpt: 'একটি রহস্যময় চিঠি যা সবকিছু বদলে দেয়...',
                cover_image_url: 'https://images.unsplash.com/photo-1516410529446-2c777ec87e97?w=400&h=600&fit=crop',
                category_id: ondhokarSeries.category_id,
                status: 'approved',
                is_published: true,
                is_premium: false,
                language: 'bn',
                view_count: 3800,
                published_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];

        // Define chapters for "ভূতের বাড়ি"
        const bhuterBariChapters = [
            {
                author_id: bhuterBariSeries.author_id,
                series_id: bhuterBariSeries.id,
                title: 'ভূতের বাড়ি - পর্ব ১: পরিত্যক্ত বাড়ি',
                slug: 'bhuter-bari-chapter-1',
                content_type: 'chapter',
                chapter_number: 1,
                body: `# পর্ব ১: পরিত্যক্ত বাড়ি

শহরের বাইরে একটি পুরানো বাড়ি। দশ বছর ধরে কেউ সেখানে থাকে না। স্থানীয় মানুষরা বলে, সেই বাড়িতে ভূত আছে।

অমিত এবং তার বন্ধুরা সিদ্ধান্ত নিল সেই বাড়িতে একটি রাত কাটাবে। তারা ভূতে বিশ্বাস করত না।

"আরে, ভূত বলে কিছু নেই। এগুলো সব কুসংস্কার," অমিত বলল।

কিন্তু যখন তারা বাড়িতে ঢুকল, পরিবেশ সম্পূর্ণ আলাদা মনে হল। দরজা খোলার সাথে সাথে একটি ঠান্ডা বাতাস বয়ে গেল।

ভিতরে সবকিছু ধূলোয় ঢাকা। আসবাবপত্র ছড়িয়ে ছিটিয়ে পড়ে আছে। দেয়ালে পুরানো ছবি ঝুলছে।

"দেখো, একটি পরিবারের ছবি," রিনা একটি ছবি দেখিয়ে বলল।

ছবিতে চারজন মানুষ - বাবা, মা এবং দুই সন্তান। সবাই হাসছিল। কিন্তু কিছু একটা অদ্ভুত ছিল। মায়ের চোখ যেন সরাসরি ক্যামেরার দিকে তাকিয়ে ছিল না। সে যেন কোথাও অন্যদিকে তাকিয়ে ছিল।

"চলো, উপরে যাই," অমিত বলল।

কিন্তু সিঁড়িতে পা রাখতেই একটি শব্দ শোনা গেল। কে যেন উপর থেকে পায়চারি করছে।`,
                excerpt: 'একটি পরিত্যক্ত বাড়িতে প্রথম রাতের অভিজ্ঞতা...',
                cover_image_url: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=400&h=600&fit=crop',
                category_id: bhuterBariSeries.category_id,
                status: 'approved',
                is_published: true,
                is_premium: false,
                language: 'bn',
                view_count: 6500,
                published_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                author_id: bhuterBariSeries.author_id,
                series_id: bhuterBariSeries.id,
                title: 'ভূতের বাড়ি - পর্ব ২: উপরতলার শব্দ',
                slug: 'bhuter-bari-chapter-2',
                content_type: 'chapter',
                chapter_number: 2,
                body: `# পর্ব ২: উপরতলার শব্দ

সবাই থমকে দাঁড়াল। শব্দটা স্পষ্ট শোনা যাচ্ছিল। কেউ যেন উপরে হাঁটছে।

"হয়তো কোনো ইঁদুর," সীমা বলল, কিন্তু তার গলায় ভয় ছিল।

"না, এটা ইঁদুরের শব্দ নয়। এটা মানুষের পায়ের শব্দ," অমিত বলল।

তারা ধীরে ধীরে সিঁড়ি দিয়ে উপরে উঠতে লাগল। প্রতিটি ধাপে সিঁড়ি চিঁ চিঁ শব্দ করছিল।

উপরে পৌঁছে দেখল একটি লম্বা করিডোর। করিডোরের দুই পাশে অনেকগুলো দরজা। সব দরজা বন্ধ ছিল।

শব্দটা আসছিল করিডোরের শেষের ঘর থেকে।

অমিত টর্চ জ্বালিয়ে সামনে এগিয়ে গেল। বাকিরা তার পিছু পিছু চলল।

করিডোরের শেষের দরজায় পৌঁছে অমিত থামল। দরজার নিচ দিয়ে আলো বেরিয়ে আসছিল।

"এটা কীভাবে সম্ভব? এই বাড়িতে তো কারেন্ট নেই," রিনা ফিসফিস করে বলল।

অমিত ধীরে ধীরে দরজার হাতল ধরল। গভীর শ্বাস নিয়ে দরজা খুলে দিল।

যা দেখল তা বিশ্বাস করা কঠিন ছিল। ঘরের মধ্যে...`,
                excerpt: 'উপরতলায় কে হাঁটছে? রহস্য গভীর হচ্ছে...',
                cover_image_url: 'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=400&h=600&fit=crop',
                category_id: bhuterBariSeries.category_id,
                status: 'approved',
                is_published: true,
                is_premium: false,
                language: 'bn',
                view_count: 5900,
                published_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                author_id: bhuterBariSeries.author_id,
                series_id: bhuterBariSeries.id,
                title: 'ভূতের বাড়ি - পর্ব ৩: রহস্যের ঘর',
                slug: 'bhuter-bari-chapter-3',
                content_type: 'chapter',
                chapter_number: 3,
                body: `# পর্ব ৩: রহস্যের ঘর

ঘরটি সাজানো ছিল যেন কেউ এখনো এখানে থাকে। বিছানা পরিপাটি, টেবিলে একটি মোমবাতি জ্বলছে, এবং বইয়ের তাক ঠাসা।

"এটা..." সীমা কথা শেষ করতে পারল না।

ঘরের কোণে একটি আয়না ছিল। পুরানো, বড়, সোনালি ফ্রেমে বাঁধানো। অমিত আয়নার দিকে তাকাল।

আয়নায় তাদের প্রতিবিম্ব দেখা যাচ্ছিল। কিন্তু একটা অদ্ভুত ব্যাপার ছিল - আয়নায় একজন অতিরিক্ত মানুষ দেখা যাচ্ছিল।

একটি মেয়ে, সাদা পোশাকে, দাঁড়িয়ে আছে তাদের পিছনে।

"পিছনে কে আছে?" অমিত চিৎকার করে পিছন ফিরে তাকাল।

কিন্তু পিছনে কেউ ছিল না।

আবার আয়নার দিকে তাকাল। মেয়েটি এখনো সেখানে আছে। এবার সে হাসছে। একটা ভয়ঙ্কর হাসি।

মেয়েটি ধীরে ধীরে হাত তুলল এবং ইশারা করল তাদের কাছে আসতে। আয়নার ভিতরে আসতে।

"দৌড়াও!" অমিত চিৎকার করে বলল।

কিন্তু দরজা নিজে নিজে বন্ধ হয়ে গেল। তারা আটকা পড়ে গেল ঘরে। এবং আয়না থেকে একটি হাত বেরিয়ে আসতে শুরু করল...`,
                excerpt: 'আয়নার রহস্য উন্মোচন - ভয়ের নতুন মাত্রা...',
                cover_image_url: 'https://images.unsplash.com/photo-1610056494052-6a4f83a8368c?w=400&h=600&fit=crop',
                category_id: bhuterBariSeries.category_id,
                status: 'approved',
                is_published: true,
                is_premium: false,
                language: 'bn',
                view_count: 5200,
                published_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                author_id: bhuterBariSeries.author_id,
                series_id: bhuterBariSeries.id,
                title: 'ভূতের বাড়ি - পর্ব ৪: মুক্তির পথ',
                slug: 'bhuter-bari-chapter-4',
                content_type: 'chapter',
                chapter_number: 4,
                body: `# পর্ব ৪: মুক্তির পথ

হাতটা বেরিয়ে আসছিল। ঠান্ডা, সাদা, হাড়ের মতো। আঙুলগুলো লম্বা এবং বাঁকা।

রিনা টেবিল থেকে একটি বই তুলে নিল এবং আয়নার দিকে ছুঁড়ে মারল। বইটা আয়নায় আঘাত করল এবং...

আয়না ভেঙে গেল হাজার টুকরোয়।

হঠাৎ পুরো ঘর কাঁপতে শুরু করল। দরজা খুলে গেল। এবং একটি চিৎকার শোনা গেল - দীর্ঘ, বেদনাময়, ভয়ংকর।

"দৌড়াও!" অমিত চিৎকার করল।

তারা সবাই দৌড়ে করিডোরে বেরিয়ে এল। সিঁড়ি দিয়ে নিচে নামতে লাগল। পিছন থেকে শব্দ আসছিল - কেউ যেন তাদের তাড়া করছে।

বাড়ির বাইরে বেরিয়ে তারা দৌড়াতে থাকল। থামল না যতক্ষণ না মূল রাস্তায় পৌঁছাল।

পিছন ফিরে তাকাল। পুরানো বাড়িটা অন্ধকারে দাঁড়িয়ে আছে। কিন্তু এবার শান্ত। যেন কিছুই ঘটেনি।

"আমরা কি সত্যি..." সীমা কথা শেষ করল না।

"হ্যাঁ," অমিত বলল। "আমরা সত্যি ভূত দেখেছি। এবং আমরা ভাগ্যবান যে বেঁচে ফিরেছি।"

সেই রাতের পর তারা কখনো সেই বাড়ির কাছে যায়নি। কিন্তু কখনো কখনো, স্বপ্নে, তারা সেই মেয়েটিকে দেখে। সেই সাদা পোশাকের মেয়ে। আয়নার ভিতর থেকে হাসছে।`,
                excerpt: 'শেষ মুহূর্তে পালানোর চেষ্টা - বাঁচা বা মরা...',
                cover_image_url: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=400&h=600&fit=crop',
                category_id: bhuterBariSeries.category_id,
                status: 'approved',
                is_published: true,
                is_premium: false,
                language: 'bn',
                view_count: 4800,
                published_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                author_id: bhuterBariSeries.author_id,
                series_id: bhuterBariSeries.id,
                title: 'ভূতের বাড়ি - পর্ব ৫: সত্যের খোঁজে',
                slug: 'bhuter-bari-chapter-5',
                content_type: 'chapter',
                chapter_number: 5,
                body: `# পর্ব ৫: সত্যের খোঁজে

এক সপ্তাহ পার হয়ে গেল। কিন্তু অমিত শান্তি পাচ্ছিল না। প্রতি রাতে একই স্বপ্ন দেখত। সেই মেয়ে, সেই আয়না, সেই বাড়ি।

সে সিদ্ধান্ত নিল সত্য জানতে হবে। কী ঘটেছিল সেই বাড়িতে? কে ছিল সেই মেয়ে?

স্থানীয় লাইব্রেরিতে গিয়ে পুরানো সংবাদপত্র ঘাঁটতে লাগল। এবং খুঁজে পেল।

২০ বছর আগের একটি খবর:

"স্থানীয় পরিবার রহস্যজনকভাবে অদৃশ্য

মার্টিন পরিবার - বাবা জন, মা এলিজাবেথ, ছেলে টমি এবং মেয়ে এমিলি - গত রাতে রহস্যজনকভাবে অদৃশ্য হয়ে গেছে। তাদের বাড়িতে কোনো সংগ্রামের চিহ্ন পাওয়া যায়নি। পুলিশ তদন্ত চালিয়ে যাচ্ছে।"

অমিত ছবিটা দেখল। সেই একই পরিবার যার ছবি সে বাড়িতে দেখেছিল। এবং মেয়েটি - এমিলি - সেই একই মেয়ে যাকে সে আয়নায় দেখেছিল।

আরও খবর পড়ল। দুই মাস পর পুলিশ তদন্ত বন্ধ করে দেয়। পরিবারকে আর কখনো খুঁজে পাওয়া যায়নি।

"তাহলে কি..." অমিত ভাবল, "তারা সবাই সেই বাড়িতেই আছে? আয়নার ভিতরে?"

সে জানত তাকে আবার যেতে হবে। শুধু এবার, সে প্রস্তুত থাকবে। এবং সে মুক্ত করবে সেই আটকে পড়া আত্মাদের।

চলবে...`,
                excerpt: 'অতীতের সত্য উন্মোচন - নতুন অভিযানের শুরু...',
                cover_image_url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=600&fit=crop',
                category_id: bhuterBariSeries.category_id,
                status: 'approved',
                is_published: true,
                is_premium: false,
                language: 'bn',
                view_count: 4100,
                published_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];

        const allChapters = [...ondhokarChapters, ...bhuterBariChapters];

        console.log(`📥 Inserting ${allChapters.length} chapters...\n`);

        const { data: insertedChapters, error: insertError } = await supabase
            .from('content')
            .insert(allChapters)
            .select();

        if (insertError) throw insertError;

        console.log(`✅ Successfully inserted ${insertedChapters.length} chapters!\n`);

        // Update series total_chapters count
        await supabase
            .from('series')
            .update({ total_chapters: 3 })
            .eq('id', ondhokarSeries.id);

        await supabase
            .from('series')
            .update({ total_chapters: 5 })
            .eq('id', bhuterBariSeries.id);

        console.log('✅ Updated series chapter counts!\n');

        console.log('📊 Summary:');
        console.log(`   - অন্ধকারের সিরিজ: 3 chapters`);
        console.log(`   - ভূতের বাড়ি: 5 chapters\n`);

        console.log('✨ Series chapters addition completed successfully!');

    } catch (error) {
        console.error('❌ Error adding chapters:', error);
        throw error;
    }
}

// Run the script
if (require.main === module) {
    addSeriesChapters()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = addSeriesChapters;
