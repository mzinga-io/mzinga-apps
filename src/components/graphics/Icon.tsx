import React from "react";
import { ConfigLoader } from "../../configs/ConfigLoader";
const config = new ConfigLoader().Load();

const Icon: React.FC = () => {
  return (
    <img
      width="125"
      height="125"
      src={config.CustomComponents.Graphics.Icon.src}
    />
  );
};

export default Icon;
