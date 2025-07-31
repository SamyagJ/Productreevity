"use client"

import { useEffect, useState } from "react"

interface TreeProps {
  tree: {
    growthLevel: number
    totalApples: number
    bronzeApples: number
    silverApples: number
    goldApples: number
    diamondApples: number
  }
}

export function EnhancedTreeVisualization({ tree }: TreeProps) {
  const [animatedLevel, setAnimatedLevel] = useState(0)
  const [showGrowthAnimation, setShowGrowthAnimation] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedLevel(tree.growthLevel)
      setShowGrowthAnimation(true)
    }, 500)
    return () => clearTimeout(timer)
  }, [tree.growthLevel])

  const getTreeStage = (level: number) => {
    if (level <= 20) return "seedling"
    if (level <= 40) return "young"
    if (level <= 70) return "mature"
    return "grand"
  }

  const treeStage = getTreeStage(animatedLevel)

  // Generate random positions for apples that look natural
  const generateApplePositions = (count: number, type: string) => {
    const positions = []
    for (let i = 0; i < count; i++) {
      // Create clusters of apples on branches
      const cluster = Math.floor(i / 3)
      const baseX = 20 + (cluster % 3) * 25
      const baseY = 25 + (cluster % 4) * 15

      positions.push({
        x: baseX + (Math.random() - 0.5) * 15,
        y: baseY + (Math.random() - 0.5) * 10,
        delay: i * 0.2,
        size: type === "diamond" ? 6 : type === "gold" ? 5 : 4,
      })
    }
    return positions
  }

  const bronzePositions = generateApplePositions(Math.min(tree.bronzeApples, 12), "bronze")
  const silverPositions = generateApplePositions(Math.min(tree.silverApples, 8), "silver")
  const goldPositions = generateApplePositions(Math.min(tree.goldApples, 6), "gold")
  const diamondPositions = generateApplePositions(Math.min(tree.diamondApples, 3), "diamond")

  return (
    <div className="relative flex flex-col items-center justify-center py-8 overflow-hidden">
      {/* Animated Sky Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-300 via-blue-200 to-green-100 rounded-lg">
        {/* Floating clouds */}
        <div className="absolute top-4 left-8 w-16 h-8 bg-white rounded-full opacity-70 animate-pulse"></div>
        <div
          className="absolute top-8 right-12 w-12 h-6 bg-white rounded-full opacity-60 animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-12 left-1/3 w-20 h-10 bg-white rounded-full opacity-50 animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>

        {/* Sun */}
        <div
          className="absolute top-6 right-8 w-12 h-12 bg-yellow-300 rounded-full shadow-lg animate-pulse"
          style={{ animationDelay: "0.5s" }}
        >
          <div className="absolute inset-1 bg-yellow-200 rounded-full"></div>
        </div>
      </div>

      {/* Ground with grass texture */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-green-600 via-green-400 to-green-200 rounded-b-lg">
        {/* Grass blades */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute bottom-0 w-1 bg-green-700 rounded-t-full animate-pulse"
            style={{
              left: `${5 + i * 4.5}%`,
              height: `${8 + Math.random() * 8}px`,
              animationDelay: `${i * 0.1}s`,
              animationDuration: "3s",
            }}
          />
        ))}
      </div>

      {/* Tree Container */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Tree Crown - Much more detailed */}
        <div
          className={`relative transition-all duration-2000 ease-out ${
            treeStage === "seedling"
              ? "h-24 w-16"
              : treeStage === "young"
                ? "h-40 w-32"
                : treeStage === "mature"
                  ? "h-56 w-48"
                  : "h-72 w-64"
          }`}
        >
          {/* Main Foliage Layers with realistic tree shape */}
          <div className="absolute inset-0">
            {/* Seedling Stage */}
            {treeStage === "seedling" && (
              <>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-green-500 rounded-full shadow-md"></div>
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-green-600 rounded-full shadow-sm"></div>
              </>
            )}

            {/* Young Tree Stage */}
            {treeStage === "young" && (
              <>
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-20 h-20 bg-green-500 rounded-full shadow-lg opacity-90"></div>
                <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 -translate-x-6 w-16 h-16 bg-green-600 rounded-full shadow-md opacity-80"></div>
                <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 translate-x-6 w-16 h-16 bg-green-600 rounded-full shadow-md opacity-80"></div>
                <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-18 h-18 bg-green-400 rounded-full shadow-sm opacity-70"></div>
              </>
            )}

            {/* Mature Tree Stage */}
            {treeStage === "mature" && (
              <>
                {/* Main crown */}
                <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-green-500 rounded-full shadow-xl opacity-90"></div>

                {/* Side branches */}
                <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 -translate-x-8 w-24 h-24 bg-green-600 rounded-full shadow-lg opacity-85"></div>
                <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 translate-x-8 w-24 h-24 bg-green-600 rounded-full shadow-lg opacity-85"></div>

                {/* Upper layers */}
                <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 w-28 h-28 bg-green-400 rounded-full shadow-md opacity-75"></div>
                <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2 -translate-x-4 w-20 h-20 bg-green-500 rounded-full shadow-sm opacity-70"></div>
                <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2 translate-x-4 w-20 h-20 bg-green-500 rounded-full shadow-sm opacity-70"></div>

                {/* Top */}
                <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-green-400 rounded-full shadow-sm opacity-65"></div>
              </>
            )}

            {/* Grand Tree Stage */}
            {treeStage === "grand" && (
              <>
                {/* Massive main crown */}
                <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-40 h-40 bg-green-500 rounded-full shadow-2xl opacity-95"></div>

                {/* Large side branches */}
                <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 -translate-x-12 w-32 h-32 bg-green-600 rounded-full shadow-xl opacity-90"></div>
                <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 translate-x-12 w-32 h-32 bg-green-600 rounded-full shadow-xl opacity-90"></div>

                {/* Multiple upper layers */}
                <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 w-36 h-36 bg-green-400 rounded-full shadow-lg opacity-80"></div>
                <div className="absolute bottom-36 left-1/2 transform -translate-x-1/2 -translate-x-6 w-28 h-28 bg-green-500 rounded-full shadow-md opacity-75"></div>
                <div className="absolute bottom-36 left-1/2 transform -translate-x-1/2 translate-x-6 w-28 h-28 bg-green-500 rounded-full shadow-md opacity-75"></div>

                {/* Crown top layers */}
                <div className="absolute bottom-44 left-1/2 transform -translate-x-1/2 w-24 h-24 bg-green-400 rounded-full shadow-sm opacity-70"></div>
                <div className="absolute bottom-48 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-green-300 rounded-full shadow-sm opacity-65"></div>
              </>
            )}
          </div>

          {/* Enhanced Apples with 3D effect and glow */}
          <div className="absolute inset-0">
            {/* Bronze Apples */}
            {bronzePositions.map((pos, i) => (
              <div
                key={`bronze-${i}`}
                className="absolute rounded-full shadow-lg transform hover:scale-110 transition-transform cursor-pointer"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  width: `${pos.size * 3}px`,
                  height: `${pos.size * 3}px`,
                  background: "radial-gradient(circle at 30% 30%, #fbbf24, #d97706, #92400e)",
                  animation: `bounce 2s infinite ${pos.delay}s, glow 3s ease-in-out infinite alternate`,
                  boxShadow: "0 2px 8px rgba(217, 119, 6, 0.3), inset 0 1px 0 rgba(251, 191, 36, 0.5)",
                }}
              >
                <div className="absolute top-0 left-1/3 w-1/3 h-1/3 bg-yellow-200 rounded-full opacity-60"></div>
              </div>
            ))}

            {/* Silver Apples */}
            {silverPositions.map((pos, i) => (
              <div
                key={`silver-${i}`}
                className="absolute rounded-full shadow-lg transform hover:scale-110 transition-transform cursor-pointer"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  width: `${pos.size * 3}px`,
                  height: `${pos.size * 3}px`,
                  background: "radial-gradient(circle at 30% 30%, #e5e7eb, #9ca3af, #6b7280)",
                  animation: `bounce 2.5s infinite ${pos.delay}s, glow 3.5s ease-in-out infinite alternate`,
                  boxShadow: "0 2px 8px rgba(156, 163, 175, 0.4), inset 0 1px 0 rgba(229, 231, 235, 0.6)",
                }}
              >
                <div className="absolute top-0 left-1/3 w-1/3 h-1/3 bg-gray-100 rounded-full opacity-70"></div>
              </div>
            ))}

            {/* Gold Apples */}
            {goldPositions.map((pos, i) => (
              <div
                key={`gold-${i}`}
                className="absolute rounded-full shadow-xl transform hover:scale-110 transition-transform cursor-pointer"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  width: `${pos.size * 3}px`,
                  height: `${pos.size * 3}px`,
                  background: "radial-gradient(circle at 30% 30%, #fde047, #eab308, #ca8a04)",
                  animation: `bounce 3s infinite ${pos.delay}s, goldGlow 2s ease-in-out infinite alternate`,
                  boxShadow: "0 4px 12px rgba(234, 179, 8, 0.5), inset 0 2px 0 rgba(253, 224, 71, 0.7)",
                }}
              >
                <div className="absolute top-0 left-1/3 w-1/3 h-1/3 bg-yellow-100 rounded-full opacity-80"></div>
                <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-yellow-400"></div>
              </div>
            ))}

            {/* Diamond Apples */}
            {diamondPositions.map((pos, i) => (
              <div
                key={`diamond-${i}`}
                className="absolute rounded-full shadow-2xl transform hover:scale-125 transition-transform cursor-pointer"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  width: `${pos.size * 3}px`,
                  height: `${pos.size * 3}px`,
                  background: "radial-gradient(circle at 30% 30%, #dbeafe, #3b82f6, #1e40af)",
                  animation: `bounce 3.5s infinite ${pos.delay}s, diamondGlow 1.5s ease-in-out infinite alternate`,
                  boxShadow: "0 6px 16px rgba(59, 130, 246, 0.6), inset 0 2px 0 rgba(219, 234, 254, 0.8)",
                }}
              >
                <div className="absolute top-0 left-1/3 w-1/3 h-1/3 bg-blue-100 rounded-full opacity-90"></div>
                <div className="absolute inset-0 rounded-full animate-ping opacity-30 bg-blue-400"></div>
                <div className="absolute inset-1 rounded-full animate-pulse opacity-40 bg-white"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Tree Trunk with bark texture */}
        <div
          className={`bg-gradient-to-b from-amber-700 to-amber-900 rounded-t-lg shadow-lg transition-all duration-2000 ${
            treeStage === "seedling"
              ? "w-2 h-8"
              : treeStage === "young"
                ? "w-4 h-16"
                : treeStage === "mature"
                  ? "w-6 h-24"
                  : "w-8 h-32"
          }`}
        >
          {/* Bark texture lines */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute left-0 top-1/4 right-0 h-px bg-amber-800"></div>
            <div className="absolute left-0 top-1/2 right-0 h-px bg-amber-800"></div>
            <div className="absolute left-0 top-3/4 right-0 h-px bg-amber-800"></div>
          </div>
        </div>

        {/* Tree roots */}
        {treeStage !== "seedling" && (
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-2">
            <div className="w-16 h-2 bg-amber-800 rounded-full opacity-60"></div>
            <div className="absolute -left-2 top-1 w-8 h-1 bg-amber-700 rounded-full opacity-40 transform -rotate-12"></div>
            <div className="absolute -right-2 top-1 w-8 h-1 bg-amber-700 rounded-full opacity-40 transform rotate-12"></div>
          </div>
        )}
      </div>

      {/* Enhanced Growth Progress with particle effects */}
      <div className="relative z-10 mt-6 w-full max-w-xs">
        <div className="flex justify-between text-sm text-gray-700 mb-2 font-medium">
          <span>Growth Level</span>
          <span className="text-green-600">{animatedLevel}/100</span>
        </div>
        <div className="relative w-full bg-gray-200 rounded-full h-3 shadow-inner">
          <div
            className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-2000 ease-out shadow-sm relative overflow-hidden"
            style={{ width: `${animatedLevel}%` }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
          </div>
          {/* Growth particles */}
          {showGrowthAnimation && (
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-green-400 rounded-full animate-ping"
                  style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: "1s",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes glow {
          0% { box-shadow: 0 2px 8px rgba(217, 119, 6, 0.3), inset 0 1px 0 rgba(251, 191, 36, 0.5); }
          100% { box-shadow: 0 4px 12px rgba(217, 119, 6, 0.5), inset 0 2px 0 rgba(251, 191, 36, 0.7); }
        }
        
        @keyframes goldGlow {
          0% { box-shadow: 0 4px 12px rgba(234, 179, 8, 0.5), inset 0 2px 0 rgba(253, 224, 71, 0.7); }
          100% { box-shadow: 0 6px 16px rgba(234, 179, 8, 0.7), inset 0 3px 0 rgba(253, 224, 71, 0.9), 0 0 20px rgba(234, 179, 8, 0.3); }
        }
        
        @keyframes diamondGlow {
          0% { box-shadow: 0 6px 16px rgba(59, 130, 246, 0.6), inset 0 2px 0 rgba(219, 234, 254, 0.8); }
          100% { box-shadow: 0 8px 20px rgba(59, 130, 246, 0.8), inset 0 3px 0 rgba(219, 234, 254, 1), 0 0 25px rgba(59, 130, 246, 0.4); }
        }
      `}</style>
    </div>
  )
}
