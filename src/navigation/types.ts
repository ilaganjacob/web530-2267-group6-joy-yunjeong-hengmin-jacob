import { AuraReport } from "../types";

export type RootStackParamList = {
  Camera:
    | {
        dailyMode?: boolean;
      }
    | undefined;
  AuraReport:
    | {
        report: AuraReport;
      }
    | undefined;
  DailyAura: undefined;
};
