# Productreevity Database Schema
complete_scheme.sql contains all deployment postgres in a compiled document

## Production Files

### Complete Setup
- **`complete_schema.sql`** **SINGLE FILE FOR EVERYTHING** - Complete database setup including:
  - All tables, indexes, functions, triggers
  - Row Level Security (RLS) policies  
  - Achievement system with emoji icons
  - Timezone support for accurate time-based achievements
  - Seed data with all achievements

## Archive

The `archive/` folder contains:
- Original legacy files (`schema.sql`, `seed.sql`, `daily_stats.sql`)
- Development patches and debugging scripts
- All files used during development but not needed for production

## Features

- **Gamification**: Points, streaks, achievements, apple collection
- **Time Tracking**: Focus sessions with Pomodoro timer
- **Task Management**: Priority-based task system
- **Analytics**: Daily and weekly statistics
- **Security**: Row Level Security (RLS) policies
- **Performance**: Optimized indexes and triggers
