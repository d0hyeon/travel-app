import type { SvgIconProps } from "@mui/material";
import { PrecipitationType, SkyCondition } from "./weather.types";
import { arrayIncludes, assert } from "@waylog/domains/utils";
import { SwitchCase } from "~shared/components/SwitchCase";

import CloudIcon from '@mui/icons-material/Cloud';
import CloudySnowingIcon from '@mui/icons-material/CloudySnowing';
import FilterDramaIcon from '@mui/icons-material/FilterDrama';
import SunnyIcon from '@mui/icons-material/Sunny';
import WaterDropIcon from '@mui/icons-material/WaterDrop';

interface WeatherIconProps extends SvgIconProps {
  skyCondition: SkyCondition | null;
  precipitationType: PrecipitationType;
}

export function WeatherIcon({ skyCondition, precipitationType, ...props }: WeatherIconProps) {
  if (precipitationType === PrecipitationType.없음) {
    assert(skyCondition != null, '날씨 정보가 존재하지 않습니다.');

    return (
      <SwitchCase
        value={skyCondition}
        cases={{
          [SkyCondition.맑음]: <SunnyIcon {...props} htmlColor="#efc46d" />,
          [SkyCondition.흐림]: <CloudIcon {...props} />,
          [SkyCondition.구름많음]: <FilterDramaIcon {...props} />,
        }}
      />
    )
  }

  if (arrayIncludes(SNOW_TYPES, precipitationType)) {
    return <CloudySnowingIcon {...props} htmlColor="#fff" />
  }

  return <WaterDropIcon {...props} htmlColor="#4A7AFF" />;
}

const SNOW_TYPES = [
  PrecipitationType.눈, PrecipitationType.눈날림, PrecipitationType.비눈, PrecipitationType.빗방울눈날림
] satisfies PrecipitationType[];