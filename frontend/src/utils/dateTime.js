export const parseServerDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const text = String(value).trim();
  // SQLite CURRENT_TIMESTAMP is UTC but has no timezone suffix.
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(text)
    ? `${text.replace(" ", "T")}Z`
    : text;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDateTime = (value) => {
  const date = parseServerDate(value);
  return date
    ? new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(date)
    : "Đang cập nhật";
};

export const formatDate = (value) => {
  const date = parseServerDate(value);
  return date
    ? new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date)
    : "Đang cập nhật";
};
