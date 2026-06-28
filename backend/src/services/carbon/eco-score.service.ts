import { env } from '../../config/env';
import { CarbonCalculationInput, CarbonCalculationResult } from '../../types';

// Emission factors (kg CO2 per km per kg of cargo)
const EMISSION_FACTORS: Record<string, number> = {
  MOTORCYCLE: env.EMISSION_MOTORCYCLE,
  PICKUP_TRUCK: env.EMISSION_PICKUP,
  MEDIUM_TRUCK: env.EMISSION_MEDIUM_TRUCK,
  HEAVY_TRUCK: env.EMISSION_HEAVY_TRUCK,
  ELECTRIC_VEHICLE: env.EMISSION_ELECTRIC,
};

// Fertilizer penalties (flat kg CO2e)
const FERTILIZER_PENALTIES: Record<string, number> = {
  CHEMICAL_UREA: 0.8,
  CHEMICAL_NPK: 0.6,
  ORGANIC_COMPOST: 0,
  ORGANIC_MANURE: 0,
  ORGANIC_LIQUID: 0,
  NONE: 0,
};

const PESTICIDE_PENALTY = 0.3; // kg CO2e
const MAX_BENCHMARK = 25; // worst case kg CO2e

export function getGradeFromCarbon(totalKg: number): string {
  if (totalKg <= env.GRADE_A_MAX_KG) return 'A';
  if (totalKg <= env.GRADE_B_MAX_KG) return 'B';
  if (totalKg <= env.GRADE_C_MAX_KG) return 'C';
  if (totalKg <= env.GRADE_D_MAX_KG) return 'D';
  return 'F';
}

export function isEligibleForCertification(grade: string): boolean {
  return ['A', 'B', 'C'].includes(grade);
}

export function calculateEcoScore(input: CarbonCalculationInput): CarbonCalculationResult {
  const emissionFactor = EMISSION_FACTORS[input.vehicleType] || EMISSION_FACTORS.PICKUP_TRUCK;
  
  const rawCarbonKg = input.distanceKm * input.weightKg * emissionFactor;
  const fertilizerPenalty = FERTILIZER_PENALTIES[input.fertilizerType] ?? 0;
  const pesticidePenalty = input.pesticidesUsed ? PESTICIDE_PENALTY : 0;
  
  const totalCarbonKg = rawCarbonKg + fertilizerPenalty + pesticidePenalty;
  
  const score = Math.max(0, 100 - (totalCarbonKg / MAX_BENCHMARK) * 100);
  const ecoScore = Math.round(score);
  
  const ecoGrade = getGradeFromCarbon(totalCarbonKg);
  
  return {
    rawCarbonKg,
    fertilizerPenalty,
    pesticidePenalty,
    totalCarbonKg,
    ecoScore,
    ecoGrade,
    calculationVersion: env.CARBON_CALCULATION_VERSION,
  };
}
