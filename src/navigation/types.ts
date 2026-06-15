import { AuraReport } from "../types";

export type RootStackParamList = {
  Auth: undefined;
  Camera: undefined;
  History: undefined;
  AuraReport:
    | {
        report: AuraReport;
        mode?: "scan" | "saved";
      }
    | undefined;
};
