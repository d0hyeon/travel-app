import { Country as Countries, type Country } from "../location";

/** 무지개 계열을 낮은 채도로 조정한 국가 방문 지도 전용 팔레트다. */
export const visitCountryPalette = [
  "#E8A59C",
  "#E5C070",
  "#A2D66B",
  "#82C994",
  "#79C9B5",
  "#82B8E8",
  "#CDC1E1",
  "#B5A7CD",
] as const;

type VisitCountryColor = (typeof visitCountryPalette)[number];

export const defaultVisitedCountryColor = visitCountryPalette[0];

const adjacentCountryPairs = [
  [Countries.프랑스, Countries.이탈리아],
  [Countries.프랑스, Countries.스위스],
  [Countries.프랑스, Countries.스페인],
  [Countries.이탈리아, Countries.스위스],
  [Countries.이탈리아, Countries.오스트리아],
  [Countries.스위스, Countries.오스트리아],
  [Countries.오스트리아, Countries.체코],
  [Countries.오스트리아, Countries.헝가리],
  [Countries.스페인, Countries.포르투갈],
  [Countries.태국, Countries.말레이시아],
  [Countries.베트남, Countries.중국],
  [Countries.중국, Countries.홍콩],
  [Countries.말레이시아, Countries.싱가포르],
  [Countries.말레이시아, Countries.인도네시아],
  [Countries.미국, Countries.캐나다],
  [Countries.미국, Countries.멕시코],
] satisfies readonly (readonly [Country, Country])[];

/**
 * 방문 국가별 색을 결정론적으로 배정한다.
 * 팔레트가 소진되기 전까지 중복하지 않고, 인접국은 서로 다른 색 중 색상환에서 가장 가까운 색을 받는다.
 */
export function getVisitedCountryColors(
  countries: readonly Country[],
): Map<Country, VisitCountryColor> {
  const uniqueCountries = [...new Set(countries)];
  const orderedCountries = getCountryColorAssignmentOrder(uniqueCountries);
  const shouldUseUniqueColors =
    uniqueCountries.length <= visitCountryPalette.length;
  const assignedIndexes = new Map<Country, number>();
  assignCountryColors(orderedCountries, assignedIndexes, shouldUseUniqueColors);

  return new Map(
    [...assignedIndexes].map(([country, index]) => [
      country,
      visitCountryPalette[index] ?? defaultVisitedCountryColor,
    ]),
  );
}

export function resolveVisitedCountryColor(
  colors: ReadonlyMap<Country, VisitCountryColor>,
  country: Country | undefined,
): string {
  if (country == null) return defaultVisitedCountryColor;
  return colors.get(country) ?? defaultVisitedCountryColor;
}

function getCountryColorSeed(country: Country) {
  return [...country].reduce(
    (seed, character) => (seed * 31 + character.charCodeAt(0)) >>> 0,
    0,
  );
}

function getCountryColorAssignmentOrder(countries: readonly Country[]) {
  return countries.toSorted((first, second) => {
    const adjacentCountryCountDifference =
      getAdjacentCountryCount(second, countries) -
      getAdjacentCountryCount(first, countries);
    if (adjacentCountryCountDifference !== 0)
      return adjacentCountryCountDifference;

    return getCountryColorSeed(first) - getCountryColorSeed(second);
  });
}

function assignCountryColors(
  orderedCountries: readonly Country[],
  assignedIndexes: Map<Country, number>,
  shouldUseUniqueColors: boolean,
): boolean {
  const country = orderedCountries[assignedIndexes.size];
  if (country == null) return true;

  const candidateIndexes = getColorCandidates(
    country,
    assignedIndexes,
    shouldUseUniqueColors,
  );
  for (const index of candidateIndexes) {
    if (!isDistinctFromAdjacentColors(country, index, assignedIndexes)) continue;

    assignedIndexes.set(country, index);
    if (assignCountryColors(orderedCountries, assignedIndexes, shouldUseUniqueColors))
      return true;
    assignedIndexes.delete(country);
  }

  return false;
}

function getColorCandidates(
  country: Country,
  assignedIndexes: ReadonlyMap<Country, number>,
  shouldUseUniqueColors: boolean,
) {
  const colorUsage = getColorUsage(assignedIndexes);
  const hasUnusedColor = colorUsage.some((usage) => usage === 0);
  const mustUseUnusedColor = shouldUseUniqueColors || hasUnusedColor;

  return visitCountryPalette
    .map((_, index) => index)
    .filter((index) => !mustUseUnusedColor || colorUsage[index] === 0)
    .toSorted((first, second) => {
      const usageDifference = colorUsage[first] - colorUsage[second];
      if (usageDifference !== 0) return usageDifference;

      const adjacentDistanceDifference =
        getAdjacentColorDistance(country, first, assignedIndexes) -
        getAdjacentColorDistance(country, second, assignedIndexes);
      if (adjacentDistanceDifference !== 0) return adjacentDistanceDifference;

      return (
        getPalettePriority(country, first) - getPalettePriority(country, second)
      );
    });
}

function getColorUsage(assignedIndexes: ReadonlyMap<Country, number>) {
  return [...assignedIndexes.values()].reduce((usage, index) => {
    usage[index] = (usage[index] ?? 0) + 1;
    return usage;
  }, Array<number>(visitCountryPalette.length).fill(0));
}

function isDistinctFromAdjacentColors(
  country: Country,
  candidateIndex: number,
  assignedIndexes: ReadonlyMap<Country, number>,
) {
  return getAdjacentColorDistance(country, candidateIndex, assignedIndexes) > 0;
}

function getAdjacentColorDistance(
  country: Country,
  candidateIndex: number,
  assignedIndexes: ReadonlyMap<Country, number>,
) {
  const adjacentIndexes = [...assignedIndexes.entries()]
    .filter(([otherCountry]) => areCountriesAdjacent(country, otherCountry))
    .map(([, index]) => index);

  if (adjacentIndexes.length === 0) return visitCountryPalette.length;

  return Math.min(
    ...adjacentIndexes.map((index) =>
      getCircularColorDistance(candidateIndex, index),
    ),
  );
}

function areCountriesAdjacent(first: Country, second: Country) {
  return adjacentCountryPairs.some(
    ([left, right]) =>
      (left === first && right === second) ||
      (left === second && right === first),
  );
}

function getAdjacentCountryCount(
  country: Country,
  countries: readonly Country[],
) {
  return countries.filter((otherCountry) =>
    areCountriesAdjacent(country, otherCountry),
  ).length;
}

function getCircularColorDistance(first: number, second: number) {
  const directDistance = Math.abs(first - second);
  return Math.min(directDistance, visitCountryPalette.length - directDistance);
}

function getPalettePriority(country: Country, paletteIndex: number) {
  return (
    (getCountryColorSeed(country) + paletteIndex * 7) %
    visitCountryPalette.length
  );
}
