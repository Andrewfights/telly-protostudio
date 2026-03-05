import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';

const router = Router();

// List all zone templates with optional zone filter
router.get('/', (req: Request, res: Response) => {
  try {
    const zoneId = req.query.zoneId as string;
    const search = req.query.search as string;

    let query = `SELECT * FROM zone_templates WHERE 1=1`;
    const params: any[] = [];

    if (zoneId) {
      query += ` AND zone_id = ?`;
      params.push(zoneId);
    }

    if (search) {
      query += ` AND (name LIKE ? OR description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY updated_at DESC`;

    const rows = db.prepare(query).all(...params) as any[];

    const data = rows.map(row => ({
      id: row.id,
      name: row.name,
      zoneId: row.zone_id,
      content: row.content,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json({ data });
  } catch (error) {
    console.error('Error listing zone templates:', error);
    res.status(500).json({ error: { code: 'LIST_ERROR', message: 'Failed to list zone templates' } });
  }
});

// Get templates for a specific zone
router.get('/zone/:zoneId', (req: Request, res: Response) => {
  try {
    const { zoneId } = req.params;

    const rows = db.prepare(`
      SELECT * FROM zone_templates
      WHERE zone_id = ?
      ORDER BY updated_at DESC
    `).all(zoneId) as any[];

    const data = rows.map(row => ({
      id: row.id,
      name: row.name,
      zoneId: row.zone_id,
      content: row.content,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json({ data });
  } catch (error) {
    console.error('Error listing zone templates:', error);
    res.status(500).json({ error: { code: 'LIST_ERROR', message: 'Failed to list zone templates' } });
  }
});

// Get single zone template
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const row = db.prepare(`SELECT * FROM zone_templates WHERE id = ?`).get(id) as any;

    if (!row) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Zone template not found' } });
    }

    res.json({
      data: {
        id: row.id,
        name: row.name,
        zoneId: row.zone_id,
        content: row.content,
        description: row.description,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    });
  } catch (error) {
    console.error('Error getting zone template:', error);
    res.status(500).json({ error: { code: 'GET_ERROR', message: 'Failed to get zone template' } });
  }
});

// Create zone template
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, zoneId, content, description } = req.body;

    if (!name || !zoneId || !content) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Name, zoneId, and content are required' }
      });
    }

    const validZones = ['A', 'B', 'C', 'D', 'E', 'F'];
    if (!validZones.includes(zoneId)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid zoneId' }
      });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO zone_templates (id, name, zone_id, content, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, zoneId, content, description || null, now, now);

    res.status(201).json({
      data: {
        id,
        name,
        zoneId,
        content,
        description,
        createdAt: now,
        updatedAt: now
      }
    });
  } catch (error) {
    console.error('Error creating zone template:', error);
    res.status(500).json({ error: { code: 'CREATE_ERROR', message: 'Failed to create zone template' } });
  }
});

// Update zone template
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, content, description } = req.body;

    const existing = db.prepare('SELECT id FROM zone_templates WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Zone template not found' } });
    }

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE zone_templates
      SET name = COALESCE(?, name),
          content = COALESCE(?, content),
          description = COALESCE(?, description),
          updated_at = ?
      WHERE id = ?
    `).run(
      name || null,
      content || null,
      description !== undefined ? description : null,
      now,
      id
    );

    const row = db.prepare(`SELECT * FROM zone_templates WHERE id = ?`).get(id) as any;

    res.json({
      data: {
        id: row.id,
        name: row.name,
        zoneId: row.zone_id,
        content: row.content,
        description: row.description,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating zone template:', error);
    res.status(500).json({ error: { code: 'UPDATE_ERROR', message: 'Failed to update zone template' } });
  }
});

// Delete zone template
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = db.prepare('DELETE FROM zone_templates WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Zone template not found' } });
    }

    res.json({ data: { success: true } });
  } catch (error) {
    console.error('Error deleting zone template:', error);
    res.status(500).json({ error: { code: 'DELETE_ERROR', message: 'Failed to delete zone template' } });
  }
});

export default router;
