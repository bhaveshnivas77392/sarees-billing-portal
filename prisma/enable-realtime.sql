-- START GENAI
-- Run once in the Supabase SQL editor after `npm run db:push`, so branch stock
-- lists and the owner dashboard get live updates via Supabase Realtime.
alter publication supabase_realtime add table stocks;
alter publication supabase_realtime add table sales;
-- END GENAI
