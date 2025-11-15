# Where Were the Planets on My Birthday?

A minimal web app that:
- Computes simplified solar system planet positions for a selected date (SVG visualization)
- Fetches NASA Astronomy Picture of the Day (APOD) for that date
- Provides downloads for APOD and the planet diagram
- Supports dark/light themes

## Features

- Date picker for your birthday
- APOD fetch (image or video preview, title, explanation)
- Planet angles using simple orbital math:
  - Reference date: `2000-01-01`
  - Periods (days): `mercury 88, venus 225, earth 365.25, mars 687, jupiter 4333, saturn 10759, uranus 30687, neptune 60190`
  - Formula: `angle = (days_since_reference % period) / period * 360`
- Top-down solar system (SVG): orbits, planets, labels
- Detail card: selected date, weekday, summary of angles
- Smooth fades and responsive design
- Theme toggle with system preference and persistence
- Downloads:
  - APOD image/video thumbnail
  - Solar system as high-res JPG

