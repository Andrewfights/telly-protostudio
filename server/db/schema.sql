-- Prototypes table
CREATE TABLE IF NOT EXISTS prototypes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    zone_content TEXT NOT NULL,
    thumbnail TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_deleted INTEGER DEFAULT 0
);

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prototype_id TEXT NOT NULL,
    favorited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prototype_id) REFERENCES prototypes(id) ON DELETE CASCADE,
    UNIQUE(prototype_id)
);

-- Share links table
CREATE TABLE IF NOT EXISTS share_links (
    id TEXT PRIMARY KEY,
    prototype_id TEXT NOT NULL,
    share_code TEXT NOT NULL UNIQUE,
    expires_at DATETIME,
    view_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prototype_id) REFERENCES prototypes(id) ON DELETE CASCADE
);

-- Zone templates table (for saving individual zones)
CREATE TABLE IF NOT EXISTS zone_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    zone_id TEXT NOT NULL,
    content TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Prototype versions table (revision history)
CREATE TABLE IF NOT EXISTS prototype_versions (
    id TEXT PRIMARY KEY,
    prototype_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    zone_content TEXT NOT NULL,
    led_settings TEXT,
    thumbnail TEXT,
    commit_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prototype_id) REFERENCES prototypes(id) ON DELETE CASCADE,
    UNIQUE(prototype_id, version_number)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_prototypes_updated_at ON prototypes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_prototypes_name ON prototypes(name);
CREATE INDEX IF NOT EXISTS idx_prototypes_is_deleted ON prototypes(is_deleted);
CREATE INDEX IF NOT EXISTS idx_favorites_prototype_id ON favorites(prototype_id);
CREATE INDEX IF NOT EXISTS idx_share_links_code ON share_links(share_code);
CREATE INDEX IF NOT EXISTS idx_share_links_prototype_id ON share_links(prototype_id);
CREATE INDEX IF NOT EXISTS idx_zone_templates_zone_id ON zone_templates(zone_id);
CREATE INDEX IF NOT EXISTS idx_zone_templates_name ON zone_templates(name);
CREATE INDEX IF NOT EXISTS idx_versions_prototype ON prototype_versions(prototype_id);
CREATE INDEX IF NOT EXISTS idx_versions_created ON prototype_versions(created_at DESC);
