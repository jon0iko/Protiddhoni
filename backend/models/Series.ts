/**
 * Series Model
 * Represents a series of chapters
 */
class Series {
    id: string;
    title: string;
    total_chapters: number;

    constructor(data: any) {
        this.id = data.id;
        this.title = data.title;
        this.total_chapters = data.total_chapters || 0;
    }
}

export default Series;
