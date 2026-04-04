CREATE SEQUENCE chat_messages_id_seq;

CREATE TABLE public.chat_messages
(
    id integer NOT NULL DEFAULT nextval('chat_messages_id_seq'::regclass),
    anon_id uuid NOT NULL,
    msg character varying(100) COLLATE pg_catalog."default" NOT NULL,
    tstamp timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chat_messages_pkey PRIMARY KEY (id)
);

CREATE VIEW public.public_chat_data AS
SELECT tstamp, msg
FROM chat_messages;

CREATE SEQUENCE anon_data_id_seq;
CREATE TABLE public.anon_data
(
    id integer NOT NULL DEFAULT nextval('anon_data_id_seq'::regclass),
    anon_id uuid NOT NULL DEFAULT gen_random_uuid(),
    ip_encrypted bytea NOT NULL,
    ip_hashed bytea NOT NULL,
    CONSTRAINT anon_data_pkey PRIMARY KEY (id)
);

CREATE UNIQUE INDEX anon_encrypted_unique on anon_data (ip_hashed);