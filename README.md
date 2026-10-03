# EuroLeague Standings Card

Custom Home Assistant Lovelace card for the `sensor.euroleague_standings` entity created by the [EuroLeague Standings](https://github.com/braticks/euroleague-standings) integration.

## Features

- EuroLeague standings with team logos
- Team logo display can be selected in the visual editor: beside the team name, as a subtle row background, or hidden
- Header can be selected in the visual editor: text, EuroLeague logo, logo + text, or hidden
- Automatic header text such as `EuroLeague sezonas 2026`, with an optional custom text mode
- Configurable number of teams to show
- Favorite team selection in the visual editor
- Option to always show the favorite team even when it is outside the visible TOP N
- Playoff positions 1–6 and Play-In positions 7–10 highlighted
- Optional round and GP column
- Compact mode
- Full Home Assistant visual card editor support

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
title: EuroLeague
count: 10
favorite_team: ZAL
always_show_favorite: true
show_zones: true
team_logo_mode: background
header_style: both
header_text_mode: auto
show_round: true
show_gp: false
compact: false
highlight_favorite: true
```

### Team logo modes

- `icon` – logo beside the team name
- `background` – subtle large team logo in the row background
- `none` – no team logo

### Header modes

- `text` – header text only
- `logo` – EuroLeague logo only
- `both` – logo + text
- `none` – hide the header title/logo

With `header_text_mode: auto`, the season is read from the sensor and displayed automatically, for example `EuroLeague sezonas 2026`. With `header_text_mode: custom`, use `header_text` for your own label.

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
```

This project is not affiliated with EuroLeague Basketball. Team names and logos belong to their respective owners.
