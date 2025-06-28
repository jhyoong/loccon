import { Router, Request, Response } from 'express';
import { ContextManager } from '../../core/context';
import { parseCategories } from '../../utils/common';

export function createAPIRoutes(contextManager: ContextManager): Router {
  const router = Router();

  // GET /api/contexts - List all contexts with metadata
  router.get('/contexts', async (req: Request, res: Response) => {
    try {
      const contexts = await contextManager.getAll();
      res.json(contexts);
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // GET /api/contexts/:tag - Get specific context
  router.get('/contexts/:tag', async (req: Request, res: Response) => {
    try {
      const { tag } = req.params;
      const context = await contextManager.read(tag);
      
      if (!context) {
        return res.status(404).json({ error: `Context '${tag}' not found` });
      }
      
      res.json({ [tag]: context });
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // POST /api/contexts - Add new context
  router.post('/contexts', async (req: Request, res: Response) => {
    try {
      const { tag, content, categories } = req.body;
      
      if (!tag || !content) {
        return res.status(400).json({ error: 'Tag and content are required' });
      }

      const parsedCategories = typeof categories === 'string' 
        ? parseCategories(categories) 
        : Array.isArray(categories) ? categories : [];

      await contextManager.add(tag, content, parsedCategories);
      res.status(201).json({ message: `Context '${tag}' created successfully` });
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // PUT /api/contexts/:tag - Update existing context
  router.put('/contexts/:tag', async (req: Request, res: Response) => {
    try {
      const { tag } = req.params;
      const { content, categories } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: 'Content is required' });
      }

      const parsedCategories = typeof categories === 'string' 
        ? parseCategories(categories) 
        : Array.isArray(categories) ? categories : [];

      await contextManager.update(tag, content, parsedCategories);
      res.json({ message: `Context '${tag}' updated successfully` });
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // DELETE /api/contexts/:tag - Remove context
  router.delete('/contexts/:tag', async (req: Request, res: Response) => {
    try {
      const { tag } = req.params;
      const removed = await contextManager.remove(tag);
      
      if (!removed) {
        return res.status(404).json({ error: `Context '${tag}' not found` });
      }
      
      res.json({ message: `Context '${tag}' removed successfully` });
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // GET /api/search?q=query - Search contexts
  router.get('/search', async (req: Request, res: Response) => {
    try {
      const { q: query, fuzzy } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Query parameter is required' });
      }

      const useFuzzy = fuzzy === 'true' || fuzzy === '1';
      const results = await contextManager.search(query, useFuzzy);
      res.json(results);
    } catch (error) {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  return router;
}