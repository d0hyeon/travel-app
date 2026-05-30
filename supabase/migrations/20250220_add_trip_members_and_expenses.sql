-- Trip Members 테이블 (여행 참여 인원)
CREATE TABLE trip_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trip_members_trip_id ON trip_members(trip_id);

ALTER TABLE trip_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for trip_members" ON trip_members FOR ALL USING (true) WITH CHECK (true);

-- Expenses 테이블 (지출 내역)
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  place_id UUID REFERENCES places(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  total_amount INTEGER NOT NULL,  -- 원 단위
  payments JSONB NOT NULL DEFAULT '[]',  -- [{memberId: string, amount: number}]
  split_among UUID[] NOT NULL DEFAULT '{}',  -- 정산 대상 member IDs
  date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expenses_trip_id ON expenses(trip_id);
CREATE INDEX idx_expenses_place_id ON expenses(place_id);
CREATE INDEX idx_expenses_date ON expenses(date);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);
