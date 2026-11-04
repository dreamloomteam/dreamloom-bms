import {
  getEATCurrentComponents,
  getEATHeaderDate,
  getEATISODate,
  getEATContributionDate,
  getEATDateTimeString,
  matchesMonthAndYear,
  parseDateToMonthYear
} from '../src/lib/dateUtils';

console.log('EAT Components:', getEATCurrentComponents());
console.log('Header Date:', getEATHeaderDate());
console.log('ISO Date:', getEATISODate());
console.log('Contribution Date:', getEATContributionDate());
console.log('DateTime String:', getEATDateTimeString());

console.log('Parse 01-Oct-2026:', parseDateToMonthYear('01-Oct-2026'));
console.log('Parse 2026-11-04:', parseDateToMonthYear('2026-11-04'));
console.log('Parse October 2026:', parseDateToMonthYear('October 2026'));

console.log('Matches Oct 2026 with October, 2026:', matchesMonthAndYear('01-Oct-2026', 'October', 2026));
console.log('Matches Nov 2026 with October, 2026 (false):', matchesMonthAndYear('2026-11-04', 'October', 2026));
console.log('Matches Nov 2026 with November, 2026 (true):', matchesMonthAndYear('2026-11-04', 'November', 2026));
