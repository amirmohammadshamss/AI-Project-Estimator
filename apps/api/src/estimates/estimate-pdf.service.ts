import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Prisma } from '@prisma/client';
import { EstimateRisk } from '@ape/types';
export type ReportEstimate = Prisma.EstimateGetPayload<{
  include: { items: true; project: { include: { user: { select: { name: true; email: true } } } } };
}>;
@Injectable()
export class EstimatePdfService {
  render(estimate: ReportEstimate, risks: EstimateRisk[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 68, bottom: 64, left: 48, right: 48 },
        bufferPages: true,
        info: {
          Title: `${estimate.projectName} - Estimate v${estimate.version}`,
          Author: estimate.project.user.name ?? estimate.project.user.email,
          Subject: 'Software project estimate',
        },
      });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      try {
        doc.registerFont(
          'Body',
          require.resolve('@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff'),
        );
        doc.registerFont(
          'Heading',
          require.resolve('@fontsource/noto-sans/files/noto-sans-latin-700-normal.woff'),
        );
        const width = doc.page.width - 96;
        const body = (text: string) => {
          doc
            .font('Body')
            .fontSize(10)
            .fillColor('#334155')
            .text(text, { width, lineGap: 3 })
            .moveDown(0.65);
        };
        const section = (title: string) => {
          if (doc.y > doc.page.height - 140) doc.addPage();
          doc
            .moveDown(0.5)
            .font('Heading')
            .fontSize(13)
            .fillColor('#0f172a')
            .text(title, { width })
            .moveDown(0.5);
        };
        doc.font('Body').fontSize(9).fillColor('#0f766e').text('PROJECT ESTIMATE');
        doc
          .moveDown(0.5)
          .font('Heading')
          .fontSize(24)
          .fillColor('#0f172a')
          .text(estimate.projectName, { width })
          .moveDown(0.3);
        body(
          `Version ${estimate.version} | Prepared by: ${estimate.project.user.name ?? estimate.project.user.email}`,
        );
        body(
          `Generated date: ${estimate.createdAt.toISOString().replace('T', ' ').slice(0, 16)} UTC`,
        );
        const y = doc.y;
        doc.roundedRect(48, y, width, 72, 6).fill('#f1f5f9');
        const metrics = [
          ['Estimated Hours', estimate.totalHours.toString()],
          ['Hourly Rate', `${estimate.currency} ${estimate.hourlyRate.toFixed(2)}`],
          ['Estimated Cost', `${estimate.currency} ${estimate.totalCost.toFixed(2)}`],
          ['Confidence', `${Math.round(estimate.confidence * 100)}%`],
        ];
        metrics.forEach(([label, value], index) => {
          const x = 60 + (index * (width - 24)) / 4;
          doc
            .font('Body')
            .fontSize(8)
            .fillColor('#64748b')
            .text(label!, x, y + 14, { width: (width - 24) / 4 - 6 });
          doc
            .font('Heading')
            .fontSize(11)
            .fillColor('#0f172a')
            .text(value!, x, y + 32, { width: (width - 24) / 4 - 6 });
        });
        doc.x = 48;
        doc.y = y + 88;
        section('Project Description');
        body(estimate.projectDescription);
        section('Executive Summary');
        body(estimate.summary);
        section('Feature Breakdown');
        estimate.items.forEach((item, index) => {
          if (doc.y > doc.page.height - 160) doc.addPage();
          doc
            .font('Heading')
            .fontSize(11)
            .fillColor('#0f172a')
            .text(
              `${index + 1}. ${item.name}${item.manuallyModified ? ' (manually edited)' : ''}`,
              { width },
            )
            .moveDown(0.3);
          body(`Category: ${item.category} | Complexity: ${item.complexity}`);
          body(
            `Hours: ${item.estimatedHours} | Cost: ${estimate.currency} ${item.estimatedCost.toFixed(2)} | Confidence: ${Math.round(item.confidence * 100)}%`,
          );
          body(item.description);
          doc
            .moveTo(48, doc.y)
            .lineTo(doc.page.width - 48, doc.y)
            .strokeColor('#e2e8f0')
            .stroke();
          doc.moveDown(0.5);
        });
        section('Technology Recommendations');
        if (!estimate.suggestedStack.length)
          body('No technology recommendations recorded for this version.');
        for (const technology of estimate.suggestedStack) body(`- ${technology}`);
        section('Risks');
        if (!risks.length) body('No risks recorded for this version.');
        for (const risk of risks) {
          doc
            .font('Heading')
            .fontSize(10)
            .fillColor('#0f172a')
            .text(`${risk.severity} - ${risk.title}`, { width });
          doc.moveDown(0.3);
          body(risk.description);
        }
        const pages = doc.bufferedPageRange();
        for (let index = pages.start; index < pages.start + pages.count; index++) {
          doc.switchToPage(index);
          const bottomMargin = doc.page.margins.bottom;
          doc.page.margins.bottom = 0;
          if (index === pages.start) {
            doc
              .font('Body')
              .fontSize(8)
              .fillColor('#64748b')
              .text('AI Project Estimator | Estimate report', 48, 30, { width, lineBreak: false });
            doc
              .moveTo(48, 48)
              .lineTo(doc.page.width - 48, 48)
              .strokeColor('#e2e8f0')
              .stroke();
          }
          doc
            .font('Body')
            .fontSize(8)
            .fillColor('#64748b')
            .text(
              `AI Project Estimator | Version ${estimate.version} | Page ${index + 1} of ${pages.count}`,
              48,
              doc.page.height - 38,
              { width, align: 'right', lineBreak: false },
            );
          doc.page.margins.bottom = bottomMargin;
        }
        doc.end();
      } catch (error) {
        doc.destroy();
        reject(error);
      }
    });
  }
}
