export const CLASSES = [
  { slug: "titan", name: "The Titan" },
  { slug: "beast", name: "The Beast" },
  { slug: "bodyweight_master", name: "The Body Weight Master" },
  { slug: "hunter_gatherer", name: "The Hunter Gatherer" },
  { slug: "super_athlete", name: "The Super Athlete" },
] as const;

export type ClassSlug = typeof CLASSES[number]["slug"];

export const CLASS_COLORS = {
  titan: "bg-purple-500",
  beast: "bg-red-500",
  bodyweight_master: "bg-blue-500",
  hunter_gatherer: "bg-green-500",
  super_athlete: "bg-yellow-500",
} as const;

export const CLASS_DESCRIPTIONS = {
  titan: "Bodybuilding/Aesthetics - Build muscle and sculpt your physique",
  beast: "Strongman/Powerlifting - Raw strength and power",
  bodyweight_master: "Rock Climbing/Calisthenics/Gymnastics - Body control and skill",
  hunter_gatherer: "Long-distance/Hiking/Running - Endurance and stamina",
  super_athlete: "Sprints/Jumps/Explosive/Mile/Athletic - Speed and explosiveness",
} as const;

export const CLASS_ICONS = {
  titan: "💪",
  beast: "🦁",
  bodyweight_master: "🧗",
  hunter_gatherer: "🏃",
  super_athlete: "⚡",
} as const;
