-- Fix reports table: add missing action column
ALTER TABLE reports ADD COLUMN action TEXT;
