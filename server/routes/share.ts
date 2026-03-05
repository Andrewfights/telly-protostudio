import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';
import db from '../db/database.js';

const router = Router();

// Generate share link
router.post('/', (req: Request, res: Response) => {
  try {
    const { prototypeId, expiresIn } = req.body;

    if (!prototypeId) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'prototypeId is required' }
      });
    }

    // Check if prototype exists
    const prototype = db.prepare('SELECT id, name FROM prototypes WHERE id = ? AND is_deleted = 0').get(prototypeId) as any;
    if (!prototype) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Prototype not found' } });
    }

    const id = uuidv4();
    const shareCode = nanoid(8);
    const now = new Date().toISOString();

    let expiresAt = null;
    if (expiresIn) {
      const expireDate = new Date();
      expireDate.setSeconds(expireDate.getSeconds() + expiresIn);
      expiresAt = expireDate.toISOString();
    }

    db.prepare(`
      INSERT INTO share_links (id, prototype_id, share_code, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, prototypeId, shareCode, expiresAt, now);

    res.status(201).json({
      data: {
        id,
        prototypeId,
        prototypeName: prototype.name,
        shareCode,
        shareUrl: `/share/${shareCode}`,
        expiresAt,
        viewCount: 0,
        createdAt: now
      }
    });
  } catch (error) {
    console.error('Error creating share link:', error);
    res.status(500).json({ error: { code: 'CREATE_ERROR', message: 'Failed to create share link' } });
  }
});

// Get shared prototype by code
router.get('/:code', (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    const link = db.prepare(`
      SELECT sl.*, p.name, p.description, p.zone_content, p.thumbnail, p.created_at as prototype_created_at
      FROM share_links sl
      JOIN prototypes p ON sl.prototype_id = p.id
      WHERE sl.share_code = ? AND p.is_deleted = 0
    `).get(code) as any;

    if (!link) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Share link not found' } });
    }

    // Check expiration
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return res.status(410).json({ error: { code: 'EXPIRED', message: 'Share link has expired' } });
    }

    // Increment view count
    db.prepare('UPDATE share_links SET view_count = view_count + 1 WHERE id = ?').run(link.id);

    res.json({
      data: {
        shareCode: link.share_code,
        prototype: {
          id: link.prototype_id,
          name: link.name,
          description: link.description,
          zoneContent: JSON.parse(link.zone_content),
          thumbnail: link.thumbnail,
          createdAt: link.prototype_created_at
        },
        viewCount: link.view_count + 1,
        expiresAt: link.expires_at,
        createdAt: link.created_at
      }
    });
  } catch (error) {
    console.error('Error getting shared prototype:', error);
    res.status(500).json({ error: { code: 'GET_ERROR', message: 'Failed to get shared prototype' } });
  }
});

// List share links for a prototype
router.get('/prototype/:prototypeId', (req: Request, res: Response) => {
  try {
    const { prototypeId } = req.params;

    const links = db.prepare(`
      SELECT * FROM share_links
      WHERE prototype_id = ?
      ORDER BY created_at DESC
    `).all(prototypeId) as any[];

    res.json({
      data: links.map(link => ({
        id: link.id,
        prototypeId: link.prototype_id,
        shareCode: link.share_code,
        shareUrl: `/share/${link.share_code}`,
        expiresAt: link.expires_at,
        viewCount: link.view_count,
        createdAt: link.created_at,
        isExpired: link.expires_at && new Date(link.expires_at) < new Date()
      }))
    });
  } catch (error) {
    console.error('Error listing share links:', error);
    res.status(500).json({ error: { code: 'LIST_ERROR', message: 'Failed to list share links' } });
  }
});

// Revoke share link
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = db.prepare('DELETE FROM share_links WHERE id = ?').run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Share link not found' } });
    }

    res.json({ data: { success: true } });
  } catch (error) {
    console.error('Error revoking share link:', error);
    res.status(500).json({ error: { code: 'DELETE_ERROR', message: 'Failed to revoke share link' } });
  }
});

export default router;
