import { Router, Request, Response } from 'express';
import db from '../db/database.js';

const router = Router();

// List all favorites
router.get('/', (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const offset = (page - 1) * pageSize;

    const totalResult = db.prepare(`
      SELECT COUNT(*) as total
      FROM favorites f
      JOIN prototypes p ON f.prototype_id = p.id
      WHERE p.is_deleted = 0
    `).get() as { total: number };
    const total = totalResult.total;

    const rows = db.prepare(`
      SELECT p.*, f.favorited_at
      FROM favorites f
      JOIN prototypes p ON f.prototype_id = p.id
      WHERE p.is_deleted = 0
      ORDER BY f.favorited_at DESC
      LIMIT ? OFFSET ?
    `).all(pageSize, offset) as any[];

    const data = rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      zoneContent: JSON.parse(row.zone_content),
      thumbnail: row.thumbnail,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isFavorite: true,
      favoritedAt: row.favorited_at
    }));

    res.json({
      data,
      pagination: {
        total,
        page,
        pageSize,
        hasMore: offset + rows.length < total
      }
    });
  } catch (error) {
    console.error('Error listing favorites:', error);
    res.status(500).json({ error: { code: 'LIST_ERROR', message: 'Failed to list favorites' } });
  }
});

// Add to favorites
router.post('/:prototypeId', (req: Request, res: Response) => {
  try {
    const { prototypeId } = req.params;

    // Check if prototype exists
    const prototype = db.prepare('SELECT id FROM prototypes WHERE id = ? AND is_deleted = 0').get(prototypeId);
    if (!prototype) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Prototype not found' } });
    }

    // Check if already favorited
    const existing = db.prepare('SELECT id FROM favorites WHERE prototype_id = ?').get(prototypeId);
    if (existing) {
      return res.status(409).json({ error: { code: 'ALREADY_EXISTS', message: 'Already in favorites' } });
    }

    const now = new Date().toISOString();
    db.prepare('INSERT INTO favorites (prototype_id, favorited_at) VALUES (?, ?)').run(prototypeId, now);

    res.status(201).json({ data: { success: true, favoritedAt: now } });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({ error: { code: 'ADD_ERROR', message: 'Failed to add to favorites' } });
  }
});

// Remove from favorites
router.delete('/:prototypeId', (req: Request, res: Response) => {
  try {
    const { prototypeId } = req.params;

    const result = db.prepare('DELETE FROM favorites WHERE prototype_id = ?').run(prototypeId);

    if (result.changes === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not in favorites' } });
    }

    res.json({ data: { success: true } });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({ error: { code: 'REMOVE_ERROR', message: 'Failed to remove from favorites' } });
  }
});

export default router;
