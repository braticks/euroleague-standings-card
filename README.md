# EuroLeague Standings Card — deprecated

> [!IMPORTANT]
> **This standalone card repository is no longer maintained.**
>
> The card is now bundled directly with the **EuroLeague Standings** Home Assistant integration. New installations only need the combined integration:
>
> **https://github.com/braticks/euroleague-standings**

## Moved to the combined integration

Starting with **EuroLeague Standings v1.2.0**, one HACS installation provides both:

- `sensor.euroleague_standings`
- `custom:euroleague-standings-card`
- the visual card editor
- automatic Lovelace resource registration in storage mode

Do **not** install this repository for new setups.

## Migration from the old standalone card

1. Update the **EuroLeague Standings** integration to v1.2.0 or newer.
2. Restart Home Assistant.
3. Verify that `custom:euroleague-standings-card` still works.
4. Remove **EuroLeague Standings Card** from HACS Dashboard / Frontend.

The card type and configuration stay the same, so existing dashboard YAML does not need to be changed.

## Current project

All future development, releases and issue tracking are in:

**braticks/euroleague-standings**  
https://github.com/braticks/euroleague-standings

This repository is kept only for migration, old links and project history.
