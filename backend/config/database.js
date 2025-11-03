const { createClient } = require('@supabase/supabase-js');

/**
 * Design Pattern: Singleton
 */
class DatabaseConnection {
    constructor() {
        // Check if instance already exists
        if (DatabaseConnection.instance) {
            return DatabaseConnection.instance;
        }

        // Validate required environment variables
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
            throw new Error(
                'Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set'
            );
        }

        // Create Supabase client with service role key for backend operations
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        // Store instance
        DatabaseConnection.instance = this;
        
        console.log('✅ Database connection initialized (Singleton)');
    }

    /**
     * Get the Supabase client instance
     * @returns {SupabaseClient} Supabase client
     */
    getClient() {
        return this.supabase;
    }

    /**
     * Test database connection
     * @returns {Promise<boolean>} Connection status
     */
    async testConnection() {
        try {
            const { data, error } = await this.supabase
                .from('users')
                .select('count')
                .limit(1);
            
            if (error) {
                console.error('❌ Database connection test failed:', error.message);
                return false;
            }
            
            console.log('✅ Database connection test successful');
            return true;
        } catch (error) {
            console.error('❌ Database connection error:', error.message);
            return false;
        }
    }
}

// Create and export single instance
const instance = new DatabaseConnection();
Object.freeze(instance); // Prevent modifications to the instance

module.exports = instance;
