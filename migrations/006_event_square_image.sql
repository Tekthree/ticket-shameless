-- Add square_image_url to events for the sticky sidebar display
alter table events add column if not exists square_image_url text;
