"use client"

import { useEffect, useState } from "react"

interface TreeProps {
  tree: {
    growthLevel: number
    totalApples: number
    redApples: number
    silverApples: number
    goldApples: number
    diamondApples: number
  }
  onTreeUpdate?: (newTree: any) => void
}

export function RealisticTreeVisualization({ tree, onTreeUpdate }: TreeProps) {
  const [animatedLevel, setAnimatedLevel] = useState(tree.growthLevel)
  const [animatedApples, setAnimatedApples] = useState(tree)
  const [newAppleAnimation, setNewAppleAnimation] = useState<string | null>(null)

  useEffect(() => {
    // Animate level changes
    const levelTimer = setTimeout(() => {
      setAnimatedLevel(tree.growthLevel)
    }, 300)

    // Animate apple changes with delay for visual effect
    const appleTimer = setTimeout(() => {
      // Check if new apples were added
      const hasNewApples =
        tree.redApples > animatedApples.redApples ||
        tree.silverApples > animatedApples.silverApples ||
        tree.goldApples > animatedApples.goldApples ||
        tree.diamondApples > animatedApples.diamondApples

      if (hasNewApples) {
        // Determine which type of apple was added
        if (tree.diamondApples > animatedApples.diamondApples) {
          setNewAppleAnimation("diamond")
        } else if (tree.goldApples > animatedApples.goldApples) {
          setNewAppleAnimation("gold")
        } else if (tree.silverApples > animatedApples.silverApples) {
          setNewAppleAnimation("silver")
        } else if (tree.redApples > animatedApples.redApples) {
          setNewAppleAnimation("red")
        }

        // Clear animation after 2 seconds
        setTimeout(() => setNewAppleAnimation(null), 2000)
      }

      setAnimatedApples(tree)
    }, 600)

    return () => {
      clearTimeout(levelTimer)
      clearTimeout(appleTimer)
    }
  }, [tree, animatedApples])

  const getTreeStage = (tree: any) => {
    const { redApples, silverApples, goldApples, diamondApples } = tree
    
    // Tree stages based on apple progression
    if (diamondApples > 0) return "diamond"
    if (goldApples > 0) return "gold" 
    if (silverApples > 0) return "silver"
    if (redApples > 0) return "red"
    return "sapling"
  }

  const treeStage = getTreeStage(animatedApples)
  
  // Calculate tree progress (0-4 scale for stages)
  const getTreeProgress = (tree: any) => {
    const { redApples, silverApples, goldApples, diamondApples } = tree
    
    if (diamondApples > 0) return 4
    if (goldApples > 0) return 3
    if (silverApples > 0) return 2
    if (redApples > 0) return 1
    return 0
  }
  
  const treeProgress = getTreeProgress(animatedApples)
  const progressPercentage = (treeProgress / 4) * 100

  // Generate realistic apple positions based on tree structure
  const generateRealisticApplePositions = (count: number, type: string) => {
    const positions = []
    const stage = treeStage

    // Define branch zones based on tree stage - better boundaries and bottom coverage
    let branchZones = []

    if (stage === "sapling") {
      branchZones = [
        { x: 50, y: 50, radius: 6, weight: 1.0 }, // Center small crown
        { x: 45, y: 55, radius: 4, weight: 0.8 }, // Left small branch
        { x: 55, y: 55, radius: 4, weight: 0.8 }, // Right small branch
        { x: 50, y: 60, radius: 3, weight: 0.6 }, // Bottom center
      ]
    } else if (stage === "young") {
      branchZones = [
        { x: 50, y: 45, radius: 8, weight: 1.0 }, // Main crown
        { x: 42, y: 50, radius: 6, weight: 0.9 }, // Left branch
        { x: 58, y: 50, radius: 6, weight: 0.9 }, // Right branch
        { x: 50, y: 35, radius: 5, weight: 0.7 }, // Top center
        { x: 38, y: 58, radius: 5, weight: 0.8 }, // Lower left
        { x: 62, y: 58, radius: 5, weight: 0.8 }, // Lower right
        { x: 50, y: 62, radius: 4, weight: 0.7 }, // Bottom center
      ]
    } else if (stage === "mature") {
      branchZones = [
        { x: 50, y: 50, radius: 10, weight: 1.0 }, // Main crown center
        { x: 38, y: 52, radius: 8, weight: 0.9 }, // Left major branch
        { x: 62, y: 52, radius: 8, weight: 0.9 }, // Right major branch
        { x: 50, y: 35, radius: 7, weight: 0.8 }, // Upper center
        { x: 42, y: 40, radius: 6, weight: 0.7 }, // Upper left
        { x: 58, y: 40, radius: 6, weight: 0.7 }, // Upper right
        { x: 32, y: 60, radius: 6, weight: 0.8 }, // Lower left
        { x: 68, y: 60, radius: 6, weight: 0.8 }, // Lower right
        { x: 50, y: 65, radius: 5, weight: 0.9 }, // Bottom center
        { x: 40, y: 68, radius: 4, weight: 0.7 }, // Bottom left
        { x: 60, y: 68, radius: 4, weight: 0.7 }, // Bottom right
      ]
    } else if (stage === "grand") {
      branchZones = [
        { x: 50, y: 55, radius: 12, weight: 1.0 }, // Main crown center
        { x: 35, y: 55, radius: 10, weight: 0.9 }, // Left major branch
        { x: 65, y: 55, radius: 10, weight: 0.9 }, // Right major branch
        { x: 50, y: 35, radius: 8, weight: 0.8 }, // Upper center
        { x: 40, y: 42, radius: 7, weight: 0.8 }, // Upper left
        { x: 60, y: 42, radius: 7, weight: 0.8 }, // Upper right
        { x: 28, y: 58, radius: 7, weight: 0.7 }, // Mid left
        { x: 72, y: 58, radius: 7, weight: 0.7 }, // Mid right
        { x: 25, y: 68, radius: 6, weight: 0.8 }, // Lower left
        { x: 75, y: 68, radius: 6, weight: 0.8 }, // Lower right
        { x: 50, y: 70, radius: 8, weight: 0.9 }, // Bottom center
        { x: 38, y: 72, radius: 5, weight: 0.8 }, // Bottom left
        { x: 62, y: 72, radius: 5, weight: 0.8 }, // Bottom right
        { x: 45, y: 25, radius: 5, weight: 0.6 }, // Top left
        { x: 55, y: 25, radius: 5, weight: 0.6 }, // Top right
      ]
    } else {
      // ancient
      branchZones = [
        { x: 50, y: 60, radius: 14, weight: 1.0 }, // Massive main crown
        { x: 30, y: 60, radius: 12, weight: 0.9 }, // Left major branch
        { x: 70, y: 60, radius: 12, weight: 0.9 }, // Right major branch
        { x: 50, y: 35, radius: 10, weight: 0.8 }, // Upper center
        { x: 38, y: 45, radius: 8, weight: 0.8 }, // Upper left
        { x: 62, y: 45, radius: 8, weight: 0.8 }, // Upper right
        { x: 22, y: 58, radius: 8, weight: 0.7 }, // Mid left
        { x: 78, y: 58, radius: 8, weight: 0.7 }, // Mid right
        { x: 20, y: 72, radius: 7, weight: 0.8 }, // Lower left
        { x: 80, y: 72, radius: 7, weight: 0.8 }, // Lower right
        { x: 50, y: 75, radius: 10, weight: 0.9 }, // Bottom center - main
        { x: 35, y: 78, radius: 6, weight: 0.8 }, // Bottom left
        { x: 65, y: 78, radius: 6, weight: 0.8 }, // Bottom right
        { x: 42, y: 25, radius: 6, weight: 0.6 }, // Top left
        { x: 58, y: 25, radius: 6, weight: 0.6 }, // Top right
        { x: 15, y: 45, radius: 5, weight: 0.5 }, // Far left
        { x: 85, y: 45, radius: 5, weight: 0.5 }, // Far right
        { x: 50, y: 15, radius: 6, weight: 0.5 }, // Very top
      ]
    }

    // Create weighted zone selection for more natural distribution
    const totalWeight = branchZones.reduce((sum, zone) => sum + zone.weight, 0)

    for (let i = 0; i < count; i++) {
      // Select a branch zone based on weights
      let randomWeight = Math.random() * totalWeight
      let selectedZone = branchZones[0]

      for (const zone of branchZones) {
        randomWeight -= zone.weight
        if (randomWeight <= 0) {
          selectedZone = zone
          break
        }
      }

      // Generate position within the selected zone with natural variation
      const angle = Math.random() * Math.PI * 2
      const distance = Math.random() * selectedZone.radius

      // Reduced natural variation to keep apples closer to branches
      const naturalVariation = (Math.random() - 0.5) * 2

      // Calculate position with better boundary checking
      let x = selectedZone.x + Math.cos(angle) * distance + naturalVariation
      let y = selectedZone.y + Math.sin(angle) * distance + naturalVariation

      // Strict boundary enforcement based on tree stage
      const treeBounds = {
        sapling: { minX: 40, maxX: 60, minY: 35, maxY: 65 },
        red: { minX: 30, maxX: 70, minY: 25, maxY: 70 },
        silver: { minX: 25, maxX: 75, minY: 20, maxY: 75 },
        gold: { minX: 20, maxX: 80, minY: 15, maxY: 80 },
        diamond: { minX: 15, maxX: 85, minY: 10, maxY: 85 },
      }

      const bounds = treeBounds[stage]
      x = Math.max(bounds.minX, Math.min(bounds.maxX, x))
      y = Math.max(bounds.minY, Math.min(bounds.maxY, y))

      // Additional check to ensure apples are within foliage areas
      // Create a more restrictive elliptical boundary for each stage
      const centerX = 50
      const centerY =
        stage === "sapling" ? 50 : stage === "red" ? 48 : stage === "silver" ? 50 : stage === "gold" ? 55 : 60

      const radiusX =
        stage === "sapling" ? 12 : stage === "red" ? 18 : stage === "silver" ? 24 : stage === "gold" ? 30 : 35
      const radiusY =
        stage === "sapling" ? 15 : stage === "red" ? 22 : stage === "silver" ? 28 : stage === "gold" ? 32 : 38

      // Check if point is within ellipse (foliage area)
      const ellipseCheck = Math.pow((x - centerX) / radiusX, 2) + Math.pow((y - centerY) / radiusY, 2)

      // If outside ellipse, pull it back towards center
      if (ellipseCheck > 1) {
        const factor = 0.9 / Math.sqrt(ellipseCheck)
        x = centerX + (x - centerX) * factor
        y = centerY + (y - centerY) * factor
      }

      positions.push({
        x,
        y,
        delay: i * 0.15 + Math.random() * 0.1,
        size: type === "diamond" ? 8 : type === "gold" ? 7 : type === "silver" ? 6 : 5,
        rotation: Math.random() * 360,
        isNew: newAppleAnimation === type && i === count - 1,
        bobDelay: Math.random() * 2,
        bobDuration: 2 + Math.random() * 1,
      })
    }

    return positions
  }

  const redPositions = generateRealisticApplePositions(animatedApples.redApples, "red")
  const silverPositions = generateRealisticApplePositions(animatedApples.silverApples, "silver")
  const goldPositions = generateRealisticApplePositions(animatedApples.goldApples, "gold")
  const diamondPositions = generateRealisticApplePositions(animatedApples.diamondApples, "diamond")

  return (
    <div className="relative w-full h-[600px] overflow-hidden rounded-xl shadow-2xl">
      {/* Realistic Natural Background */}
      <div className="absolute inset-0">
        {/* Sky gradient with realistic colors */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-400 via-blue-300 to-blue-200"></div>

        {/* Distant mountains */}
        <div className="absolute bottom-0 left-0 right-0 h-32">
          <svg viewBox="0 0 400 128" className="w-full h-full">
            <path
              d="M0,128 L0,80 L50,60 L100,70 L150,45 L200,55 L250,35 L300,50 L350,40 L400,60 L400,128 Z"
              fill="rgba(99, 102, 241, 0.3)"
            />
            <path
              d="M0,128 L0,90 L80,75 L120,85 L180,65 L240,75 L300,60 L400,80 L400,128 Z"
              fill="rgba(99, 102, 241, 0.2)"
            />
          </svg>
        </div>

        {/* Animated clouds */}
        <div className="absolute top-8 left-0 w-full h-24 overflow-hidden">
          <div className="relative w-full h-full">
            <div className="absolute top-2 animate-float-slow" style={{ left: "10%" }}>
              <svg width="80" height="40" viewBox="0 0 80 40">
                <ellipse cx="20" cy="25" rx="15" ry="10" fill="rgba(255,255,255,0.8)" />
                <ellipse cx="35" cy="20" rx="20" ry="12" fill="rgba(255,255,255,0.9)" />
                <ellipse cx="50" cy="25" rx="15" ry="10" fill="rgba(255,255,255,0.8)" />
              </svg>
            </div>
            <div className="absolute top-6 animate-float-slower" style={{ left: "60%" }}>
              <svg width="100" height="50" viewBox="0 0 100 50">
                <ellipse cx="25" cy="30" rx="20" ry="15" fill="rgba(255,255,255,0.7)" />
                <ellipse cx="45" cy="25" rx="25" ry="18" fill="rgba(255,255,255,0.8)" />
                <ellipse cx="65" cy="30" rx="18" ry="12" fill="rgba(255,255,255,0.7)" />
              </svg>
            </div>
          </div>
        </div>

        {/* Sun with rays */}
        <div className="absolute top-12 right-16">
          <div className="relative w-16 h-16">
            {/* Sun rays */}
            <div className="absolute inset-0 animate-spin-slow">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-6 bg-yellow-300 rounded-full opacity-60"
                  style={{
                    top: "-12px",
                    left: "50%",
                    transformOrigin: "50% 44px",
                    transform: `translateX(-50%) rotate(${i * 45}deg)`,
                  }}
                />
              ))}
            </div>
            {/* Sun body */}
            <div className="absolute inset-2 bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-full shadow-lg">
              <div className="absolute inset-1 bg-gradient-to-br from-yellow-100 to-yellow-300 rounded-full opacity-80"></div>
            </div>
          </div>
        </div>

        {/* Ground with realistic grass */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-green-800 via-green-600 to-green-400">
          {/* Grass texture */}
          <div className="absolute inset-0 opacity-60">
            {Array.from({ length: 100 }).map((_, i) => (
              <div
                key={i}
                className="absolute bottom-0 bg-green-700 rounded-t-full animate-sway"
                style={{
                  left: `${i}%`,
                  width: "2px",
                  height: `${15 + Math.random() * 20}px`,
                  animationDelay: `${i * 0.02}s`,
                  animationDuration: `${3 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>

          {/* Flowers scattered in grass */}
          {Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className="absolute bottom-2"
              style={{
                left: `${10 + Math.random() * 80}%`,
                transform: `scale(${0.5 + Math.random() * 0.5})`,
              }}
            >
              <div
                className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.3}s` }}
              >
                <div className="absolute inset-0.5 bg-white rounded-full opacity-80"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Tree - Much Larger and More Realistic */}
      <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-10">
        {/* Tree Trunk - Realistic bark texture */}
        <div
          className={`relative bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 transition-all duration-2000 ease-out ${
            treeStage === "sapling"
              ? "w-4 h-12"
              : treeStage === "red"
                ? "w-6 h-20"
                : treeStage === "silver"
                  ? "w-8 h-28"
                  : treeStage === "gold"
                    ? "w-10 h-36"
                    : "w-12 h-44"
          }`}
          style={{
            borderRadius: "40% 40% 20% 20%",
            boxShadow: "inset -4px 0 8px rgba(0,0,0,0.3), inset 4px 0 8px rgba(255,255,255,0.1)",
          }}
        >
          {/* Bark texture details */}
          <div className="absolute inset-0 opacity-20">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="absolute left-0 right-0 h-px bg-amber-950" style={{ top: `${15 + i * 12}%` }} />
            ))}
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="absolute top-0 bottom-0 w-px bg-amber-950" style={{ left: `${25 + i * 25}%` }} />
            ))}
          </div>

          {/* Tree roots */}
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-2">
              <div className="w-6 h-8 bg-amber-800 rounded-full transform -rotate-12 opacity-80"></div>
              <div className="w-4 h-6 bg-amber-800 rounded-full transform rotate-12 opacity-80"></div>
              <div className="w-5 h-7 bg-amber-800 rounded-full transform -rotate-6 opacity-80"></div>
            </div>
          </div>
        </div>

        {/* Tree Crown - Massive and Realistic */}
        <div
          className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 transition-all duration-2000 ease-out ${
            treeStage === "sapling"
              ? "w-24 h-24 -translate-y-12"
              : treeStage === "red"
                ? "w-32 h-32 -translate-y-16"
                : treeStage === "silver"
                  ? "w-40 h-40 -translate-y-20"
                  : treeStage === "gold"
                    ? "w-48 h-48 -translate-y-24"
                    : "w-56 h-56 -translate-y-28"
          }`}
        >
          {/* Realistic foliage layers */}
          <div className="absolute inset-0">
            {/* Base layer - largest */}
            <div
              className="absolute bottom-0 left-1/2 transform -translate-x-1/2 rounded-full opacity-95"
              style={{
                width: "100%",
                height: "60%",
                background: "radial-gradient(ellipse at center bottom, #22c55e 0%, #16a34a 50%, #15803d 100%)",
                boxShadow: "inset 0 -20px 40px rgba(0,0,0,0.2)",
              }}
            />

            {/* Middle layers */}
            <div
              className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 rounded-full opacity-90"
              style={{
                width: "85%",
                height: "50%",
                background: "radial-gradient(ellipse at center, #22c55e 0%, #16a34a 70%, #15803d 100%)",
                boxShadow: "inset 0 -15px 30px rgba(0,0,0,0.15)",
              }}
            />

            <div
              className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2 rounded-full opacity-85"
              style={{
                width: "70%",
                height: "40%",
                background: "radial-gradient(ellipse at center, #34d399 0%, #22c55e 60%, #16a34a 100%)",
                boxShadow: "inset 0 -10px 20px rgba(0,0,0,0.1)",
              }}
            />

            {/* Top layer */}
            <div
              className="absolute bottom-1/2 left-1/2 transform -translate-x-1/2 rounded-full opacity-80"
              style={{
                width: "50%",
                height: "30%",
                background: "radial-gradient(ellipse at center, #6ee7b7 0%, #34d399 50%, #22c55e 100%)",
                boxShadow: "inset 0 -5px 15px rgba(0,0,0,0.1)",
              }}
            />

            {/* Highlight spots for realism */}
            <div
              className="absolute top-1/4 left-1/3 w-8 h-8 bg-green-200 rounded-full opacity-30 animate-pulse"
              style={{ animationDuration: "4s" }}
            />
            <div
              className="absolute top-1/3 right-1/4 w-6 h-6 bg-green-200 rounded-full opacity-25 animate-pulse"
              style={{ animationDuration: "5s", animationDelay: "1s" }}
            />
          </div>

          {/* Realistic Apples with 3D effect */}
          <div className="absolute inset-0">
            {/* Red Apples */}
            {redPositions.map((pos, i) => (
              <div
                key={`red-${i}`}
                className={`absolute transform transition-all duration-500 hover:scale-125 cursor-pointer ${
                  pos.isNew ? "animate-bounce-in" : ""
                }`}
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: `translate(-50%, -50%) rotate(${pos.rotation}deg)`,
                  animation: pos.isNew
                    ? `bounce-in 1s ease-out, gentle-bob ${pos.bobDuration}s ease-in-out infinite ${pos.bobDelay}s`
                    : `gentle-bob ${pos.bobDuration}s ease-in-out infinite ${pos.bobDelay}s`,
                }}
              >
                <div
                  className="relative rounded-full shadow-lg"
                  style={{
                    width: `${pos.size * 4}px`,
                    height: `${pos.size * 4}px`,
                    background: "radial-gradient(circle at 30% 20%, #ef4444, #dc2626, #b91c1c, #991b1b)",
                    boxShadow: "0 4px 12px rgba(239, 68, 68, 0.4), inset 2px -2px 4px rgba(0,0,0,0.2)",
                  }}
                >
                  {/* Apple highlight */}
                  <div
                    className="absolute rounded-full opacity-60"
                    style={{
                      top: "15%",
                      left: "25%",
                      width: "40%",
                      height: "30%",
                      background: "radial-gradient(ellipse, rgba(255,255,255,0.8) 0%, transparent 70%)",
                    }}
                  />
                  {/* Apple stem */}
                  <div
                    className="absolute bg-amber-800 rounded-full"
                    style={{
                      top: "-2px",
                      left: "50%",
                      width: "2px",
                      height: "4px",
                      transform: "translateX(-50%)",
                    }}
                  />
                </div>
              </div>
            ))}

            {/* Silver Apples */}
            {silverPositions.map((pos, i) => (
              <div
                key={`silver-${i}`}
                className={`absolute transform transition-all duration-500 hover:scale-125 cursor-pointer ${
                  pos.isNew ? "animate-bounce-in" : ""
                }`}
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: `translate(-50%, -50%) rotate(${pos.rotation}deg)`,
                  animation: pos.isNew
                    ? `bounce-in 1s ease-out, gentle-bob ${pos.bobDuration}s ease-in-out infinite ${pos.bobDelay}s`
                    : `gentle-bob ${pos.bobDuration}s ease-in-out infinite ${pos.bobDelay}s`,
                }}
              >
                <div
                  className="relative rounded-full shadow-lg"
                  style={{
                    width: `${pos.size * 4}px`,
                    height: `${pos.size * 4}px`,
                    background: "radial-gradient(circle at 30% 20%, #e5e7eb, #d1d5db, #9ca3af, #6b7280)",
                    boxShadow: "0 4px 12px rgba(156, 163, 175, 0.5), inset 2px -2px 4px rgba(0,0,0,0.2)",
                  }}
                >
                  <div
                    className="absolute rounded-full opacity-70"
                    style={{
                      top: "15%",
                      left: "25%",
                      width: "40%",
                      height: "30%",
                      background: "radial-gradient(ellipse, rgba(255,255,255,0.9) 0%, transparent 70%)",
                    }}
                  />
                  <div
                    className="absolute bg-amber-800 rounded-full"
                    style={{
                      top: "-2px",
                      left: "50%",
                      width: "2px",
                      height: "4px",
                      transform: "translateX(-50%)",
                    }}
                  />
                </div>
              </div>
            ))}

            {/* Gold Apples */}
            {goldPositions.map((pos, i) => (
              <div
                key={`gold-${i}`}
                className={`absolute transform transition-all duration-500 hover:scale-125 cursor-pointer ${
                  pos.isNew ? "animate-bounce-in animate-golden-glow" : ""
                }`}
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: `translate(-50%, -50%) rotate(${pos.rotation}deg)`,
                  animation: pos.isNew
                    ? `bounce-in 1s ease-out, golden-glow 2s ease-in-out infinite, gentle-bob ${pos.bobDuration}s ease-in-out infinite ${pos.bobDelay}s`
                    : `golden-glow 2s ease-in-out infinite, gentle-bob ${pos.bobDuration}s ease-in-out infinite ${pos.bobDelay}s`,
                }}
              >
                <div
                  className="relative rounded-full shadow-xl"
                  style={{
                    width: `${pos.size * 4}px`,
                    height: `${pos.size * 4}px`,
                    background: "radial-gradient(circle at 30% 20%, #fde047, #facc15, #eab308, #ca8a04)",
                    boxShadow:
                      "0 6px 16px rgba(234, 179, 8, 0.6), inset 2px -2px 4px rgba(0,0,0,0.2), 0 0 20px rgba(234, 179, 8, 0.3)",
                  }}
                >
                  <div
                    className="absolute rounded-full opacity-80"
                    style={{
                      top: "15%",
                      left: "25%",
                      width: "40%",
                      height: "30%",
                      background: "radial-gradient(ellipse, rgba(255,255,255,0.9) 0%, transparent 70%)",
                    }}
                  />
                  <div
                    className="absolute bg-amber-800 rounded-full"
                    style={{
                      top: "-2px",
                      left: "50%",
                      width: "2px",
                      height: "4px",
                      transform: "translateX(-50%)",
                    }}
                  />
                  {/* Golden sparkle effect */}
                  <div className="absolute inset-0 rounded-full animate-pulse opacity-40 bg-gradient-to-r from-transparent via-yellow-200 to-transparent"></div>
                </div>
              </div>
            ))}

            {/* Diamond Apples */}
            {diamondPositions.map((pos, i) => (
              <div
                key={`diamond-${i}`}
                className={`absolute transform transition-all duration-500 hover:scale-125 cursor-pointer ${
                  pos.isNew ? "animate-bounce-in animate-diamond-glow" : ""
                }`}
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: `translate(-50%, -50%) rotate(${pos.rotation}deg)`,
                  animation: pos.isNew
                    ? `bounce-in 1s ease-out, diamond-glow 1.5s ease-in-out infinite, gentle-bob ${pos.bobDuration}s ease-in-out infinite ${pos.bobDelay}s`
                    : `diamond-glow 1.5s ease-in-out infinite, gentle-bob ${pos.bobDuration}s ease-in-out infinite ${pos.bobDelay}s`,
                }}
              >
                <div
                  className="relative rounded-full shadow-2xl"
                  style={{
                    width: `${pos.size * 4}px`,
                    height: `${pos.size * 4}px`,
                    background: "radial-gradient(circle at 30% 20%, #dbeafe, #93c5fd, #3b82f6, #1e40af)",
                    boxShadow:
                      "0 8px 20px rgba(59, 130, 246, 0.7), inset 2px -2px 4px rgba(0,0,0,0.2), 0 0 30px rgba(59, 130, 246, 0.5)",
                  }}
                >
                  <div
                    className="absolute rounded-full opacity-90"
                    style={{
                      top: "15%",
                      left: "25%",
                      width: "40%",
                      height: "30%",
                      background: "radial-gradient(ellipse, rgba(255,255,255,1) 0%, transparent 70%)",
                    }}
                  />
                  <div
                    className="absolute bg-amber-800 rounded-full"
                    style={{
                      top: "-2px",
                      left: "50%",
                      width: "2px",
                      height: "4px",
                      transform: "translateX(-50%)",
                    }}
                  />
                  {/* Diamond sparkle effects */}
                  <div className="absolute inset-0 rounded-full animate-ping opacity-30 bg-blue-300"></div>
                  <div className="absolute inset-1 rounded-full animate-pulse opacity-50 bg-gradient-to-r from-transparent via-white to-transparent"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Growth Progress Bar - Enhanced */}
      <div className="absolute bottom-4 left-4 right-4 z-20">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
          <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
            <span>Tree Growth</span>
            <span className="text-green-600">{treeProgress}/4</span>
          </div>
          <div className="relative w-full bg-gray-200 rounded-full h-4 shadow-inner">
            <div
              className="bg-gradient-to-r from-green-400 via-green-500 to-green-600 h-4 rounded-full transition-all duration-2000 ease-out shadow-sm relative overflow-hidden"
              style={{ width: `${progressPercentage}%` }}
            >
              {/* Animated shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
          </div>
          <div className="text-xs text-gray-600 mt-1 text-center">
            {treeStage.charAt(0).toUpperCase() + treeStage.slice(1)} Tree
            {treeProgress < 4 && (
              <span className="ml-2 text-blue-600">
                {treeProgress === 0 && "→ Get Red Apples"}
                {treeProgress === 1 && "→ Get Silver Apples"} 
                {treeProgress === 2 && "→ Get Gold Apples"}
                {treeProgress === 3 && "→ Get Diamond Apples"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes float-slow {
          0%, 100% { transform: translateX(0px) translateY(0px); }
          50% { transform: translateX(20px) translateY(-10px); }
        }
        
        @keyframes float-slower {
          0%, 100% { transform: translateX(0px) translateY(0px); }
          50% { transform: translateX(-15px) translateY(-5px); }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes sway {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(2deg); }
        }
        
        @keyframes bounce-in {
          0% { transform: translate(-50%, -50%) scale(0) rotate(0deg); }
          50% { transform: translate(-50%, -50%) scale(1.3) rotate(180deg); }
          100% { transform: translate(-50%, -50%) scale(1) rotate(360deg); }
        }
        
        @keyframes golden-glow {
          0%, 100% { filter: drop-shadow(0 0 10px rgba(234, 179, 8, 0.5)); }
          50% { filter: drop-shadow(0 0 20px rgba(234, 179, 8, 0.8)); }
        }
        
        @keyframes diamond-glow {
          0%, 100% { filter: drop-shadow(0 0 15px rgba(59, 130, 246, 0.6)); }
          50% { filter: drop-shadow(0 0 25px rgba(59, 130, 246, 0.9)); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes gentle-bob {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
          50% { transform: translate(-50%, -50%) translateY(-2px); }
        }
        
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        
        .animate-float-slower {
          animation: float-slower 12s ease-in-out infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        
        .animate-sway {
          animation: sway ease-in-out infinite;
        }
        
        .animate-bounce-in {
          animation: bounce-in 1s ease-out;
        }
        
        .animate-golden-glow {
          animation: golden-glow 2s ease-in-out infinite;
        }
        
        .animate-diamond-glow {
          animation: diamond-glow 1.5s ease-in-out infinite;
        }
        
        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }

        .animate-gentle-bob {
          animation: gentle-bob ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
