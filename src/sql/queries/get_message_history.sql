SELECT 
    tstamp AS "timestamp",
    msg AS "message"
FROM public_chat_data 
ORDER BY tstamp ASC;