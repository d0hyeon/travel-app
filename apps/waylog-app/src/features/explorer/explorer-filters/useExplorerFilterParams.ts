import { isLocation, type Location } from "@waylog/domains/modules/location";
import {
  PlaceCategoryTypes,
  type PlaceCategoryType,
} from "@waylog/domains/modules/place";
import { useQueryParamState } from "../../../shared/hooks/useQueryParamState";
import { useScheduledTripDestinations } from "../../trip/useScheduledTripDestinations";

export function useExplorerFilterParams() {
  const tripDefaultLocation = useScheduledTripDestinations().at(0);

  const [location, setLocation] = useQueryParamState<Location | undefined>(
    "location",
    {
      defaultValue: tripDefaultLocation,
      parse: parseLocation,
    },
  );
  const [category, setCategory] = useQueryParamState<
    PlaceCategoryType | undefined
  >("category", {
    defaultValue: undefined,
    parse: parseCategory,
  });

  return { location, setLocation, category, setCategory };
}

function parseLocation(value: string): Location | undefined {
  return isLocation(value) ? value : undefined;
}

function parseCategory(value: string): PlaceCategoryType | undefined {
  return PlaceCategoryTypes.find((category) => category === value);
}
