import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';

const router = Router();

// List all prototypes with pagination and filters
router.get('/', (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const sort = (req.query.sort as string) || 'updated_at';
    const order = (req.query.order as string) || 'desc';
    const search = req.query.search as string;
    const favoritesOnly = req.query.favoritesOnly === 'true';

    const offset = (page - 1) * pageSize;

    let query = `
      SELECT p.*,
             CASE WHEN f.prototype_id IS NOT NULL THEN 1 ELSE 0 END as is_favorite
      FROM prototypes p
      LEFT JOIN favorites f ON p.id = f.prototype_id
      WHERE p.is_deleted = 0
    `;
    const params: any[] = [];

    if (search) {
      query += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (favoritesOnly) {
      query += ` AND f.prototype_id IS NOT NULL`;
    }

    // Count total - build a separate count query
    let countQuery = `
      SELECT COUNT(*) as total
      FROM prototypes p
      LEFT JOIN favorites f ON p.id = f.prototype_id
      WHERE p.is_deleted = 0
    `;
    if (search) {
      countQuery += ` AND (p.name LIKE ? OR p.description LIKE ?)`;
    }
    if (favoritesOnly) {
      countQuery += ` AND f.prototype_id IS NOT NULL`;
    }
    const totalResult = db.prepare(countQuery).get(...params) as { total: number } | undefined;
    const total = totalResult?.total || 0;

    // Add sorting and pagination
    const validSortFields = ['name', 'created_at', 'updated_at'];
    const sortField = validSortFields.includes(sort) ? sort : 'updated_at';
    const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    query += ` ORDER BY p.${sortField} ${sortOrder} LIMIT ? OFFSET ?`;
    params.push(pageSize, offset);

    const rows = db.prepare(query).all(...params) as any[];

    const data = rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      zoneContent: JSON.parse(row.zone_content),
      ledSettings: row.led_settings ? JSON.parse(row.led_settings) : null,
      thumbnail: row.thumbnail,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      currentVersion: row.current_version || 1,
      totalVersions: row.total_versions || 1,
      isFavorite: row.is_favorite === 1
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
    console.error('Error listing prototypes:', error);
    res.status(500).json({ error: { code: 'LIST_ERROR', message: 'Failed to list prototypes' } });
  }
});

// Get single prototype
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const row = db.prepare(`
      SELECT p.*,
             CASE WHEN f.prototype_id IS NOT NULL THEN 1 ELSE 0 END as is_favorite
      FROM prototypes p
      LEFT JOIN favorites f ON p.id = f.prototype_id
      WHERE p.id = ? AND p.is_deleted = 0
    `).get(id) as any;

    if (!row) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Prototype not found' } });
    }

    res.json({
      data: {
        id: row.id,
        name: row.name,
        description: row.description,
        zoneContent: JSON.parse(row.zone_content),
        ledSettings: row.led_settings ? JSON.parse(row.led_settings) : null,
        thumbnail: row.thumbnail,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        currentVersion: row.current_version || 1,
        totalVersions: row.total_versions || 1,
        isFavorite: row.is_favorite === 1
      }
    });
  } catch (error) {
    console.error('Error getting prototype:', error);
    res.status(500).json({ error: { code: 'GET_ERROR', message: 'Failed to get prototype' } });
  }
});

