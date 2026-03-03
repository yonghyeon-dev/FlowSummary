/**
 * 사용자 시간대의 특정 시각(hour)을 UTC Date로 변환
 * @param baseDate 기준 날짜
 * @param hour 사용자 시간대 기준 시각 (0-23)
 * @param timezone IANA timezone (e.g. "Asia/Seoul")
 */
export function toUtcFromTimezone(
  baseDate: Date,
  hour: number,
  timezone: string
): Date {
  // 기준 날짜의 YYYY-MM-DD
  const year = baseDate.getFullYear();
  const month = String(baseDate.getMonth() + 1).padStart(2, "0");
  const day = String(baseDate.getDate()).padStart(2, "0");
  const hh = String(hour).padStart(2, "0");

  // 사용자 시간대의 특정 시각 생성
  const localTimeStr = `${year}-${month}-${day}T${hh}:00:00`;

  // Intl.DateTimeFormat으로 해당 시간대의 UTC offset 계산
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  // 임시 Date로 offset 추정 — 해당 로컬 시간대의 UTC 차이 계산
  const tempDate = new Date(localTimeStr + "Z"); // 일단 UTC로 간주
  const parts = formatter.formatToParts(tempDate);
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "0";

  const tzYear = parseInt(get("year"));
  const tzMonth = parseInt(get("month"));
  const tzDay = parseInt(get("day"));
  const tzHour = parseInt(get("hour") === "24" ? "0" : get("hour"));

  // UTC와 timezone 사이의 시간 차이 계산
  const utcMs = Date.UTC(
    tempDate.getUTCFullYear(),
    tempDate.getUTCMonth(),
    tempDate.getUTCDate(),
    tempDate.getUTCHours()
  );
  const tzMs = Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour);
  const offsetMs = tzMs - utcMs;

  // 원하는 로컬 시각에서 offset을 빼서 UTC를 구함
  const targetLocal = new Date(localTimeStr + "Z");
  return new Date(targetLocal.getTime() - offsetMs);
}
