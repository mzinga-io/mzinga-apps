import React from "react";

const baseClass = "powered-by";

const PoweredByMzinga: React.FC = () => {
  return (
    <div
      className={baseClass}
      style={{ marginBottom: "8px", borderBottom: "1px solid #eee" }}
    >
      <h5>Powered by Mzinga.io</h5>
    </div>
  );
};

export default PoweredByMzinga;
