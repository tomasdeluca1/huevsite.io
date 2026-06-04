export type JingleChoice = "monumental" | "del_otro_lado";

export interface JingleOption {
  key: JingleChoice;
  label: string;       // "Opción A"
  title: string;       // jingle name
  videoUrl: string;
}

const STORAGE_BASE =
  "https://sdijcsgsfvwwdehcllsm.supabase.co/storage/v1/object/public/assets/jingles";

export const JINGLE_OPTIONS: JingleOption[] = [
  {
    key: "monumental",
    label: "Opción A",
    title: "Tu Proyecto Es Monumental",
    videoUrl: `${STORAGE_BASE}/tu-proyecto-es-monumental.mp4`,
  },
  {
    key: "del_otro_lado",
    label: "Opción B",
    title: "Del Otro Lado",
    videoUrl: `${STORAGE_BASE}/del-otro-lado.mp4`,
  },
];

export const JINGLE_CHOICES: JingleChoice[] = JINGLE_OPTIONS.map((o) => o.key);

export function isJingleChoice(value: unknown): value is JingleChoice {
  return typeof value === "string" && (JINGLE_CHOICES as string[]).includes(value);
}

export function jingleTitle(choice: JingleChoice): string {
  return JINGLE_OPTIONS.find((o) => o.key === choice)?.title ?? choice;
}
