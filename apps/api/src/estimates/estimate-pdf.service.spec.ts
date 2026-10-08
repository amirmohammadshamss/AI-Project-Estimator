import parsePdf from 'pdf-parse';
import { z } from 'zod';
import { EstimateRiskSchema } from '@ape/types';
import { EstimatePdfService } from './estimate-pdf.service';
import { reportFixture } from '../../test/fixtures/report';
describe('EstimatePdfService', () => {
  const service = new EstimatePdfService();
  it('exports every required report field and uses saved project text', async () => {
    const estimate = reportFixture();
    const buffer = await service.render(
      estimate,
      z.array(EstimateRiskSchema).parse(estimate.risks),
    );
    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
    const pdf = await parsePdf(buffer);
    const text = pdf.text.replace(/\s+/g, ' ');
    for (const value of [
      'Jean Dupont',
      'Delivery Operations Platform',
      'Project Description',
      'A web platform for regional delivery teams.',
      'Executive Summary',
      'Estimated Hours',
      '96',
      'Estimated Cost',
      '9600.00',
      'Feature Breakdown',
      'Authentication',
      'Payment processing (manually edited)',
      'Technology Recommendations',
      'Next.js',
      'Risks',
      'HIGH - Payment webhook reliability',
      'Confidence',
      '85%',
      'Generated date: 2026-10-08 12:00 UTC',
    ])
      expect(text).toContain(value);
    expect(text).not.toContain('Current project description');
    expect(pdf.numpages).toBeGreaterThan(0);
  });
  it('paginates long descriptions without dropping final text and numbers every page', async () => {
    const estimate = reportFixture();
    estimate.projectDescription =
      'Delivery requirement. '.repeat(180) + 'End of project requirements.';
    estimate.items[2]!.description =
      'Operational workflow validation. '.repeat(110) + 'End of feature breakdown.';
    const pdf = await parsePdf(
      await service.render(estimate, z.array(EstimateRiskSchema).parse(estimate.risks)),
    );
    expect(pdf.numpages).toBeGreaterThan(2);
    expect(pdf.text).toContain('End of project requirements.');
    expect(pdf.text).toContain('End of feature breakdown.');
    expect(pdf.text).toContain(`Page ${pdf.numpages} of ${pdf.numpages}`);
  });
});
