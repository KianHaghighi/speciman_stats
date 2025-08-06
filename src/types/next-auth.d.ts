import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      class?: string | null;
      sex?: string | null;
      age?: number | null;
      heightCm?: number | null;
      weightKg?: number | null;
      bmi?: number | null;
      role?: string | null;
      eloTitan?: number | null;
      eloBeast?: number | null;
      eloBodyweight?: number | null;
      eloSuperAthlete?: number | null;
      eloHunterGatherer?: number | null;
      eloTotal?: number | null;
      tier?: string | null;
    };
  }
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    class?: string | null;
    sex?: string | null;
    age?: number | null;
    heightCm?: number | null;
    weightKg?: number | null;
    bmi?: number | null;
    role?: string | null;
    eloTitan?: number | null;
    eloBeast?: number | null;
    eloBodyweight?: number | null;
    eloSuperAthlete?: number | null;
    eloHunterGatherer?: number | null;
    eloTotal?: number | null;
    tier?: string | null;
  }
} 