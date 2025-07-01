🌳 Productreevity

Grow Your Productivity, Grow Your Tree - A gamified productivity app that transforms time management into an engaging, rewarding experience through visual growth and achievement systems.

🎯 Project Overview
Productreevity revolutionizes productivity tracking by combining time management with gamification. Users grow a virtual apple tree through productive work sessions, with different apple tiers representing achievement levels. Built by the Husky Coding Project team at the University of Washington.
🌟 Key Features

🌲 Dynamic Tree Growth: Your apple tree grows in real-time as you complete productive sessions
🍎 Tiered Apple System: Earn different apple types (Bronze, Silver, Gold, Diamond) based on productivity streaks
⏱️ Smart Time Tracking: Pomodoro-inspired sessions with customizable work/break intervals
📋 Task Management: Create, organize, and complete tasks with point rewards
🏆 Achievement System: Unlock badges and rewards for consistency and milestones
📊 Analytics Dashboard: Visualize productivity trends and patterns
🔄 Real-time Sync: Instant updates across all devices via Supabase

🏗️ Architecture
productreevity/
├── 🖥️ frontend/                 # React + TypeScript
│   ├── src/
│   │   ├── components/         # UI components
│   │   │   ├── Tree/          # Apple tree visualization
│   │   │   ├── Timer/         # Pomodoro timer
│   │   │   ├── Tasks/         # Task management
│   │   │   └── Dashboard/     # Analytics views
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API service layer
│   │   └── utils/             # Helper functions
│   └── public/                # Static assets
│
├── 🔧 backend/                  # Flask + Python
│   ├── app.py                 # Main Flask application
│   ├── api/                   # API endpoints
│   │   ├── auth.py           # Authentication routes
│   │   ├── sessions.py       # Time tracking endpoints
│   │   ├── tasks.py          # Task management
│   │   ├── rewards.py        # Points & achievements
│   │   └── analytics.py      # User statistics
│   ├── models/                # Database models
│   │   ├── user.py
│   │   ├── session.py
│   │   ├── task.py
│   │   ├── tree.py
│   │   └── achievement.py
│   ├── services/              # Business logic
│   │   ├── gamification.py   # Point calculations
│   │   ├── tree_growth.py    # Tree progression logic
│   │   └── notifications.py  # Achievement alerts
│   └── utils/                 # Utilities
│       ├── decorators.py     # Auth decorators
│       └── validators.py     # Input validation
│
├── 📊 database/                # PostgreSQL schemas
│   ├── migrations/           # Database migrations
│   └── seeds/               # Initial data
│
└── 📱 mobile/                 # React Native (future)
💾 Database Design
Core Tables
sql-- Users table
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
🎮 Gamification System
Apple Tier System
pythonAPPLE_TIERS = {
    'bronze': {
        'min_duration': 15,    # minutes
        'points': 10,
        'growth_rate': 0.1
    },
    'silver': {
        'min_duration': 30,
        'points': 25,
        'growth_rate': 0.2
    },
    'gold': {
        'min_duration': 45,
        'points': 50,
        'growth_rate': 0.3
    },
    'diamond': {
        'min_duration': 60,
        'points': 100,
        'growth_rate': 0.5,
        'streak_required': 7  # Requires 7-day streak
    }
}
Point Calculation Algorithm
pythondef calculate_session_points(duration_minutes, streak_days, tasks_completed):
    base_points = duration_minutes * 0.5
    streak_multiplier = 1 + (streak_days * 0.1)  # 10% bonus per streak day
    task_bonus = tasks_completed * 5
    
    total_points = (base_points + task_bonus) * streak_multiplier
    return int(total_points)
Tree Growth Formula
pythondef calculate_tree_growth(total_productive_minutes, apple_count):
    # Logarithmic growth curve for realistic progression
    base_growth = math.log(total_productive_minutes + 1) * 10
    apple_boost = apple_count * 0.05
    
    growth_level = base_growth * (1 + apple_boost)
    return min(growth_level, 100)  # Cap at level 100
