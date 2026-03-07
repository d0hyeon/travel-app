import { format } from "date-fns";

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

export function formatDateISO(value: string | number | Date) {
  return format(value, 'yyyy-MM-dd')
}



const SECOND = 1000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

const now = new Date();

export function formatRemainTime(
  base: string | number,
  format: string,
  textInMinute: string = '방금 전'
) {
  const target = now;
  const diff = new Date(base).getTime() - target.getTime();

  if (diff >= DAY) {
    const days = Math.floor(diff / DAY);
    const hours = Math.floor((diff % DAY) / HOUR);
    return format.replace('#', hours > 0 ? `${days}일 ${hours}시간` : `${days}일`);
  }

  if (diff >= HOUR) {
    const hours = Math.floor(diff / HOUR);
    const minutes = Math.floor((diff % HOUR) / MINUTE);
    
    return format.replace('#', minutes > 0 ? `${hours}시간 ${minutes}분` : `${hours}시간`);
  }

  if (diff >= MINUTE) {
    return format.replace('#', `${Math.floor(diff / MINUTE)}분`);
  }

  return textInMinute;
}