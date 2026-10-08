import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class CostCalculationService {
  calculate(hours: (number | Prisma.Decimal)[], rate: number | Prisma.Decimal) {
    const hourlyRate = new Prisma.Decimal(rate);
    if (!hourlyRate.isFinite() || hourlyRate.isNegative()) throw new Error('Invalid hourly rate');
    const values = hours.map((value) => new Prisma.Decimal(value));
    if (!values.length || values.some((value) => !value.isFinite() || value.lte(0)))
      throw new Error('Invalid hours');
    const totalHours = values.reduce((sum, value) => sum.add(value), new Prisma.Decimal(0));
    const totalCost = totalHours.mul(hourlyRate).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    return {
      totalHours,
      totalCost,
      itemCosts: values.map((value) =>
        value.mul(hourlyRate).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP),
      ),
    };
  }
}
