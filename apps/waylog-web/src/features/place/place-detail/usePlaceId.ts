import { useParams } from "react-router";
import { assert } from "@waylog/domains/utils";


export function usePlaceId() {
  const { placeId } = useParams();
  assert(placeId != null, 'placeId가 누락되었습니다.')

  return placeId;
}