🔌 API Endpoints
Authentication
POST   /api/auth/register     # Create new account
POST   /api/auth/login        # Login user
POST   /api/auth/logout       # Logout user
GET    /api/auth/profile      # Get user profile
Sessions
POST   /api/sessions/start    # Start productivity session
PUT    /api/sessions/:id/end  # End session
GET    /api/sessions/active   # Get active session
GET    /api/sessions/history  # Get session history
Tasks
GET    /api/tasks            # Get all tasks
POST   /api/tasks            # Create new task
PUT    /api/tasks/:id        # Update task
DELETE /api/tasks/:id        # Delete task
PUT    /api/tasks/:id/complete # Mark task complete
Rewards & Analytics
GET    /api/rewards/tree     # Get tree status
GET    /api/rewards/achievements # Get achievements
GET    /api/analytics/summary # Get productivity summary
GET    /api/analytics/trends  # Get trend data

🚀 Backend Implementation Details
Real-time Updates with Supabase
pythonfrom supabase import create_client, Client
import os

class SupabaseService:
    def __init__(self):
        self.client: Client = create_client(
            os.getenv('SUPABASE_URL'),
            os.getenv('SUPABASE_KEY')
        )
    
    def subscribe_to_tree_updates(self, user_id, callback):
        """Subscribe to real-time tree growth updates"""
        return self.client.table('trees') \
            .on('UPDATE', callback) \
            .eq('user_id', user_id) \
            .subscribe()
Gamification Service
pythonclass GamificationService:
    def process_completed_session(self, user_id, session):
        """Process rewards for completed session"""
        # Calculate points
        points = self.calculate_points(session)
        
        # Determine apple tier
        apple_tier = self.determine_apple_tier(
            session.duration,
            user.current_streak
        )
        
        # Update tree
        self.grow_tree(user_id, apple_tier, points)
        
        # Check achievements
        self.check_achievements(user_id)
        
        return {
            'points_earned': points,
            'apple_earned': apple_tier,
            'new_achievements': achievements
        }
🎨 UI/UX Design Specifications
Color Palette
css:root {
    --primary-green: #4CAF50;      /* Healthy tree green */
    --secondary-brown: #8B4513;     /* Tree trunk brown */
    --accent-gold: #FFD700;         /* Gold apple */
    --bg-sky: #87CEEB;             /* Sky blue background */
    --text-primary: #333333;
    --text-secondary: #666666;
}
Tree Visualization States

Seedling (Level 1-20): Small sapling with few leaves
Young Tree (Level 21-50): Medium tree with branches
Mature Tree (Level 51-80): Full tree with many branches
Grand Tree (Level 81-100): Majestic tree with abundant apples

Animation Specifications

Tree growth: Smooth transition over 2 seconds
Apple appearance: Bounce animation (0.5s)
Point counter: Incremental count-up effect
Achievement unlock: Slide-in from right with confetti

🧪 Testing Strategy
Backend Testing
python# Example test for session points calculation
def test_calculate_session_points():
    service = GamificationService()
    
    # Test basic session
    points = service.calculate_points(
        duration=30,
        streak=0,
        tasks=0
    )
    assert points == 15
    
    # Test with streak bonus
    points = service.calculate_points(
        duration=30,
        streak=5,
        tasks=0
    )
    assert points == 22  # 15 * 1.5 streak multiplier
🚀 Getting Started
Prerequisites

Python 3.9+
Node.js 16+
PostgreSQL 14+
Supabase account

Backend Setup
bash# Clone repository
git clone https://github.com/huskycodingproject/productreevity.git
cd productreevity/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run migrations
flask db upgrade

# Start server
flask run
Frontend Setup
bashcd ../frontend

# Install dependencies
npm install

# Start development server
npm start

📈 Future Enhancements

Mobile App: React Native for iOS/Android
Social Features: Friends, leaderboards, challenges
AI Insights: ML-powered productivity recommendations
Integrations: Calendar sync, Spotify integration for focus music
Custom Themes: Different tree types and environments
Team Mode: Grow a forest together with your team

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
