import React from "react";
import { Image as RNImage } from "react-native";
import Svg, { Image as SvgImage } from "react-native-svg";

const MARK = require("../../image/FitGear.png");

export default function FitcoachMark({ size = 200 }: { size?: number }) {
  const uri = RNImage.resolveAssetSource(MARK).uri;
  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024">
      <SvgImage
        href={{ uri }}
        x={0}
        y={0}
        width={1024}
        height={1024}
        preserveAspectRatio="xMidYMid meet"
      />
    </Svg>
  );
}
