ALTER TABLE sub_sites ADD COLUMN IF NOT EXISTS parent_reference TEXT DEFAULT 'Built with huevsite.io';
