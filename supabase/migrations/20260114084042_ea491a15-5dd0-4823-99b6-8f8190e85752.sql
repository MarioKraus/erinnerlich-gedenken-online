-- Unschedule the hourly scrape job that's running independently
SELECT cron.unschedule('scrape-obituaries-hourly');