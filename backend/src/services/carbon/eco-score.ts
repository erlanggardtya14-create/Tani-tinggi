import { env } from '../../config/env';
import type { CarbonCalculationInput, CarbonCalculationResult } from '../../types';

/**
 * Emission factors per kg·km by vehicle type (kg CO2e per kg per km).
 * Sourced from env config with sensible defaults.
 */
function getEmissionFactor(vehicleType: string): number {
  const factors: Record<string, number> = {
    MOTORCYCLE: env.EMISSION_MOTORCYCLE,
    PICKUP_TRUCK: env.EMISSION_PICKUP,
    MEDIUM_TRUCK: env.EMISSION_MEDIUM_TRUCK,
    HEAVY_TRUCK: env.EMISSION_HEAVY_TRUCK,
    ELECTRIC_VEHICLE: env.EMISSION_ELECTRIC,
  };

  return factors[vehicleType] ?? env.EMISSION_PICKUP;
}

/**
 * Fertilizer penalty: additional CO2 equivalent based on fertilizer type.
 * Organic fertilizers have zero or near-zero penalty.
 */
function getFertilizerPenalty(fertilizerType: string, weightKg: number): number {
  const penalties: Record<string, number> = {
    ORGANIC_COMPOST: 0.0,
    ORGANIC_MANURE: 0.01,
    ORGANIC_LIQUID: 0.005,
    CHEMICAL_UREA: 0.15,
    CHEMICAL_NPK: 0.12,
    NONE: 0.0,
  };

  const penaltyPerKg = penalties[fertilizerType] ?? 0.05;
  return penaltyPerKg * weightKg;
}

/**
 * Pesticide penalty: flat additional CO2 for chemical pesticide use.
 */
function getPesticidePenalty(pesticidesUsed: boolean, weightKg: number): number {
  if (!pesticidesUsed) return 0.0;
  return 0.08 * weightKg; // 0.08 kg CO2e per kg produce
}

/**
 * Map total carbon footprint to an EcoGrade.
 * Lower carbon = better grade.
 */
function determineGrade(totalCarbonKg: number): string {
  if (totalCarbonKg <= env.GRADE_A_MAX_KG) return 'A';
  if (totalCarbonKg <= env.GRADE_B_MAX_KG) return 'B';
  if (totalCarbonKg <= env.GRADE_C_MAX_KG) return 'C';
  if (totalCarbonKg <= env.GRADE_D_MAX_KG) return 'D';
  return 'F';
}

/**
 * Map total carbon footprint to a numeric eco-score (0–100).
 * Score is inversely proportional to carbon, clamped to [0, 100].
 */
function calculateNumericScore(totalCarbonKg: number): number {
  // Scale: 0 kg → 100 score, GRADE_D_MAX_KG*1.5 → 0 score (linear)
  const maxCarbon = env.GRADE_D_MAX_KG * 1.5;
  const raw = Math.round(((maxCarbon - totalCarbonKg) / maxCarbon) * 100);
  return Math.max(0, Math.min(100, raw));
}

/**
 * Calculate the eco-score for a farm record based on transport,
 * fertilizer, and pesticide data.
 */
export function calculateEcoScore(input: CarbonCalculationInput): CarbonCalculationResult {
  const { distanceKm, weightKg, vehicleType, fertilizerType, pesticidesUsed } = input;

  // Transport carbon: emission factor × weight × distance
  const emissionFactor = getEmissionFactor(vehicleType);
  const rawCarbonKg = parseFloat((emissionFactor * weightKg * distanceKm).toFixed(6));

  // Penalties
  const fertilizerPenalty = parseFloat(getFertilizerPenalty(fertilizerType, weightKg).toFixed(6));
  const pesticidePenalty = parseFloat(getPesticidePenalty(pesticidesUsed, weightKg).toFixed(6));

  // Total
  const totalCarbonKg = parseFloat((rawCarbonKg + fertilizerPenalty + pesticidePenalty).toFixed(6));

  // Grade & score
  const ecoGrade = determineGrade(totalCarbonKg);
  const ecoScore = calculateNumericScore(totalCarbonKg);

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