// Create prototype
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, description, zoneContent, ledSettings, thumbnail, commitMessage } = req.body;

    if (!name || !zoneContent) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Name and zoneContent are required' }
      });
    }

    const id = uuidv4();
    const versionId = uuidv4();
    const now = new Date().toISOString();

    // Create the prototype
    db.prepare(`
      INSERT INTO prototypes (id, name, description, zone_content, led_settings, thumbnail, created_at, updated_at, current_version, total_versions)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
    `).run(
      id,
      name,
      description || null,
      JSON.stringify(zoneContent),
      ledSettings ? JSON.stringify(ledSettings) : null,
      thumbnail || null,
      now,
      now
    );

    // Create initial version (version 1)
    db.prepare(`
      INSERT INTO prototype_versions (id, prototype_id, version_number, name, description, zone_content, led_settings, thumbnail, commit_message, created_at)
      VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      versionId,
      id,
      name,
      description || null,
      JSON.stringify(zoneContent),
      ledSettings ? JSON.stringify(ledSettings) : null,
      thumbnail || null,
      commitMessage || 'Initial version',
      now
    );

    res.status(201).json({
      data: {
        id,
        name,
        description,
        zoneContent,
        ledSettings: ledSettings || null,
        thumbnail,
        createdAt: now,
        updatedAt: now,
        currentVersion: 1,
        totalVersions: 1,
        isFavorite: false
      }
    });
  } catch (error) {
    console.error('Error creating prototype:', error);
    res.status(500).json({ error: { code: 'CREATE_ERROR', message: 'Failed to create prototype' } });
  }
});

// Update prototype
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, zoneContent, ledSettings, thumbnail, createVersion, commitMessage } = req.body;

    const existing = db.prepare('SELECT * FROM prototypes WHERE id = ? AND is_deleted = 0').get(id) as any;
    if (!existing) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Prototype not found' } });
    }

    const now = new Date().toISOString();

    // Update the prototype
    db.prepare(`
      UPDATE prototypes
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          zone_content = COALESCE(?, zone_content),
          led_settings = COALESCE(?, led_settings),
          thumbnail = COALESCE(?, thumbnail),
          updated_at = ?
      WHERE id = ?
    `).run(
      name || null,
      description !== undefined ? description : null,
      zoneContent ? JSON.stringify(zoneContent) : null,
      ledSettings !== undefined ? (ledSettings ? JSON.stringify(ledSettings) : null) : null,
      thumbnail !== undefined ? thumbnail : null,
      now,
      id
    );

    // If createVersion is true, create a new version snapshot
    if (createVersion) {
      const currentVersion = existing.total_versions || 1;
      const newVersion = currentVersion + 1;
      const versionId = uuidv4();

      // Get the updated prototype data
      const updated = db.prepare('SELECT * FROM prototypes WHERE id = ?').get(id) as any;

      db.prepare(`
        INSERT INTO prototype_versions (id, prototype_id, version_number, name, description, zone_content, led_settings, thumbnail, commit_message, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        versionId,
        id,
        newVersion,
        updated.name,
        updated.description,
        updated.zone_content,
        updated.led_settings,
        updated.thumbnail,
        commitMessage || null,
        now
      );

      // Update version tracking
      db.prepare(`
        UPDATE prototypes SET current_version = ?, total_versions = ? WHERE id = ?
      `).run(newVersion, newVersion, id);
    }

    // Fetch updated record
    const row = db.prepare(`
      SELECT p.*,
             CASE WHEN f.prototype_id IS NOT NULL THEN 1 ELSE 0 END as is_favorite
      FROM prototypes p
      LEFT JOIN favorites f ON p.id = f.prototype_id
      WHERE p.id = ?
    `).get(id) as any;

    res.json({
      data: {
        id: row.id,
        name: row.name,
        description: row.description,
        zoneContent: JSON.parse(row.zone_content),
        ledSettings: row.led_settings ? JSON.parse(row.led_settings) : null,
        thumbnail: row.thumbnail,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        currentVersion: row.current_version || 1,
        totalVersions: row.total_versions || 1,
        isFavorite: row.is_favorite === 1
      }
    });
  } catch (error) {
    console.error('Error updating prototype:', error);
    res.status(500).json({ error: { code: 'UPDATE_ERROR', message: 'Failed to update prototype' } });
  }
});

// Delete prototype (soft delete)
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = db.prepare('UPDATE prototypes SET is_deleted = 1 WHERE id = ? AND is_deleted = 0').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Prototype not found' } });
    }

    res.json({ data: { success: true } });
  } catch (error) {
    console.error('Error deleting prototype:', error);
    res.status(500).json({ error: { code: 'DELETE_ERROR', message: 'Failed to delete prototype' } });
  }
});

export default router;
