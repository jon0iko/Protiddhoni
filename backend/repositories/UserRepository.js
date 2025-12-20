/**
 * Design Pattern: Repository
 * Abstract data access layer for users
 */

const db = require('../config/database');

class UserRepository {
    async create(userData) {
        const { data, error } = await db.getClient()
            .from('users')
            .insert(userData)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async findById(id) {
        const { data, error } = await db.getClient()
            .from('users')
            .select('id, email, username, full_name, bio, profile_picture_url, is_admin, is_verified, created_at, updated_at')
            .eq('id', id)
            .single();
        
        if (error) return null;
        return data;
    }

    async findByEmail(email) {
        const { data, error } = await db.getClient()
            .from('users')
            .select('id, email, username, full_name, bio, profile_picture_url, is_admin, is_verified, created_at, updated_at')
            .eq('email', email)
            .single();
        
        if (error) return null;
        return data;
    }

    async findByEmailWithPassword(email) {
        const { data, error } = await db.getClient()
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        
        if (error) return null;
        return data;
    }

    async findByUsername(username) {
        console.log('UserRepository.findByUsername called with:', username);
        const { data, error } = await db.getClient()
            .from('users')
            .select('id, email, username, full_name, bio, profile_picture_url, is_admin, is_verified, created_at, updated_at')
            .eq('username', username)
            .single();
        
        if (error) {
            console.log('Error finding user by username:', error);
            return null;
        }
        console.log('User found:', data);
        return data;
    }

    async findByUsernameWithPassword(username) {
        const { data, error } = await db.getClient()
            .from('users')
            .select('*')
            .eq('username', username)
            .single();
        
        if (error) return null;
        return data;
    }

    async update(id, updates) {
        const { data, error } = await db.getClient()
            .from('users')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select('id, email, username, full_name, bio, profile_picture_url, is_admin, is_verified, created_at, updated_at')
            .single();
        
        if (error) throw error;
        return data;
    }

    async delete(id) {
        const { error } = await db.getClient()
            .from('users')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    }

    async getUserStats(userId) {
        // Get content count
        const { count: contentCount } = await db.getClient()
            .from('content')
            .select('*', { count: 'exact', head: true })
            .eq('author_id', userId)
            .eq('is_published', true);

        // Get follower count
        const { count: followerCount } = await db.getClient()
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', userId);

        // Get following count
        const { count: followingCount } = await db.getClient()
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', userId);

        return {
            contentCount: contentCount || 0,
            followerCount: followerCount || 0,
            followingCount: followingCount || 0
        };
    }

    async getFollowers(userId) {
        const { data, error } = await db.getClient()
            .from('follows')
            .select(`
                follower:follower_id (
                    id, username, full_name, profile_picture_url, bio
                )
            `)
            .eq('following_id', userId);

        if (error) throw error;
        return data.map(f => f.follower);
    }

    async getFollowing(userId) {
        const { data, error } = await db.getClient()
            .from('follows')
            .select(`
                following:following_id (
                    id, username, full_name, profile_picture_url, bio
                )
            `)
            .eq('follower_id', userId);

        if (error) throw error;
        return data.map(f => f.following);
    }

    async isFollowing(followerId, followingId) {
        const { data, error } = await db.getClient()
            .from('follows')
            .select('id')
            .eq('follower_id', followerId)
            .eq('following_id', followingId)
            .single();

        return !!data;
    }

    async follow(followerId, followingId) {
        const { data, error } = await db.getClient()
            .from('follows')
            .insert({ follower_id: followerId, following_id: followingId })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async unfollow(followerId, followingId) {
        const { error } = await db.getClient()
            .from('follows')
            .delete()
            .eq('follower_id', followerId)
            .eq('following_id', followingId);

        if (error) throw error;
        return true;
    }
}

module.exports = new UserRepository();
