import 'dotenv/config';
/**
 * Seed Database Script
 * Populates database with dummy data for development
 */

import bcrypt from 'bcryptjs';
import db from '../config/database';
import slugify from '../utils/slugify';

const supabase = db.getClient();

async function seedDatabase() {
    console.log('🌱 Starting database seeding...\n');

    try {
        // 1. Seed Categories
        console.log('📂 Seeding categories...');
        const categories = [
            { name: 'প্রেমের গল্প', slug: 'romance', description: 'Love and romance stories', icon: '❤️' },
            { name: 'ভৌতিক', slug: 'horror', description: 'Horror and supernatural stories', icon: '👻' },
            { name: 'রহস্য', slug: 'mystery', description: 'Mystery and thriller stories', icon: '🔍' },
            { name: 'কবিতা', slug: 'poetry', description: 'Bengali poetry', icon: '📜' },
            { name: 'সামাজিক', slug: 'social', description: 'Social and contemporary stories', icon: '👥' },
            { name: 'ঐতিহাসিক', slug: 'historical', description: 'Historical fiction', icon: '🏛️' },
            { name: 'কল্পবিজ্ঞান', slug: 'sci-fi', description: 'Science fiction', icon: '🚀' },
            { name: 'হাস্যরস', slug: 'comedy', description: 'Comedy and humor', icon: '😂' },
            { name: 'শিশুতোষ', slug: 'children', description: 'Children stories', icon: '🧸' }
        ];

        const { data: categoryData, error: categoryError } = await supabase
            .from('categories')
            .upsert(categories, { onConflict: 'slug' })
            .select();

        if (categoryError) throw categoryError;
        console.log(`✅ Seeded ${categoryData.length} categories\n`);

        // 2. Seed Users
        console.log('👤 Seeding users...');
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        const users = [
            {
                email: 'admin@protiddhoni.com',
                username: 'admin',
                full_name: 'Admin User',
                password_hash: hashedPassword,
                bio: 'প্রতিধ্বনি প্ল্যাটফর্মের প্রশাসক',
                is_admin: true,
                profile_picture_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
            },
            {
                email: 'rafiq@example.com',
                username: 'rafiqul_islam',
                full_name: 'রফিকুল ইসলাম',
                password_hash: hashedPassword,
                bio: 'গল্প লিখতে ভালোবাসি। প্রেম এবং রহস্য আমার প্রিয় বিষয়।',
                is_admin: false,
                profile_picture_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rafiq'
            },
            {
                email: 'sumitra@example.com',
                username: 'sumitra_debi',
                full_name: 'সুমিত্রা দেবী',
                password_hash: hashedPassword,
                bio: 'সামাজিক গল্প লেখক। পারিবারিক মূল্যবোধ নিয়ে লিখি।',
                is_admin: false,
                profile_picture_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sumitra'
            },
            {
                email: 'mahmud@example.com',
                username: 'mahmud_haque',
                full_name: 'মাহমুদুল হক',
                password_hash: hashedPassword,
                bio: 'ভৌতিক এবং রহস্য গল্পের লেখক।',
                is_admin: false,
                profile_picture_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mahmud'
            },
            {
                email: 'nasir@example.com',
                username: 'nasir_uddin',
                full_name: 'নাসির উদ্দিন',
                password_hash: hashedPassword,
                bio: 'কবি এবং প্রকৃতি প্রেমী।',
                is_admin: false,
                profile_picture_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nasir'
            },
            {
                email: 'taslima@example.com',
                username: 'taslima_akter',
                full_name: 'তাসলিমা আক্তার',
                password_hash: hashedPassword,
                bio: 'নতুন লেখক, গল্প লিখতে শিখছি।',
                is_admin: false,
                profile_picture_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=taslima'
            }
        ];

        const { data: userData, error: userError } = await supabase
            .from('users')
            .upsert(users, { onConflict: 'email' })
            .select();

        if (userError) throw userError;
        console.log(`✅ Seeded ${userData.length} users\n`);

        // Create user lookup map
        const userMap = {};
        userData.forEach(u => userMap[u.username] = u);

        // 3. Seed Series
        console.log('📚 Seeding series...');
        const series = [
            {
                author_id: userMap['rafiqul_islam'].id,
                title: 'অন্ধকারের সিরিজ',
                slug: 'ondhokar-series',
                description: 'একটি রহস্যময় সিরিজ যেখানে প্রতিটি অধ্যায়ে নতুন রহস্য উন্মোচিত হয়।',
                category_id: categoryData.find(c => c.slug === 'mystery').id,
                total_chapters: 3,
                is_completed: false,
                cover_image_url: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&h=600&fit=crop'
            },
            {
                author_id: userMap['mahmud_haque'].id,
                title: 'ভূতের বাড়ি',
                slug: 'bhuter-bari',
                description: 'পুরানো ঢাকার এক ভূতুড়ে বাড়ির গল্প।',
                category_id: categoryData.find(c => c.slug === 'horror').id,
                total_chapters: 5,
                is_completed: true,
                cover_image_url: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=400&h=600&fit=crop'
            }
        ];

        const { data: seriesData, error: seriesError } = await supabase
            .from('series')
            .upsert(series, { onConflict: 'slug' })
            .select();

        if (seriesError) throw seriesError;
        console.log(`✅ Seeded ${seriesData.length} series\n`);

        // 4. Seed Content
        console.log('📝 Seeding content...');
        const contents = [
            // Story 1
            {
                author_id: userMap['rafiqul_islam'].id,
                title: 'অন্তরালের গল্প',
                slug: 'ontoraler-golpo',
                content_type: 'story',
                body: `# অন্তরালের গল্প

শহরের কোলাহল থেকে দূরে, এক ছোট্ট গ্রামে বাস করত রিয়া। তার জীবন ছিল সাদামাটা, কিন্তু তার স্বপ্ন ছিল বিশাল।

## প্রথম পরিচয়

একদিন বাজার থেকে ফেরার পথে রিয়ার সাথে দেখা হয় আরিফের। আরিফ ছিল শহর থেকে আসা এক তরুণ লেখক। তাদের প্রথম দেখাতেই যেন কোথাও একটা সংযোগ তৈরি হয়ে গেল।

"তুমি কি গল্প পড়তে পছন্দ কর?" আরিফ জিজ্ঞেস করল।

"হ্যাঁ, খুব পছন্দ। বিশেষ করে প্রেমের গল্প," রিয়া লাজুক হেসে বলল।

## দ্বিতীয় অধ্যায়

তারপর থেকে প্রতিদিন সন্ধ্যায় তারা গ্রামের নদীর ধারে দেখা করত। আরিফ তার নতুন গল্প শোনাত, আর রিয়া মন্ত্রমুগ্ধের মতো শুনত।

কিন্তু একদিন আরিফকে শহরে ফিরে যেতে হলো। বিদায়ের সময় সে রিয়াকে বলল, "আমি ফিরে আসব। প্রতিশ্রুতি।"

## শেষ কথা

রিয়া অপেক্ষা করতে লাগল। প্রতিদিন নদীর ধারে বসে থাকত। এবং একদিন সত্যিই আরিফ ফিরে এল। তার হাতে ছিল একটি বই - "অন্তরালের গল্প" - যা তিনি রিয়াকে নিয়ে লিখেছিলেন।

"এই গল্পের নায়িকা তুমি," আরিফ বলল।

এবং সেই থেকে শুরু হলো তাদের নিজস্ব গল্প, যা অন্তরালে নয়, সবার সামনে।`,
                excerpt: 'একটি রহস্যময় প্রেমের গল্প যা আপনাকে মুগ্ধ করবে...',
                cover_image_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop',
                category_id: categoryData.find(c => c.slug === 'romance').id,
                series_id: null,
                chapter_number: null,
                status: 'approved',
                is_published: true,
                is_premium: false,
                price: 0,
                language: 'bn',
                view_count: 12500,
                published_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            },
            // Story 2
            {
                author_id: userMap['sumitra_debi'].id,
                title: 'মায়ের চিঠি',
                slug: 'mayer-chithi',
                content_type: 'story',
                body: `# মায়ের চিঠি

প্রিয় সন্তান,

আজ তোমাকে এই চিঠি লিখছি কারণ মুখে হয়তো অনেক কথা বলা হয়ে ওঠে না।

## তোমার শৈশব

মনে আছে ছোটবেলায় তুমি কেমন দুষ্টুমি করতে? সারাদিন খেলে বেড়াতে, আর রাতে ঘুমানোর আগে গল্প শুনতে চাইতে। সেই দিনগুলো কত সুন্দর ছিল।

তোমার প্রথম স্কুলের দিনের কথা মনে পড়ে? তুমি কেঁদে ফেলেছিলে, আমাকে ছাড়তে চাওনি। কিন্তু আস্তে আস্তে তুমি শক্ত হয়ে উঠলে।

## আজকের দিন

আজ তুমি বড় হয়ে গেছ। নিজের পায়ে দাঁড়িয়েছ। আমার গর্ব হয় তোমাকে নিয়ে। তবে মনে রেখো, তুমি যতই বড় হও না কেন, আমার কাছে তুমি সেই ছোট্ট শিশুই থেকে যাবে।

## শেষ কথা

জীবনে অনেক চড়াই-উৎরাই আসবে। কিন্তু হাল ছেড়ে দিও না। মনে রেখো, তোমার মা সবসময় তোমার সাথে আছে, তোমার জন্য দোয়া করছে।

ভালোবাসি তোমায়,
তোমার মা`,
                excerpt: 'একটি মর্মস্পর্শী গল্প যা প্রতিটি সন্তানের হৃদয় ছুঁয়ে যাবে...',
                cover_image_url: 'https://images.unsplash.com/photo-1476362555312-ab9e108a0b7e?w=400&h=600&fit=crop',
                category_id: categoryData.find(c => c.slug === 'social').id,
                series_id: null,
                chapter_number: null,
                status: 'approved',
                is_published: true,
                is_premium: true,
                price: 50.00,
                language: 'bn',
                view_count: 8900,
                published_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
            },
            // Story 3
            {
                author_id: userMap['mahmud_haque'].id,
                title: 'রাতের নিঃশব্দতা',
                slug: 'rater-nishobdota',
                content_type: 'story',
                body: `# রাতের নিঃশব্দতা

রাত তখন গভীর। চারদিকে নিস্তব্ধতা। শুধু দূরে কোথাও একটা কুকুর ডাকছিল।

## ভূতুড়ে বাড়ি

করিম সাহেবের পুরানো বাড়িটা বছর দশেক ধরে ফাঁকা পড়ে আছে। সবাই বলে বাড়িটায় ভূত আছে। কিন্তু রাকিব এসব বিশ্বাস করে না।

"আমি আজ রাতে ওই বাড়িতে থাকব," রাকিব বন্ধুদের চ্যালেঞ্জ দিল।

রাত বারোটায় রাকিব পৌঁছাল বাড়িতে। দরজা খুলতেই চিঁ চিঁ শব্দ। ভিতরে ঢুকে দেখে সব ধুলোয় ঢাকা। একটা মোমবাতি জ্বালিয়ে সে ঘুরতে লাগল।

## রহস্যময় শব্দ

হঠাৎ উপরের তলা থেকে কোন শব্দ এল। পায়ের আওয়াজ। রাকিবের গায়ে কাঁটা দিয়ে উঠল। কিন্তু সাহস করে সে সিঁড়ি দিয়ে উপরে উঠতে লাগল।

উপরে পৌঁছে দেখে একটা ঘরের দরজা আধখোলা। সেখান থেকে আলো আসছে। সে ধীরে ধীরে দরজার কাছে গেল এবং ভিতরে তাকাল।

## সত্য উন্মোচন

ঘরে একটা বুড়ো মানুষ বসে আছে। তার চেহারা দেখে রাকিব চিনতে পারল - এ তো করিম সাহেবের হারিয়ে যাওয়া ভাই!

দশ বছর আগে সবাই ভেবেছিল তিনি মারা গেছেন। কিন্তু আসলে তিনি এই বাড়িতেই লুকিয়ে ছিলেন, সমাজ থেকে দূরে।

"আমি শান্তি খুঁজছিলাম," বুড়ো বলল। "এখানে আমি তা পেয়েছি।"

সেই রাত থেকে বাড়িটা আর ভূতুড়ে নয়। এটা এক নিঃসঙ্গ মানুষের আশ্রয়।`,
                excerpt: 'একটি ভৌতিক রহস্য যা আপনার রাতের ঘুম কেড়ে নেবে...',
                cover_image_url: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=400&h=600&fit=crop',
                category_id: categoryData.find(c => c.slug === 'horror').id,
                series_id: null,
                chapter_number: null,
                status: 'approved',
                is_published: true,
                is_premium: false,
                price: 0,
                language: 'bn',
                view_count: 15600,
                published_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
            },
            // Poem
            {
                author_id: userMap['nasir_uddin'].id,
                title: 'বসন্তের কবিতা',
                slug: 'boshonter-kobita',
                content_type: 'poem',
                body: `# বসন্তের কবিতা

ফুলের গন্ধে ভরা বাতাস,
পাখির গানে মুখর প্রকৃতি,
বসন্ত এসেছে নিয়ে নতুন আশা,
রঙিন হয়ে উঠেছে সৃষ্টি।

## দ্বিতীয় স্তবক

কোকিলের কুহু কুহু ডাক,
আমের মুকুলের মিষ্টি সুবাস,
দোয়েল পাখির মধুর গান,
বসন্তে প্রকৃতি করে উল্লাস।

## তৃতীয় স্তবক

নতুন পাতায় সাজে গাছ,
ফুলের রঙে রাঙা বাগান,
মৌমাছি গুঞ্জন করে চারিদিক,
বসন্ত দেয় প্রকৃতিকে নতুন প্রাণ।

## শেষ স্তবক

এসো বসন্ত, থেকো চিরকাল,
তোমার সৌন্দর্যে মুগ্ধ হয় মন,
প্রকৃতির এই অপরূপ মেলা,
করে জীবনকে করে নবীন।`,
                excerpt: 'প্রকৃতির সৌন্দর্য নিয়ে লেখা একটি মনোমুগ্ধকর কবিতা...',
                cover_image_url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=600&fit=crop',
                category_id: categoryData.find(c => c.slug === 'poetry').id,
                series_id: null,
                chapter_number: null,
                status: 'approved',
                is_published: true,
                is_premium: false,
                price: 0,
                language: 'bn',
                view_count: 6700,
                published_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
            },
            // Series chapters
            {
                author_id: userMap['rafiqul_islam'].id,
                title: 'অন্ধকারের সিরিজ - অধ্যায় ১',
                slug: 'ondhokar-series-chapter-1',
                content_type: 'chapter',
                body: `# অধ্যায় ১: শুরু

রহস্যের শুরু হয়েছিল সেই কুয়াশাচ্ছন্ন রাতে। শহরের পুরানো লাইব্রেরিতে একটি প্রাচীন বই পাওয়া গিয়েছিল...`,
                excerpt: 'রহস্যের সূচনা...',
                cover_image_url: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&h=600&fit=crop',
                category_id: categoryData.find(c => c.slug === 'mystery').id,
                series_id: seriesData.find(s => s.slug === 'ondhokar-series').id,
                chapter_number: 1,
                status: 'approved',
                is_published: true,
                is_premium: false,
                price: 0,
                language: 'bn',
                view_count: 4500,
                published_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
            },
            // Pending content
            {
                author_id: userMap['taslima_akter'].id,
                title: 'নতুন ভোর',
                slug: 'notun-bhor',
                content_type: 'story',
                body: `# নতুন ভোর

প্রতিটি সকাল নিয়ে আসে নতুন আশা...`,
                excerpt: 'একটি অনুপ্রেরণামূলক গল্প',
                cover_image_url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=600&fit=crop',
                category_id: categoryData.find(c => c.slug === 'social').id,
                series_id: null,
                chapter_number: null,
                status: 'pending',
                is_published: false,
                is_premium: false,
                price: 0,
                language: 'bn',
                view_count: 0,
                published_at: null
            }
        ];

        const { data: contentData, error: contentError } = await supabase
            .from('content')
            .upsert(contents, { onConflict: 'slug' })
            .select();

        if (contentError) throw contentError;
        console.log(`✅ Seeded ${contentData.length} content items\n`);

        // 5. Seed Reviews
        console.log('⭐ Seeding reviews...');
        const reviews = [
            {
                content_id: contentData.find(c => c.slug === 'ontoraler-golpo').id,
                user_id: userMap['sumitra_debi'].id,
                rating: 5,
                review_text: 'অসাধারণ লেখা! খুবই ভালো লেগেছে।'
            },
            {
                content_id: contentData.find(c => c.slug === 'ontoraler-golpo').id,
                user_id: userMap['mahmud_haque'].id,
                rating: 4,
                review_text: 'সুন্দর গল্প। আরও বড় হলে আরও ভালো হতো।'
            },
            {
                content_id: contentData.find(c => c.slug === 'mayer-chithi').id,
                user_id: userMap['rafiqul_islam'].id,
                rating: 5,
                review_text: 'মর্মস্পর্শী লেখা। চোখে পানি এসে গেল।'
            },
            {
                content_id: contentData.find(c => c.slug === 'rater-nishobdota').id,
                user_id: userMap['nasir_uddin'].id,
                rating: 5,
                review_text: 'দারুণ রহস্য! শেষটা অপ্রত্যাশিত ছিল।'
            }
        ];

        const { data: reviewData, error: reviewError } = await supabase
            .from('reviews')
            .upsert(reviews, { onConflict: 'content_id,user_id' })
            .select();

        if (reviewError) throw reviewError;
        console.log(`✅ Seeded ${reviewData.length} reviews\n`);

        // 6. Seed Follows
        console.log('👥 Seeding follows...');
        const follows = [
            {
                follower_id: userMap['sumitra_debi'].id,
                following_id: userMap['rafiqul_islam'].id
            },
            {
                follower_id: userMap['mahmud_haque'].id,
                following_id: userMap['rafiqul_islam'].id
            },
            {
                follower_id: userMap['rafiqul_islam'].id,
                following_id: userMap['sumitra_debi'].id
            },
            {
                follower_id: userMap['nasir_uddin'].id,
                following_id: userMap['mahmud_haque'].id
            }
        ];

        const { data: followData, error: followError } = await supabase
            .from('follows')
            .upsert(follows, { onConflict: 'follower_id,following_id' })
            .select();

        if (followError) throw followError;
        console.log(`✅ Seeded ${followData.length} follows\n`);

        // 7. Seed Reading Progress
        console.log('📖 Seeding reading progress...');
        const readingProgress = [
            {
                user_id: userMap['sumitra_debi'].id,
                content_id: contentData.find(c => c.slug === 'rater-nishobdota').id,
                progress_percentage: 75.50,
                last_position: JSON.stringify({ scrollTop: 1500 }),
                completed: false
            },
            {
                user_id: userMap['mahmud_haque'].id,
                content_id: contentData.find(c => c.slug === 'ontoraler-golpo').id,
                progress_percentage: 100.00,
                last_position: JSON.stringify({ scrollTop: 0 }),
                completed: true
            }
        ];

        const { data: progressData, error: progressError } = await supabase
            .from('reading_progress')
            .upsert(readingProgress, { onConflict: 'user_id,content_id' })
            .select();

        if (progressError) throw progressError;
        console.log(`✅ Seeded ${progressData.length} reading progress entries\n`);

        // 8. Seed Reading Preferences
        console.log('⚙️ Seeding reading preferences...');
        const preferences = userData.map(user => ({
            user_id: user.id,
            theme: 'light',
            font_size: 'medium',
            font_family: 'Kalpurush',
            line_height: 'normal'
        }));

        const { data: prefData, error: prefError } = await supabase
            .from('reading_preferences')
            .upsert(preferences, { onConflict: 'user_id' })
            .select();

        if (prefError) throw prefError;
        console.log(`✅ Seeded ${prefData.length} reading preferences\n`);

        console.log('✨ Database seeding completed successfully!\n');
        console.log('📊 Summary:');
        console.log(`   - Categories: ${categoryData.length}`);
        console.log(`   - Users: ${userData.length}`);
        console.log(`   - Series: ${seriesData.length}`);
        console.log(`   - Content: ${contentData.length}`);
        console.log(`   - Reviews: ${reviewData.length}`);
        console.log(`   - Follows: ${followData.length}`);
        console.log(`   - Reading Progress: ${progressData.length}`);
        console.log(`   - Reading Preferences: ${prefData.length}`);
        console.log('\n🔑 Test Credentials:');
        console.log('   Admin: admin@protiddhoni.com / password123');
        console.log('   User: rafiq@example.com / password123');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    seedDatabase()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

export default seedDatabase;
