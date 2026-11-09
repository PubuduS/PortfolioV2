/**
 * The year span shown beside a job.
 * One year covers a partial year. More than one year uses the plural.
 * @param years length returned by the date service
 * @returns the label, such as `1 Year` or `2.4 Years`
 */
export function yearsExperienceLabel(years: number): string {
  return years > 1 ? `${years.toString()} Years` : `${years.toString()} Year`;
}
