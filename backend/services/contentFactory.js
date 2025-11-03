/**
 * Design Pattern: Factory
 */

class Content {
    constructor(data) {
        this.title = data.title;
        this.body = data.body;
        this.author_id = data.author_id;
        this.category_id = data.category_id;
    }

    validate() {
        if (!this.title || !this.body) {
            throw new Error('Title and body are required');
        }
    }
}

class Story extends Content {
    constructor(data) {
        super(data);
        this.content_type = 'story';
        this.excerpt = data.excerpt;
        this.cover_image_url = data.cover_image_url;
    }
}

class Poem extends Content {
    constructor(data) {
        super(data);
        this.content_type = 'poem';
    }
}

class Chapter extends Content {
    constructor(data) {
        super(data);
        this.content_type = 'chapter';
        this.series_id = data.series_id;
        this.chapter_number = data.chapter_number;
    }

    validate() {
        super.validate();
        if (!this.series_id || !this.chapter_number) {
            throw new Error('Series ID and chapter number are required');
        }
    }
}

class ContentFactory {
    static createContent(type, data) {
        switch (type) {
            case 'story':
                return new Story(data);
            case 'poem':
                return new Poem(data);
            case 'chapter':
                return new Chapter(data);
            default:
                throw new Error(`Unknown content type: ${type}`);
        }
    }
}

module.exports = ContentFactory;
