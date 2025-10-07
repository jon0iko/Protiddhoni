/**
 * User Model
 * Represents user data structure
 */

// TODO: Define user model structure
class User {
    constructor(data) {
        this.id = data.id;
        this.email = data.email;
        this.username = data.username;
        this.full_name = data.full_name;
        this.is_admin = data.is_admin || false;
    }
}

module.exports = User;
