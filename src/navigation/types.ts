import { AuraReport } from "../types";

export type RootStackParamList = {
  Camera: undefined;
  AuraReport:
    | {
        report: AuraReport;
      }
    | undefined;
};
