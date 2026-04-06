-- Run this in your Supabase SQL editor to set up the tables

CREATE TABLE subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  refresh_token TEXT NOT NULL,
  access_token TEXT,
  token_expires_at BIGINT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE order_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,
  reference_number TEXT NOT NULL,
  vin TEXT,
  order_status TEXT,
  tasks_complete JSONB,
  delivery_window TEXT,
  appointment_date TEXT,
  odometer TEXT,
  routing_location TEXT,
  eta_delivery_center TEXT,
  raw_snapshot JSONB,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(subscriber_id, reference_number)
);

CREATE INDEX idx_subscribers_active ON subscribers(is_active) WHERE is_active = true;
CREATE INDEX idx_snapshots_subscriber ON order_snapshots(subscriber_id);
