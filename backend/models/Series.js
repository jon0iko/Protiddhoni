/**
 * Series Model
 * Represents a series of chapters
 */

// TODO: Define series model structure
class Series {
    constructor(data) {
        this.id = data.id;
        this.title = data.title;
        this.total_chapters = data.total_chapters || 0;
    }
}

module.exports = Series;
