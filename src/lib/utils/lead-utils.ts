export function generateLeadId(lastLeadNumber: number = 0): string {
  const currentYear = new Date().getFullYear();
  const leadNumber = lastLeadNumber + 1;
  const paddedNumber = leadNumber.toString().padStart(4, '0');
  return `LD-${currentYear}-${paddedNumber}`;
}

export function extractLeadNumber(leadId: string): number {
  const match = leadId.match(/LD-\d{4}-(\d{4})/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return 0;
}

export function getCurrentYearPrefix(): string {
  const currentYear = new Date().getFullYear();
  return `LD-${currentYear}-`;
}
