/**
 * Design Pattern: Repository
 */

const db = require('../config/database');

class UserRepository {
    async create(userData) {
        // TODO: Implement user creation
        const { data, error } = await db.getClient()
            .from('users')
            .insert(userData)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async findById(id) {
        // TODO: Implement find by ID
        const { data, error } = await db.getClient()
            .from('users')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return data;
    }

    async findByEmail(email) {
        // TODO: Implement find by email
        const { data, error } = await db.getClient()
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        
        if (error) return null;
        return data;
    }

    async findByUsername(username) {
        // TODO: Implement find by username
        const { data, error } = await db.getClient()
            .from('users')
            .select('*')
            .eq('username', username)
            .single();
        
        if (error) return null;
        return data;
    }

    async update(id, updates) {
        // TODO: Implement update
        const { data, error } = await db.getClient()
            .from('users')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async delete(id) {
        // TODO: Implement delete
        const { error } = await db.getClient()
            .from('users')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    }
}

module.exports = new UserRepository();
