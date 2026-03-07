import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/database.js';

const router = Router();

// List all versions of a prototype
router.get('/:prototypeId/versions', (req: Request, res: Response) => {
  try {
    const { prototypeId } = req.params;

    // Check if prototype exists
    const prototype = db.prepare('SELECT id FROM prototypes WHERE id = ? AND is_deleted = 0').get(prototypeId);
    if (!prototype) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Prototype not found' } });
    }

    const rows = db.prepare(`
      SELECT * FROM prototype_versions
      WHERE prototype_id = ?
      ORDER BY version_number DESC
    `).all(prototypeId) as any[];

    const data = rows.map(row => ({
      id: row.id,
      prototypeId: row.prototype_id,
      versionNumber: row.version_number,
      name: row.name,
      description: row.description,
      zoneContent: JSON.parse(row.zone_content),
      ledSettings: row.led_settings ? JSON.parse(row.led_settings) : null,
      thumbnail: row.thumbnail,
      commitMessage: row.commit_message,
      createdAt: row.created_at
    }));

    res.json({ data });
  } catch (error) {
    console.error('Error listing versions:', error);
    res.status(500).json({ error: { code: 'LIST_ERROR', message: 'Failed to list versions' } });
  }
});

// Get specific version
router.get('/:prototypeId/versions/:versionNum', (req: Request, res: Response) => {
  try {
    const { prototypeId, versionNum } = req.params;
    const versionNumber = parseInt(versionNum);

    if (isNaN(versionNumber)) {
      return res.status(400).json({ error: { code: 'INVALID_VERSION', message: 'Invalid version number' } });
    }

    const row = db.prepare(`
      SELECT * FROM prototype_versions
      WHERE prototype_id = ? AND version_number = ?
    `).get(prototypeId, versionNumber) as any;

    if (!row) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Version not found' } });
    }

    res.json({
      data: {
        id: row.id,
        prototypeId: row.prototype_id,
        versionNumber: row.version_number,
        name: row.name,
        description: row.description,
        zoneContent: JSON.parse(row.zone_content),
        ledSettings: row.led_settings ? JSON.parse(row.led_settings) : null,
        thumbnail: row.thumbnail,
        commitMessage: row.commit_message,
        createdAt: row.created_at
      }
    });
  } catch (error) {
    console.error('Error getting version:', error);
    res.status(500).json({ error: { code: 'GET_ERROR', message: 'Failed to get version' } });
  }
});

