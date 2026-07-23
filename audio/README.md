# Bundled adhkar audio (played by cron + mpv)

- `morning-adhkar.m4a` — https://www.youtube.com/watch?v=P8EIBksC0MA
- `evening-adhkar.m4a` — https://www.youtube.com/watch?v=fQUbhEHetks

Schedule on a Pi:

```bash
sudo apt-get install -y mpv
bash scripts/install-cron.sh --lat YOUR_LAT --lon YOUR_LON --morning 7:15 --offset 40
```
