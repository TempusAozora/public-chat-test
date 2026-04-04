BEGIN;
    SELECT set_config('anon.id', $1::text, true);

    INSERT INTO chat_messages (anon_id, msg)
        VALUES ($1, $2)
        RETURNING tstamp AS "timestamp";
COMMIT;