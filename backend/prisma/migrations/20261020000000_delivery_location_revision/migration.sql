-- Monotonic location revision prevents an address revert reviving an old survey.
ALTER TABLE restaurants ADD location_version INT UNSIGNED NOT NULL DEFAULT 1,
 ADD CONSTRAINT restaurant_location_version_ck CHECK(location_version BETWEEN 1 AND 2147483646);
