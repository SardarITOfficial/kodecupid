-- Turn the nullable geography column into a stored generated column derived
-- from latitude/longitude, then index it for future geofencing queries.
ALTER TABLE "profiles" DROP COLUMN IF EXISTS "locationPoint";

ALTER TABLE "profiles"
  ADD COLUMN "locationPoint" geography(Point, 4326)
  GENERATED ALWAYS AS (
    CASE
      WHEN "latitude" IS NOT NULL AND "longitude" IS NOT NULL
        THEN ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326)::geography
      ELSE NULL
    END
  ) STORED;

CREATE INDEX IF NOT EXISTS "profiles_locationPoint_gist"
  ON "profiles" USING GIST ("locationPoint");
