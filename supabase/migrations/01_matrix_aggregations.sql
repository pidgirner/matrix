-- Миграция для оптимизации производительности Matrix.tsx
-- Создает View, которая возвращает только последние попытки по каждой теме для каждого пользователя,
-- включая общее количество попыток. Это предотвращает загрузку всей истории на клиент.

CREATE OR REPLACE VIEW matrix_latest_results AS
WITH ranked_results AS (
  SELECT
    id,
    user_id,
    category,
    topic,
    file_url,
    created_at,
    scores,
    user_comment,
    COUNT(*) OVER(PARTITION BY user_id, category, topic) as attempt_count,
    ROW_NUMBER() OVER(PARTITION BY user_id, category, topic ORDER BY created_at DESC) as rn
  FROM results
)
SELECT 
  id,
  user_id,
  category,
  topic,
  file_url,
  scores,
  user_comment,
  attempt_count::int,
  created_at
FROM ranked_results 
WHERE rn = 1;

-- Устанавливаем права доступа (Row Level Security policies apply to the underlying tables,
-- but if using a security invoker view, it respects RLS of `results`).
-- По умолчанию Views in Postgres run as the definer, but we can make it security invoker if needed.
-- В Supabase рекомендуется делать Security Invoker Views, если вы хотите чтобы RLS таблицы results работал.
ALTER VIEW matrix_latest_results SET (security_invoker = on);
