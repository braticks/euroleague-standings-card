# EuroLeague Standings Card — deprecated standalone package

> **Deprecated:** starting with **EuroLeague Standings integration v1.2.0**, this card is bundled directly with the integration and is registered automatically in Home Assistant.

Use the combined integration instead:

`https://github.com/braticks/euroleague-standings`

## Migration

1. Update **EuroLeague Standings** integration to v1.2.0 or newer.
2. Restart Home Assistant.
3. Verify `custom:euroleague-standings-card` still works.
4. Remove this separate **Dashboard** repository from HACS.

The card type and its configuration stay the same, so existing dashboard YAML does not need to be changed.

This repository is kept only for existing installations and history. New installations should use the combined integration.
