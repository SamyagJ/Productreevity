import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Timer, TreePine, Target, Trophy, BarChart3 } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 to-green-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TreePine className="h-8 w-8 text-green-600" />
            <span className="text-2xl font-bold text-green-800">Productreevity</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-green-600 hover:bg-green-700">Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Grow Your Productivity,
            <br />
            <span className="text-green-600">Grow Your Tree</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Transform time management into an engaging, rewarding experience through visual growth and achievement
            systems. Watch your virtual apple tree flourish as you complete productive work sessions.
          </p>

          {/* Tree Illustration */}
          <div className="relative mb-12">
            <div className="w-64 h-64 mx-auto bg-gradient-to-b from-green-400 to-green-600 rounded-full opacity-20"></div>
            <TreePine className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-32 w-32 text-green-600" />
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
              <div className="flex space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded-full animate-bounce"></div>
                <div
                  className="w-4 h-4 bg-red-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-4 h-4 bg-orange-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 px-8">
                Start Growing Today
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="px-8 bg-transparent">
                Watch Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Key Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-green-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <TreePine className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Dynamic Tree Growth</h3>
              <p className="text-gray-600">Your apple tree grows in real-time as you complete productive sessions</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center space-x-1 mb-4">
                <div className="w-3 h-3 bg-amber-600 rounded-full"></div>
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Tiered Apple System</h3>
              <p className="text-gray-600">
                Earn Red, Silver, Gold, and Diamond apples based on productivity streaks
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <Timer className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Smart Time Tracking</h3>
              <p className="text-gray-600">Pomodoro-inspired sessions with customizable work/break intervals</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <Target className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Task Management</h3>
              <p className="text-gray-600">Create, organize, and complete tasks with point rewards</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <Trophy className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Achievement System</h3>
              <p className="text-gray-600">Unlock badges and rewards for consistency and milestones</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <BarChart3 className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Analytics Dashboard</h3>
              <p className="text-gray-600">Visualize productivity trends and patterns</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-green-600 text-white py-8 sm:py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-4">Ready to Grow Your Productivity?</h2>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="px-8 sm:px-12 py-3 sm:py-4 text-base sm:text-lg">
              Start Your Journey
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <TreePine className="h-6 w-6" />
            <span className="text-xl font-bold">Productreevity</span>
          </div>
          <p className="text-gray-400">Built by the Husky Coding Project team at the University of Washington</p>
        </div>
      </footer>
    </div>
  )
}
