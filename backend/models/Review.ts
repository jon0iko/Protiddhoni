/**
 * Review Model
 * Represents user review/rating for content
 */
class Review {
    id: string;
    content_id: string;
    user_id: string;
    rating: number;

    constructor(data: any) {
        this.id = data.id;
        this.content_id = data.content_id;
        this.user_id = data.user_id;
        this.rating = data.rating;
    }
}

export default Review;
