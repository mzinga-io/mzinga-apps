import React from "react";
import { ConfigLoader } from "../../configs/ConfigLoader";
const config = new ConfigLoader().Load();

const Logo: React.FC = () => {
  return <img width="180" src={config.CustomComponents.Graphics.Logo.src} />;
};

export default Logo;