// Create new version (typically called when saving a prototype)
router.post('/:prototypeId/versions', (req: Request, res: Response) => {
  try {
    const { prototypeId } = req.params;
    const { commitMessage } = req.body;

    // Get current prototype data
    const prototype = db.prepare(`
      SELECT * FROM prototypes WHERE id = ? AND is_deleted = 0
    `).get(prototypeId) as any;

    if (!prototype) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Prototype not found' } });
    }

    // Get the next version number
    const lastVersion = db.prepare(`
      SELECT MAX(version_number) as max_version FROM prototype_versions WHERE prototype_id = ?
    `).get(prototypeId) as { max_version: number | null };

    const versionNumber = (lastVersion?.max_version || 0) + 1;
    const id = uuidv4();
    const now = new Date().toISOString();

    // Insert the version
    db.prepare(`
      INSERT INTO prototype_versions (id, prototype_id, version_number, name, description, zone_content, led_settings, thumbnail, commit_message, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      prototypeId,
      versionNumber,
      prototype.name,
      prototype.description,
      prototype.zone_content,
      prototype.led_settings,
      prototype.thumbnail,
      commitMessage || null,
      now
    );

    // Update prototype's version tracking
    db.prepare(`
      UPDATE prototypes SET current_version = ?, total_versions = ? WHERE id = ?
    `).run(versionNumber, versionNumber, prototypeId);

    res.status(201).json({
      data: {
        id,
        prototypeId,
        versionNumber,
        name: prototype.name,
        description: prototype.description,
        zoneContent: JSON.parse(prototype.zone_content),
        ledSettings: prototype.led_settings ? JSON.parse(prototype.led_settings) : null,
        thumbnail: prototype.thumbnail,
        commitMessage: commitMessage || null,
        createdAt: now
      }
    });
  } catch (error) {
    console.error('Error creating version:', error);
    res.status(500).json({ error: { code: 'CREATE_ERROR', message: 'Failed to create version' } });
  }
});

// Rollback to a specific version
router.post('/:prototypeId/rollback/:versionNum', (req: Request, res: Response) => {
  try {
    const { prototypeId, versionNum } = req.params;
    const versionNumber = parseInt(versionNum);

    if (isNaN(versionNumber)) {
      return res.status(400).json({ error: { code: 'INVALID_VERSION', message: 'Invalid version number' } });
    }

    // Get the version to rollback to
    const version = db.prepare(`
      SELECT * FROM prototype_versions
      WHERE prototype_id = ? AND version_number = ?
    `).get(prototypeId, versionNumber) as any;

    if (!version) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Version not found' } });
    }

    const now = new Date().toISOString();

    // Update the prototype with the version's data
    db.prepare(`
      UPDATE prototypes
      SET name = ?,
          description = ?,
          zone_content = ?,
          led_settings = ?,
          thumbnail = ?,
          updated_at = ?,
          current_version = ?
      WHERE id = ?
    `).run(
      version.name,
      version.description,
      version.zone_content,
      version.led_settings,
      version.thumbnail,
      now,
      versionNumber,
      prototypeId
    );

    // Fetch updated prototype
    const row = db.prepare(`
      SELECT p.*,
             CASE WHEN f.prototype_id IS NOT NULL THEN 1 ELSE 0 END as is_favorite
      FROM prototypes p
      LEFT JOIN favorites f ON p.id = f.prototype_id
      WHERE p.id = ?
    `).get(prototypeId) as any;

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
        currentVersion: row.current_version,
        totalVersions: row.total_versions,
        isFavorite: row.is_favorite === 1
      },
      message: `Rolled back to version ${versionNumber}`
    });
  } catch (error) {
    console.error('Error rolling back:', error);
    res.status(500).json({ error: { code: 'ROLLBACK_ERROR', message: 'Failed to rollback' } });
  }
});

// Compare two versions (diff)
router.get('/:prototypeId/diff/:v1/:v2', (req: Request, res: Response) => {
  try {
    const { prototypeId, v1, v2 } = req.params;
    const version1 = parseInt(v1);
    const version2 = parseInt(v2);

    if (isNaN(version1) || isNaN(version2)) {
      return res.status(400).json({ error: { code: 'INVALID_VERSION', message: 'Invalid version numbers' } });
    }

    const ver1 = db.prepare(`
      SELECT * FROM prototype_versions WHERE prototype_id = ? AND version_number = ?
    `).get(prototypeId, version1) as any;

    const ver2 = db.prepare(`
      SELECT * FROM prototype_versions WHERE prototype_id = ? AND version_number = ?
    `).get(prototypeId, version2) as any;

    if (!ver1 || !ver2) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'One or both versions not found' } });
    }

    const zoneContent1 = JSON.parse(ver1.zone_content);
    const zoneContent2 = JSON.parse(ver2.zone_content);

    // Calculate which zones changed
    const zones = ['A', 'B', 'C', 'D', 'E', 'F'];
    const changes: Record<string, { changed: boolean; added: boolean; removed: boolean }> = {};

    zones.forEach(zone => {
      const content1 = zoneContent1[zone] || '';
      const content2 = zoneContent2[zone] || '';
      changes[zone] = {
        changed: content1 !== content2,
        added: !content1 && !!content2,
        removed: !!content1 && !content2
      };
    });

    res.json({
      data: {
        version1: {
          versionNumber: version1,
          name: ver1.name,
          createdAt: ver1.created_at,
          zoneContent: zoneContent1
        },
        version2: {
          versionNumber: version2,
          name: ver2.name,
          createdAt: ver2.created_at,
          zoneContent: zoneContent2
        },
        changes,
        summary: {
          zonesChanged: zones.filter(z => changes[z].changed).length,
          zonesAdded: zones.filter(z => changes[z].added).length,
          zonesRemoved: zones.filter(z => changes[z].removed).length
        }
      }
    });
  } catch (error) {
    console.error('Error comparing versions:', error);
    res.status(500).json({ error: { code: 'DIFF_ERROR', message: 'Failed to compare versions' } });
  }
});

export default router;
