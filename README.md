# Productreevity

Grow Your Productivity, Grow Your Tree - A gamified productivity app that transforms time management into an engaging, rewarding experience through visual growth and achievement systems.

## Project Overview
Productreevity revolutionizes productivity tracking by combining time management with gamification. Users grow a virtual apple tree through productive work sessions, with different apple tiers representing achievement levels. A full-stack web application built with modern technologies.

## Key Features

- **Dynamic Tree Growth**: Your apple tree grows in real-time as you complete productive sessions
- **Tiered Apple System**: Earn different apple types (Red, Silver, Gold, Diamond) based on productivity points
- **Smart Time Tracking**: Pomodoro-inspired sessions with customizable work/break intervals
- **Task Management**: Create, organize, and complete tasks with point rewards
- **Achievement System**: Unlock badges and rewards for consistency and milestones
- **Analytics Dashboard**: Visualize productivity trends and patterns
- **Real-time Sync**: Instant updates across all devices via Supabase

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **Database**: PostgreSQL with Row Level Security
- **Deployment**: Vercel-ready
- **UI Components**: Modern, accessible component library
- **Styling**: Tailwind CSS with custom design system

## Architecture

```
productreevity/
├── frontend/                  # Next.js + TypeScript
│   ├── app/                  # Next.js app directory
│   │   ├── dashboard/        # Main dashboard
│   │   ├── demo/            # Interactive demo
│   │   ├── login/           # Authentication
│   │   ├── signup/          # User registration
│   │   └── api/             # API routes
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── tree-visualization.tsx
│   │   ├── timer-component.tsx
│   │   ├── task-manager.tsx
│   │   ├── achievement-panel.tsx
│   │   └── stats-overview.tsx
│   └── lib/                # Utilities and configurations
└── database/               # PostgreSQL schema
    ├── complete_schema.sql # Complete database setup
    └── archive/           # Development files
```

## Database Design

### Core Tables

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_points INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0
);

-- Productivity sessions
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- in seconds
    session_type VARCHAR(20), -- 'focus', 'break', 'longbreak'
    completed BOOLEAN DEFAULT false,
    points_earned INTEGER DEFAULT 0
);

-- Tasks
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority INTEGER CHECK (priority BETWEEN 1 AND 5),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
    points INTEGER DEFAULT 10,
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tree progression
CREATE TABLE trees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    growth_level INTEGER DEFAULT 1,
    total_apples INTEGER DEFAULT 0,
    bronze_apples INTEGER DEFAULT 0,
    silver_apples INTEGER DEFAULT 0,
    gold_apples INTEGER DEFAULT 0,
    diamond_apples INTEGER DEFAULT 0,
    last_watered TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url VARCHAR(255),
    points_required INTEGER,
    special_condition VARCHAR(100) -- 'streak_7', 'tasks_100', etc.
);

-- User achievements (junction table)
CREATE TABLE user_achievements (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, achievement_id)
);
```

## Gamification System

### Apple Tier System

```typescript
const APPLE_TIERS = {
  red: {
    points: 10,
    description: "Base apple earned from completing tasks and focus sessions"
  },
  silver: {
    points: 50,        // 5 red apples
    conversionRate: 5,  // 5 red = 1 silver
    description: "Earned by converting 5 red apples"
  },
  gold: {
    points: 250,       // 25 red apples
    conversionRate: 5,  // 5 silver = 1 gold
    description: "Earned by converting 5 silver apples"
  },
  diamond: {
    points: 1250,      // 125 red apples
    conversionRate: 5,  // 5 gold = 1 diamond
    description: "Ultimate achievement - earned by converting 5 gold apples"
  }
}
```

### Point Calculation System

```typescript
// Task Points by Priority
const TASK_POINTS = {
  low: 1,      // Low priority tasks
  medium: 5,   // Medium priority tasks  
  high: 10     // High priority tasks
}

// Session Points
const SESSION_POINTS = {
  focusSession25Min: 1  // 25-minute focus session = 1 point
}

