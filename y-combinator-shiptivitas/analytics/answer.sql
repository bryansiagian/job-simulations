-- Y Combinator / Shiptivitas Task 3
-- Kanban release date: 2018-06-02 (UTC)
-- DAU = number of distinct user_id values with at least one login per UTC date.
-- Compare equal 7-day windows: 2018-05-26..2018-06-01 versus 2018-06-02..2018-06-08.

-- PART 1A: Daily active users, including zero-login days in the chosen window.
WITH RECURSIVE dates(day) AS (
    SELECT date('2018-05-26')
    UNION ALL
    SELECT date(day, '+1 day') FROM dates WHERE day < date('2018-06-08')
), logins AS (
    SELECT date(login_timestamp, 'unixepoch') AS day,
           COUNT(DISTINCT user_id) AS daily_active_users
    FROM login_history
    WHERE login_timestamp >= strftime('%s', '2018-05-26')
      AND login_timestamp < strftime('%s', '2018-06-09')
    GROUP BY date(login_timestamp, 'unixepoch')
)
SELECT dates.day,
       CASE WHEN dates.day < '2018-06-02' THEN 'before' ELSE 'after' END AS period,
       COALESCE(logins.daily_active_users, 0) AS daily_active_users
FROM dates LEFT JOIN logins ON dates.day = logins.day
ORDER BY dates.day;

-- PART 1B: Average DAU before and after release, with the same fixed 7-day denominator.
WITH RECURSIVE dates(day) AS (
    SELECT date('2018-05-26')
    UNION ALL
    SELECT date(day, '+1 day') FROM dates WHERE day < date('2018-06-08')
), logins AS (
    SELECT date(login_timestamp, 'unixepoch') AS day,
           COUNT(DISTINCT user_id) AS dau
    FROM login_history
    GROUP BY date(login_timestamp, 'unixepoch')
), daily AS (
    SELECT dates.day,
           CASE WHEN dates.day < '2018-06-02' THEN 'before' ELSE 'after' END AS period,
           COALESCE(logins.dau, 0) AS dau
    FROM dates LEFT JOIN logins ON dates.day = logins.day
)
SELECT period, COUNT(*) AS days,
       ROUND(AVG(dau), 2) AS average_dau,
       SUM(dau) AS total_daily_active_user_counts
FROM daily
GROUP BY period
ORDER BY CASE period WHEN 'before' THEN 0 ELSE 1 END;

-- PART 2A: Actual status transitions for each card, excluding initial NULL status
-- and priority-only events (same old/new status).
SELECT cardID AS card_id,
       COALESCE(card.name, '[unknown card]') AS card_name,
       COUNT(*) AS status_change_count
FROM card_change_history AS history
LEFT JOIN card ON card.id = history.cardID
WHERE history.oldStatus IS NOT NULL
  AND history.oldStatus <> history.newStatus
GROUP BY history.cardID, card.name
ORDER BY status_change_count DESC, card_id ASC;

-- PART 2B: Daily actual status changes by card (for time-granular analysis).
SELECT date(history.timestamp, 'unixepoch') AS day,
       history.cardID AS card_id,
       COALESCE(card.name, '[unknown card]') AS card_name,
       COUNT(*) AS status_changes
FROM card_change_history AS history
LEFT JOIN card ON card.id = history.cardID
WHERE history.oldStatus IS NOT NULL
  AND history.oldStatus <> history.newStatus
GROUP BY date(history.timestamp, 'unixepoch'), history.cardID, card.name
ORDER BY day ASC, card_id ASC;
