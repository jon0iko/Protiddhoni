import type { Request, Response, NextFunction } from 'express';
/**
 * Category Controller
 * Handles category operations
 */

import CategoryRepository from '../repositories/CategoryRepository';
import ContentRepository from '../repositories/ContentRepository';
import cacheManager from '../services/cacheManager';
import slugify from '../utils/slugify';
import { updateSlugFromTitle } from '../utils/slugify';

// Namespace for every cached category entry, so a single deleteByPrefix flushes
// them all when categories change.
const CATEGORY_CACHE_PREFIX = 'categories:';

export const getAll = async (req: Request, res: Response) => {
    try {
        const includeCount = req.query.includeCount === 'true';
        const cacheKey = `${CATEGORY_CACHE_PREFIX}all:count=${includeCount}`;

        // Categories are a small, near-static, non-personalized list requested on
        // almost every page (nav/showcase). Cache for 5 min; writes invalidate it.
        const categories = await cacheManager.getOrSet(cacheKey, 300, async () => {
            const rows = await CategoryRepository.findAll();

            // Optionally include content count for each category. Counts are
            // fetched concurrently (not sequentially) so N categories cost one
            // round-trip of latency instead of N.
            if (includeCount) {
                const counts = await Promise.all(
                    rows.map(category => CategoryRepository.getContentCount(category.id))
                );
                rows.forEach((category, i) => {
                    category.contentCount = counts[i];
                });
            }

            return rows;
        });

        res.json({ success: true, data: categories, count: categories.length });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getBySlug = async (req: Request, res: Response) => {
    try {
        const category = await CategoryRepository.findBySlug(req.params.slug);
        
        if (!category) {
            return res.status(404).json({ success: false, error: 'Category not found' });
        }

        // Get content count
        category.contentCount = await CategoryRepository.getContentCount(category.id);

        res.json({ success: true, data: category });
    } catch (error) {
        console.error('Get category error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getContent = async (req: Request, res: Response) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
        const contents = await ContentRepository.findByCategory(req.params.slug, limit);
        
        res.json({ success: true, data: contents, count: contents.length });
    } catch (error) {
        console.error('Get category content error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const create = async (req: Request, res: Response) => {
    try {
        const { name, description, icon } = req.body;

        // Validation
        if (!name || name.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Category name is required' });
        }

        if (name.length > 100) {
            return res.status(400).json({ success: false, error: 'Category name must be 100 characters or less' });
        }

        // Generate slug from name
        const slug = slugify(name);

        // Check if category with this name already exists (prevent duplicates)
        const allCategories = await CategoryRepository.findAll();
        const existing = allCategories.find(cat => cat.name.toLowerCase() === name.toLowerCase());
        if (existing) {
            return res.status(409).json({ success: false, error: 'A category with this name already exists' });
        }

        // Create category
        const categoryData = {
            name: name.trim(),
            slug,
            description: description?.trim() || null,
            icon: icon?.trim() || null,
        };

        const category = await CategoryRepository.create(categoryData);

        // New category must appear immediately in the cached list.
        cacheManager.deleteByPrefix(CATEGORY_CACHE_PREFIX);

        res.status(201).json({ success: true, data: category });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const deleteHandler = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Check if category exists
        const category = await CategoryRepository.findById(id);
        if (!category) {
            return res.status(404).json({ success: false, error: 'Category not found' });
        }

        // Check if category has content
        const contentCount = await CategoryRepository.getContentCount(id);
        if (contentCount > 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Cannot delete category with existing content' 
            });
        }

        // Delete category
        await CategoryRepository.delete(id);

        // Removed category must disappear immediately from the cached list.
        cacheManager.deleteByPrefix(CATEGORY_CACHE_PREFIX);

        res.json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export { deleteHandler as delete };
