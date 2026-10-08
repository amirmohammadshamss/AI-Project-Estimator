import { CostCalculationService } from './cost-calculation.service';

describe('CostCalculationService', () => {
  const service = new CostCalculationService();
  it('uses decimal arithmetic and rounds money to cents', () => {
    const result = service.calculate([0.1, 0.2], 19.99);
    expect(result.totalHours.toString()).toBe('0.3');
    expect(result.totalCost.toString()).toBe('6');
    expect(result.itemCosts.map((cost) => cost.toString())).toEqual(['2', '4']);
  });
  it('allows free estimates', () =>
    expect(service.calculate([20], 0).totalCost.toString()).toBe('0'));
  it.each([0, -1, NaN, Infinity])('rejects invalid hours %s', (hours) =>
    expect(() => service.calculate([hours], 50)).toThrow(),
  );
  it('rejects invalid rates and empty features', () => {
    expect(() => service.calculate([10], -1)).toThrow();
    expect(() => service.calculate([], 50)).toThrow();
  });
});
