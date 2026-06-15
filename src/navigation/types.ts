import { AuraReport } from "../types";

export type RootStackParamList = {
  Camera: undefined;
  History: undefined;
  AuraReport:
    | {
        report: AuraReport;
        mode?: "scan" | "saved";
      }
    | undefined;
};
