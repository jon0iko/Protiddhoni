/**
 * User Model
 * Represents user data structure
 */
class User {
    id: string;
    email: string;
    username: string;
    full_name: string;
    is_admin: boolean;

    constructor(data: any) {
        this.id = data.id;
        this.email = data.email;
        this.username = data.username;
        this.full_name = data.full_name;
        this.is_admin = data.is_admin || false;
    }
}

export default User;
