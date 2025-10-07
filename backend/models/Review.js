/**
 * Review Model
 * Represents user review/rating for content
 */

// TODO: Define review model structure
class Review {
    constructor(data) {
        this.id = data.id;
        this.content_id = data.content_id;
        this.user_id = data.user_id;
        this.rating = data.rating;
    }
}

module.exports = Review;
