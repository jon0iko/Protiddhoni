/**
 * Reading Preferences Repository
 * Handles reading preferences database operations
 */

const db = require('../config/database');

class ReadingPreferencesRepository {
    async findByUser(userId) {
        const { data, error } = await db.getClient()
            .from('reading_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data;
    }

    async createOrUpdate(userId, preferences) {
        // Check if preferences exist
        const existing = await this.findByUser(userId);
        
        if (existing) {
            // Update existing preferences
            const { data, error } = await db.getClient()
                .from('reading_preferences')
                .update({ ...preferences, updated_at: new Date().toISOString() })
                .eq('user_id', userId)
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } else {
            // Create new preferences
            const { data, error } = await db.getClient()
                .from('reading_preferences')
                .insert({ user_id: userId, ...preferences })
                .select()
                .single();
            
            if (error) throw error;
            return data;
        }
    }
}

module.exports = new ReadingPreferencesRepository();
