/**
 * Unit Tests for ContentFactory (Factory Pattern)
 * Tests the dynamic creation of different content types
 */

import ContentFactory from '../../services/contentFactory';

describe('ContentFactory - Factory Pattern', () => {
    
    describe('Story Creation', () => {
        test('should create a Story object with correct properties', () => {
            const storyData = {
                title: 'অদ্ভুত এক গল্প',
                body: 'এক অদ্ভুত গল্পের শুরু...',
                author_id: 'author-123',
                category_id: 'category-456',
                excerpt: 'একটি রহস্যময় গল্প',
                cover_image_url: 'https://example.com/cover.jpg'
            };

            const story = ContentFactory.createContent('story', storyData);

            expect(story).toBeDefined();
            expect(story.content_type).toBe('story');
            expect(story.title).toBe('অদ্ভুত এক গল্প');
            expect(story.excerpt).toBe('একটি রহস্যময় গল্প');
            expect(story.cover_image_url).toBe('https://example.com/cover.jpg');
        });

        test('should validate Story object', () => {
            const storyData = {
                title: 'Test Story',
                body: 'Test content',
                author_id: 'author-123',
                category_id: 'category-456'
            };

            const story = ContentFactory.createContent('story', storyData);
            
            expect(() => story.validate()).not.toThrow();
        });

        test('should throw error for invalid Story data', () => {
            const invalidData = {
                author_id: 'author-123'
                // Missing title and body
            };

            const story = ContentFactory.createContent('story', invalidData);
            
            expect(() => story.validate()).toThrow('Title and body are required');
        });
    });

    describe('Poem Creation', () => {
        test('should create a Poem object with correct properties', () => {
            const poemData = {
                title: 'আকাশের কবিতা',
                body: 'আকাশে মেঘের ভেলা\nভাসে দিনরাতি খেলা...',
                author_id: 'author-789',
                category_id: 'category-poetry'
            };

            const poem = ContentFactory.createContent('poem', poemData);

            expect(poem).toBeDefined();
            expect(poem.content_type).toBe('poem');
            expect(poem.title).toBe('আকাশের কবিতা');
            expect(poem.body).toContain('আকাশে মেঘের ভেলা');
        });

        test('should validate Poem object', () => {
            const poemData = {
                title: 'Test Poem',
                body: 'Test verses',
                author_id: 'author-789',
                category_id: 'category-poetry'
            };

            const poem = ContentFactory.createContent('poem', poemData);
            
            expect(() => poem.validate()).not.toThrow();
        });
    });

    describe('Chapter Creation', () => {
        test('should create a Chapter object with series information', () => {
            const chapterData = {
                title: 'অধ্যায় ১: শুরু',
                body: 'প্রথম অধ্যায়ের বিষয়বস্তু...',
                author_id: 'author-123',
                category_id: 'category-456',
                series_id: 'series-789',
                chapter_number: 1
            };

            const chapter = ContentFactory.createContent('chapter', chapterData);

            expect(chapter).toBeDefined();
            expect(chapter.content_type).toBe('chapter');
            expect(chapter.series_id).toBe('series-789');
            expect(chapter.chapter_number).toBe(1);
        });

        test('should validate Chapter requires series_id and chapter_number', () => {
            const invalidChapterData = {
                title: 'Test Chapter',
                body: 'Test content',
                author_id: 'author-123',
                category_id: 'category-456'
                // Missing series_id and chapter_number
            };

            const chapter = ContentFactory.createContent('chapter', invalidChapterData);
            
            expect(() => chapter.validate()).toThrow('Series ID and chapter number are required');
        });

        test('should validate complete Chapter data', () => {
            const validChapterData = {
                title: 'অধ্যায় ২',
                body: 'দ্বিতীয় অধ্যায়',
                author_id: 'author-123',
                category_id: 'category-456',
                series_id: 'series-789',
                chapter_number: 2
            };

            const chapter = ContentFactory.createContent('chapter', validChapterData);
            
            expect(() => chapter.validate()).not.toThrow();
        });
    });

    describe('Factory Pattern Verification', () => {
        test('should throw error for unknown content type', () => {
            const unknownData = {
                title: 'Test',
                body: 'Test',
                author_id: 'author-123'
            };

            expect(() => {
                ContentFactory.createContent('unknown-type', unknownData);
            }).toThrow('Unknown content type: unknown-type');
        });

        test('should create different object types based on input', () => {
            const storyData = { 
                title: 'Story', 
                body: 'Content', 
                author_id: 'a1', 
                category_id: 'c1' 
            };
            const poemData = { 
                title: 'Poem', 
                body: 'Verses', 
                author_id: 'a2', 
                category_id: 'c2' 
            };
            const chapterData = { 
                title: 'Chapter', 
                body: 'Text', 
                author_id: 'a3', 
                category_id: 'c3',
                series_id: 's1',
                chapter_number: 1
            };

            const story = ContentFactory.createContent('story', storyData);
            const poem = ContentFactory.createContent('poem', poemData);
            const chapter = ContentFactory.createContent('chapter', chapterData);

            expect(story.content_type).toBe('story');
            expect(poem.content_type).toBe('poem');
            expect(chapter.content_type).toBe('chapter');
        });

        test('Factory should encapsulate object creation logic', () => {
            // Verify factory method exists and is static
            expect(typeof ContentFactory.createContent).toBe('function');
            
            // Verify factory returns different types
            const types = ['story', 'poem', 'chapter'];
            types.forEach(type => {
                const data = {
                    title: `Test ${type}`,
                    body: 'Test content',
                    author_id: 'author-test',
                    category_id: 'category-test',
                    ...(type === 'chapter' && { 
                        series_id: 'series-test', 
                        chapter_number: 1 
                    })
                };
                
                const content = ContentFactory.createContent(type, data);
                expect(content.content_type).toBe(type);
            });
        });
    });

    describe('Content Type Polymorphism', () => {
        test('all content types should have common interface', () => {
            const commonData = {
                title: 'Test',
                body: 'Test content',
                author_id: 'author-123',
                category_id: 'category-456'
            };

            const story = ContentFactory.createContent('story', commonData);
            const poem = ContentFactory.createContent('poem', commonData);
            const chapter = ContentFactory.createContent('chapter', {
                ...commonData,
                series_id: 'series-123',
                chapter_number: 1
            });

            // All should have validate method
            expect(typeof story.validate).toBe('function');
            expect(typeof poem.validate).toBe('function');
            expect(typeof chapter.validate).toBe('function');

            // All should have common properties
            expect(story.title).toBeDefined();
            expect(poem.title).toBeDefined();
            expect(chapter.title).toBeDefined();
        });
    });
});
