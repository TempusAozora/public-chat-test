GRANT CONNECT ON DATABASE "public-chat-test" TO "chat-user";

GRANT INSERT, SELECT ON TABLE public.anon_data TO "chat-user";
GRANT INSERT, SELECT ON TABLE public.chat_messages TO 'chat-user';
GRANT SELECT ON TABLE public.public_chat_data TO "chat-user";

GRANT USAGE ON SCHEMA public TO "chat-user";
GRANT USAGE ON SEQUENCE public.chat_messages_id_seq TO "chat-user";
GRANT USAGE ON SEQUENCE public.anon_data_id_seq TO "chat-user";

CREATE POLICY chat_messages_insert ON chat_messages
FOR INSERT
WITH CHECK (anon_id = current_setting('anon.id')::uuid);

CREATE POLICY chat_messages_select ON chat_messages
FOR SELECT
USING (anon_id = current_setting('anon.id')::uuid);

CREATE POLICY anon_data_select ON anon_data
FOR SELECT
USING (ip_hashed = current_setting('anon.ip_hashed')::bytea);

CREATE POLICY anon_data_insert ON anon_data
FOR INSERT
WITH CHECK (ip_hashed = current_setting('anon.ip_hashed')::bytea);