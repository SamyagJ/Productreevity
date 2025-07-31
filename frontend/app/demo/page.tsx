"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TreePine, Play, Pause, RotateCcw, ArrowLeft, ArrowRight, PlayCircle, CheckCircle, Target } from "lucide-react"
import { RealisticTreeVisualization } from "@/components/realistic-tree-visualization"
import Link from "next/link"

export default function DemoPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [demoTree, setDemoTree] = useState({
    growthLevel: 5,
    totalApples: 0,
    redApples: 0,
    silverApples: 0,
    goldApples: 0,
    diamondApples: 0,
  })
  const [demoTimer, setDemoTimer] = useState(25 * 60)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [demoPoints, setDemoPoints] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)
  const [sessionCompleted, setSessionCompleted] = useState(false)
  const [completedTasks, setCompletedTasks] = useState<number[]>([])

  const demoSteps = [
    {
      title: "Welcome to Productreevity!",
      description: "Your productivity journey starts with a small seedling. Let's see how it grows!",
      tree: { growthLevel: 5, totalApples: 0, redApples: 0, silverApples: 0, goldApples: 0, diamondApples: 0 },
      points: 0,
    },
    {
      title: "Start Your First Focus Session",
      description: "Click the timer to begin a 25-minute focus session. Watch as your tree begins to grow!",
      tree: { growthLevel: 18, totalApples: 1, redApples: 1, silverApples: 0, goldApples: 0, diamondApples: 0 },
      points: 25,
    },
    {
      title: "Complete More Sessions",
      description: "As you complete more focus sessions, your tree grows bigger and earns more apples!",
      tree: { growthLevel: 38, totalApples: 5, redApples: 0, silverApples: 1, goldApples: 0, diamondApples: 0 },
      points: 125,
    },
    {
      title: "Build Consistency",
      description: "Maintain streaks to unlock higher-tier apples. Gold apples require dedication!",
      tree: { growthLevel: 62, totalApples: 12, redApples: 2, silverApples: 0, goldApples: 2, diamondApples: 0 },
      points: 350,
    },
    {
      title: "Achieve Mastery",
      description: "With consistent effort, your tree becomes magnificent with rare diamond apples!",
      tree: { growthLevel: 88, totalApples: 25, redApples: 0, silverApples: 0, goldApples: 0, diamondApples: 1 },
      points: 750,
    },
  ]

  useEffect(() => {
    const step = demoSteps[currentStep]
    setDemoTree(step.tree)
    setDemoPoints(step.points)
  }, [currentStep])

  // Demo timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTimerRunning && demoTimer > 0) {
      interval = setInterval(() => {
        setDemoTimer((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false)
            setSessionCompleted(true)
            // Simulate points earned
            setTimeout(() => {
              setDemoPoints(prev => prev + 10)
              if (currentStep < demoSteps.length - 1) {
                nextStep()
              }
            }, 1000)
          }
          return prev - 1
        })
      }, 50) // Faster for demo
    }
    return () => clearInterval(interval)
  }, [isTimerRunning, demoTimer])
  
  // Auto-play effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isAutoPlaying) {
      interval = setInterval(() => {
        if (currentStep < demoSteps.length - 1) {
          nextStep()
        } else {
          setCurrentStep(0)
        }
      }, 4000) // Change step every 4 seconds
    }
    return () => clearInterval(interval)
  }, [isAutoPlaying, currentStep])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const nextStep = () => {
    if (currentStep < demoSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning)
  }

  const resetTimer = () => {
    setIsTimerRunning(false)
    setDemoTimer(25 * 60)
    setSessionCompleted(false)
  }
  
  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying)
  }

  // Calculate tree level based on apple tiers (0-4)
  const calculateTreeLevel = () => {
    if (demoTree.diamondApples > 0) return 4 // Diamond
    if (demoTree.goldApples > 0) return 3 // Gold
    if (demoTree.silverApples > 0) return 2 // Silver
    if (demoTree.redApples > 0) return 1 // Red
    return 0 // Sapling (no apples)
  }

  const currentStepData = demoSteps[currentStep]

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <TreePine className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Productreevity Demo</h1>
                <p className="text-xs sm:text-sm text-gray-600">Experience the magic of gamified productivity</p>
              </div>
            </div>
            <Link href="/">
              <Button variant="outline" size="sm" className="sm:text-base">Back to Home</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* Demo Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Demo Progress</h2>
            <div className="flex items-center space-x-4">
              <Button
                size="sm"
                variant={isAutoPlaying ? "destructive" : "outline"}
                onClick={toggleAutoPlay}
                className="flex items-center space-x-2"
              >
                <PlayCircle className="h-4 w-4" />
                <span>{isAutoPlaying ? "Stop Auto-Play" : "Auto-Play"}</span>
              </Button>
              <Badge variant="secondary">
                Step {currentStep + 1} of {demoSteps.length}
              </Badge>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / demoSteps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 sm:gap-8">
          {/* Left Column - Tree & Info */}
          <div className="space-y-4 sm:space-y-6">
            {/* Current Step Info */}
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-green-700">{currentStepData.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{currentStepData.description}</p>
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <div className="text-center">
                    <p className="text-lg sm:text-2xl font-bold text-green-600">{demoPoints}</p>
                    <p className="text-xs sm:text-sm text-gray-600">Points</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg sm:text-2xl font-bold text-blue-600">{calculateTreeLevel()}</p>
                    <p className="text-xs sm:text-sm text-gray-600">Level</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg sm:text-2xl font-bold text-orange-600">{demoTree.totalApples}</p>
                    <p className="text-xs sm:text-sm text-gray-600">Apples</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tree Visualization */}
            <Card className="border-green-200 overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TreePine className="h-5 w-5 text-green-600" />
                  <span>Your Productivity Tree</span>
                  <Badge variant="secondary">Level {calculateTreeLevel()}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <RealisticTreeVisualization tree={demoTree} />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Interactive Demo */}
          <div className="space-y-4 sm:space-y-6">
            {/* Demo Timer */}
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle>Interactive Timer Demo</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4 sm:mb-6">
                  <svg className="w-24 h-24 sm:w-32 sm:h-32 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      className="text-gray-200"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 45}`}
                      strokeDashoffset={`${2 * Math.PI * 45 * (1 - (25 * 60 - demoTimer) / (25 * 60))}`}
                      className="text-green-500 transition-all duration-100"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg sm:text-2xl font-bold text-gray-900">{formatTime(demoTimer)}</span>
                  </div>
                </div>

                <div className="flex justify-center space-x-2 sm:space-x-4">
                  <Button onClick={toggleTimer} className="bg-green-600 hover:bg-green-700">
                    {isTimerRunning ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                    {isTimerRunning ? "Pause" : "Start"}
                  </Button>
                  <Button onClick={resetTimer} variant="outline">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Demo Tasks */}
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-green-600" />
                  <span>Today's Tasks</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Task Stats */}
                <div className="grid grid-cols-2 gap-2 sm:gap-4 text-center mb-4">
                  <div>
                    <p className="text-lg font-bold text-green-600">
                      {completedTasks.length}
                    </p>
                    <p className="text-xs text-gray-600">Completed</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-blue-600">
                      {completedTasks.reduce((sum, taskId) => {
                        const task = [
                          { id: 1, points: 1 },
                          { id: 2, points: 10 },
                          { id: 3, points: 5 },
                          { id: 4, points: 10 },
                        ].find(t => t.id === taskId)
                        return sum + (task?.points || 0)
                      }, 0)}
                    </p>
                    <p className="text-xs text-gray-600">Points Earned</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {[
                    { id: 1, title: "Complete morning meditation", points: 1, priority: "low" },
                    { id: 2, title: "Review project documentation", points: 10, priority: "high" },
                    { id: 3, title: "Team standup meeting", points: 5, priority: "medium" },
                    { id: 4, title: "Code review for PR #42", points: 10, priority: "high" },
                  ].map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${
                        completedTasks.includes(task.id)
                          ? "bg-green-50 border-green-200 opacity-75"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => {
                        if (!completedTasks.includes(task.id)) {
                          setCompletedTasks([...completedTasks, task.id])
                          setDemoPoints(prev => prev + task.points)
                          // Update tree based on points
                          const newTotalPoints = demoPoints + task.points
                          const totalRedApples = Math.floor(newTotalPoints / 10)
                          const diamondApples = Math.floor(totalRedApples / 125)
                          const remainingAfterDiamond = totalRedApples - (diamondApples * 125)
                          const goldApples = Math.floor(remainingAfterDiamond / 25)
                          const remainingAfterGold = remainingAfterDiamond - (goldApples * 25)
                          const silverApples = Math.floor(remainingAfterGold / 5)
                          const redApples = remainingAfterGold % 5
                          
                          setDemoTree(prev => ({
                            ...prev,
                            growthLevel: Math.min(100, prev.growthLevel + Math.floor(task.points / 5)),
                            totalApples: totalRedApples,
                            redApples,
                            silverApples,
                            goldApples,
                            diamondApples
                          }))
                        }
                      }}
                    >
                      <div className="w-4 h-4 flex items-center justify-center">
                        <div className={`w-3 h-3 rounded ${completedTasks.includes(task.id) ? "bg-green-500" : "border-2 border-gray-300"}`}>
                          {completedTasks.includes(task.id) && (
                            <CheckCircle className="h-3 w-3 text-white" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          completedTasks.includes(task.id) ? "line-through text-gray-500" : "text-gray-900"
                        }`}>
                          {task.title}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            task.priority === "high" ? "bg-red-500 text-white" :
                            task.priority === "medium" ? "bg-yellow-500 text-white" :
                            "bg-green-500 text-white"
                          }`}>
                            {task.priority}
                          </span>
                          <span className="text-xs text-gray-500">+{task.points} pts</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-4 text-center">
                  Try completing tasks to see your tree grow!
                </p>
              </CardContent>
            </Card>

            {/* Call to Action */}
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold text-green-800 mb-2">Ready to Start Growing?</h3>
                <p className="text-green-700 mb-4">Join thousands of users transforming their productivity</p>
                <Link href="/signup">
                  <Button className="bg-green-600 hover:bg-green-700 w-full">Create Your Account</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 sm:mt-8 space-y-4 sm:space-y-0">
          <Button
            onClick={prevStep}
            disabled={currentStep === 0}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2 bg-transparent w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Previous</span>
          </Button>

          <div className="flex space-x-2">
            {demoSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentStep ? "bg-green-500" : "bg-gray-300"
                }`}
              />
            ))}
          </div>

          <Button
            onClick={nextStep}
            disabled={currentStep === demoSteps.length - 1}
            size="sm"
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 w-full sm:w-auto"
          >
            <span>Next</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
