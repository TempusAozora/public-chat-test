BEGIN;
    SELECT set_config('anon.ip_hashed', decode($1, 'base64')::text, true);
    SELECT set_config(
        'anon.id', 
        COALESCE((SELECT anon_id FROM anon_data)::text, gen_random_uuid()::text), 
        true
    );

    INSERT INTO anon_data (anon_id, ip_encrypted, ip_hashed)
        VALUES (current_setting('anon.id')::uuid, decode($1, 'base64'), decode($2, 'base64'))
        ON CONFLICT (ip_hashed) DO NOTHING;

    SELECT current_setting('anon.id')::uuid AS anon_id;
COMMIT;