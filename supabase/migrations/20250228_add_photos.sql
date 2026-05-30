-- Photos 테이블 (장소별 사진)
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_photos_trip_id ON photos(trip_id);
CREATE INDEX idx_photos_place_id ON photos(place_id);

ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for photos" ON photos FOR ALL USING (true) WITH CHECK (true);
