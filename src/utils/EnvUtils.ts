export const EnvUtils = {
  GetAsBoolean(value?: string): boolean {
    return (value || "") === "true" || (value || "0") === "1";
  },
};
