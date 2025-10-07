/**
 * Content Model
 * Represents content (story, poem, chapter) data structure
 */

// TODO: Define content model structure
class Content {
    constructor(data) {
        this.id = data.id;
        this.title = data.title;
        this.content_type = data.content_type;
        this.status = data.status || 'draft';
    }
}

module.exports = Content;
