import { ContentStatus } from '../types';

/**
 * Content Model
 * Represents content (story, poem, chapter) data structure
 */
class Content {
    id: string;
    title: string;
    content_type: string;
    status: ContentStatus;

    constructor(data: any) {
        this.id = data.id;
        this.title = data.title;
        this.content_type = data.content_type;
        this.status = data.status || 'draft';
    }
}

export default Content;
