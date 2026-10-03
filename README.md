# EuroLeague Standings Card

Custom Home Assistant Lovelace card for the `sensor.euroleague_standings` entity created by the [EuroLeague Standings](https://github.com/braticks/euroleague-standings) integration.

## Features

- EuroLeague standings with team logos
- Team logo style: icon, subtle row background, or hidden
- Configurable number of teams to show
- Favorite team selection in the visual editor
- Option to always show the favorite team even when it is outside the visible TOP N
- Playoff positions 1–6 and Play-In positions 7–10 highlighted
- Selectable header: text, full EuroLeague logo, logo + text, or hidden
- Automatic header text such as `EuroLeague Season 2026` or custom text
- Optional round, GP and `+/-` point differential columns
- Compact mode
- Full Home Assistant visual card editor support
- English user interface

## Installation with HACS

1. HACS → Frontend → three dots → Custom repositories.
2. Add `https://github.com/braticks/euroleague-standings-card` as **Dashboard**.
3. Install **EuroLeague Standings Card**.
4. Refresh the browser.

The card should then appear in the Home Assistant card picker as **EuroLeague Standings Card**.

## Example

```yaml
type: custom:euroleague-standings-card
entity: sensor.euroleague_standings
count: 10
favorite_team: ZAL
always_show_favorite: true
show_zones: true
team_logo_mode: background
header_style: both
header_text_mode: auto
show_round: true
show_gp: false
show_diff: true
compact: false
highlight_favorite: true
```

## Required sensor data

The card expects a `teams` attribute containing entries such as:

```yaml
- position: 10
  code: ZAL
  name: Zalgiris Kaunas
  logo: https://...
  games_played: 3
  wins: 1
  losses: 2
  points_for: 246
  points_against: 239
  points_diff: 7
```

This project is not affiliated with EuroLeague Basketball. EuroLeague and team names/logos belong to their respective owners.
