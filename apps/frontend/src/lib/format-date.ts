export type DateFormatMode = "date-hour" | "date" | "hour";

type FormatDateOptions = {
  mode?: DateFormatMode;
  locale?: string;
  fallback?: string;
};

export function formatDate(
  dateValue?: string | Date | null,
  options: FormatDateOptions = {},
): string {
  const { mode = "date-hour", locale = "fr-FR", fallback = "-" } = options;

  if (!dateValue) {
    return fallback;
  }

  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  const datePart = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);

  const timePart = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);

  if (mode === "date") {
    return datePart;
  }

  if (mode === "hour") {
    return timePart;
  }

  return `${datePart} - ${timePart}`;
}
