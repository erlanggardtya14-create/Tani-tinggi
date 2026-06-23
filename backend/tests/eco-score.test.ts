import { describe, it, expect } from 'vitest';
import { calculateEcoScore, getGradeFromCarbon } from '../src/services/carbon/eco-score.service';

describe('Carbon / Eco-Score Calculation', () => {
  it('should calculate grade properly for Motorcycle, 50km, 10kg, organic', () => {
    const input = {
      distanceKm: 50,
      weightKg: 10,
      vehicleType: 'MOTORCYCLE',
      fertilizerType: 'ORGANIC_COMPOST',
      pesticidesUsed: false,
    };
    
    // 50 * 10 * 0.000103 = 0.0515 kg CO2e
    const result = calculateEcoScore(input);
    expect(result.rawCarbonKg).toBeCloseTo(0.0515);
    expect(result.fertilizerPenalty).toBe(0);
    expect(result.pesticidePenalty).toBe(0);
    expect(result.totalCarbonKg).toBeCloseTo(0.0515);
    
    // <= 2.0 -> Grade A
    expect(result.ecoGrade).toBe('A');
    expect(result.ecoScore).toBeGreaterThan(90);
  });

  it('should calculate higher carbon for Heavy Truck, 200km, 100kg, chemical urea', () => {
    const input = {
      distanceKm: 200,
      weightKg: 100,
      vehicleType: 'HEAVY_TRUCK',
      fertilizerType: 'CHEMICAL_UREA',
      pesticidesUsed: true,
    };

    // 200 * 100 * 0.000062 = 1.24 kg CO2e
    // + 0.8 (Urea) + 0.3 (Pesticide) = 2.34 kg CO2e
    const result = calculateEcoScore(input);
    expect(result.rawCarbonKg).toBeCloseTo(1.24);
    expect(result.fertilizerPenalty).toBe(0.8);
    expect(result.pesticidePenalty).toBe(0.3);
    expect(result.totalCarbonKg).toBeCloseTo(2.34);

    // > 2.0 and <= 5.0 -> Grade B
    expect(result.ecoGrade).toBe('B');
  });

  it('should result in Grade A for EV, 100km, 20kg, organic, no pesticides', () => {
     const input = {
      distanceKm: 100,
      weightKg: 20,
      vehicleType: 'ELECTRIC_VEHICLE',
      fertilizerType: 'ORGANIC_LIQUID',
      pesticidesUsed: false,
    };

    // 100 * 20 * 0.000015 = 0.03 kg CO2e
    const result = calculateEcoScore(input);
    expect(result.rawCarbonKg).toBeCloseTo(0.03);
    expect(result.totalCarbonKg).toBeCloseTo(0.03);

    expect(result.ecoGrade).toBe('A');
  });
});