// Apple Conversion Logic
const convertPointsToApples = (totalPoints: number) => {
  const redApples = Math.floor(totalPoints / 10)
  const silverApples = Math.floor(redApples / 5)
  const goldApples = Math.floor(silverApples / 5)
  const diamondApples = Math.floor(goldApples / 5)
  
  return {
    red: redApples % 5,           // Remaining red apples
    silver: silverApples % 5,     // Remaining silver apples  
    gold: goldApples % 5,         // Remaining gold apples
    diamond: diamondApples        // All diamond apples
  }
}
```

### Tree Growth Formula

```typescript
const calculateTreeGrowth = (
  totalProductiveMinutes: number, 
  appleCount: number
): number => {
  // Logarithmic growth curve for realistic progression
  const baseGrowth = Math.log(totalProductiveMinutes + 1) * 10
  const appleBoost = appleCount * 0.05
  
  const growthLevel = baseGrowth * (1 + appleBoost)
  return Math.min(growthLevel, 100)  // Cap at level 100
}
```

## Supabase Integration

### Authentication
- Built-in Supabase Auth for user registration and login
- Email/password authentication with email verification
- OAuth providers can be easily added (Google, GitHub, etc.)

### Database Operations
All database operations are handled through the Supabase client:
- **Sessions**: Real-time session tracking with RLS
- **Tasks**: CRUD operations with automatic user filtering
- **Trees**: Real-time tree growth updates
- **Achievements**: Automatic achievement tracking

### Real-time Features
- Live tree growth visualization
- Instant task updates across devices
- Real-time achievement notifications
- Live session status updates

## Frontend Implementation Details

### Supabase Client Setup

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Real-time Subscriptions

```typescript
// Subscribe to tree updates
const subscription = supabase
  .channel('tree-updates')
  .on('postgres_changes', 
    { event: 'UPDATE', schema: 'public', table: 'trees' },
    (payload) => {
      // Update tree visualization
      updateTreeVisualization(payload.new)
    }
  )
  .subscribe()
```

### Gamification Logic

```typescript
// Calculate points client-side or use Supabase Edge Functions
const calculateSessionPoints = async (sessionData: Session) => {
  const basePoints = sessionData.duration * 0.5
  const streakMultiplier = 1 + (user.currentStreak * 0.1)
  const totalPoints = Math.floor(basePoints * streakMultiplier)
  
  // Update user points in database
  await supabase
    .from('profiles')
    .update({ total_points: user.total_points + totalPoints })
    .eq('id', user.id)
}
```

## UI/UX Design Specifications

### Color Palette

```css
:root {
    --primary-green: #4CAF50;      /* Healthy tree green */
    --secondary-brown: #8B4513;     /* Tree trunk brown */
    --accent-gold: #FFD700;         /* Gold apple */
    --bg-sky: #87CEEB;             /* Sky blue background */
    --text-primary: #333333;
    --text-secondary: #666666;
}
```

### Tree Visualization States

- **Seedling (Level 1-20)**: Small sapling with few leaves
- **Young Tree (Level 21-50)**: Medium tree with branches
- **Mature Tree (Level 51-80)**: Full tree with many branches
- **Grand Tree (Level 81-100)**: Majestic tree with abundant apples

### Animation Specifications

- **Tree growth**: Smooth transition over 2 seconds
- **Apple appearance**: Bounce animation (0.5s)
- **Point counter**: Incremental count-up effect
- **Achievement unlock**: Slide-in from right with confetti

## Testing Strategy

### Frontend Testing

```typescript
// Example test for points calculation
import { calculateSessionPoints } from '@/lib/gamification'

describe('Session Points Calculation', () => {
  it('calculates basic session points', () => {
    const points = calculateSessionPoints({
      duration: 30,
      streak: 0,
      tasksCompleted: 0
    })
    expect(points).toBe(15)
  })
  
  it('applies streak multiplier correctly', () => {
    const points = calculateSessionPoints({
      duration: 30,
      streak: 5,
      tasksCompleted: 0
    })
    expect(points).toBe(22) // 15 * 1.5 streak multiplier
  })
})
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account

### Setup Instructions

```bash
# Clone repository
git clone https://github.com/SamyagJ/Productreevity.git
cd Productreevity

# Install dependencies
cd frontend
npm install  # or pnpm install

# Set up environment variables
# Create .env.local with your Supabase credentials:
echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_url" >> .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key" >> .env.local
echo "SUPABASE_SERVICE_ROLE_KEY=your_service_role_key" >> .env.local

# Set up database
# 1. Create a new Supabase project
# 2. Go to SQL Editor in Supabase dashboard
# 3. Run the contents of database/complete_schema.sql
# 4. That's it! Complete schema includes all tables, functions, and seed data

# Start development server
npm run dev  # or pnpm dev
```

### Deployment

```bash
# Deploy to Vercel
vercel

# Set environment variables in Vercel dashboard
# Add the same variables from .env.local
```

## Future Enhancements

- **Mobile App**: React Native for iOS/Android
- **Social Features**: Friends, leaderboards, challenges
- **AI Insights**: ML-powered productivity recommendations
- **Integrations**: Calendar sync, Spotify integration for focus music
- **Custom Themes**: Different tree types and environments
- **Team Mode**: Grow a forest together with your team

## License
This project is licensed under the MIT License - see the LICENSE file for details.
