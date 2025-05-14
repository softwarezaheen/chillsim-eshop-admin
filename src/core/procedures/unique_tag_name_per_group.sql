ALTER TABLE tag
ADD CONSTRAINT unique_tag_name_per_group
UNIQUE (name, tag_group_id);