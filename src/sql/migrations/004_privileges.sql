GRANT CONNECT ON DATABASE "public-chat-test" TO "chat-user";

GRANT INSERT, SELECT ON TABLE public.anon_data TO "chat-user";
GRANT INSERT, SELECT ON TABLE public.chat_messages TO 'chat-user';
GRANT SELECT ON TABLE public.public_chat_data TO "chat-user";

GRANT USAGE ON SCHEMA public TO "chat-user";
GRANT USAGE ON SEQUENCE public.chat_messages_id_seq TO "chat-user";
GRANT USAGE ON SEQUENCE public.anon_data_id_seq TO "chat-user";