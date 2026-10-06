export interface BoardingReminderSubject {
  type: string;
  airline: string | null;
  flightNumber: string | null;
  arrivalCityName: string;
  departureName: string;
  arrivalName: string;
}

export interface BoardingReminderMessage {
  title: string;
  body: string;
}

export function toBoardingReminderMessage(
  subject: BoardingReminderSubject,
): BoardingReminderMessage {
  if (subject.type === "flight") {
    const flightNumber =
      subject.flightNumber == null ? "" : ` (${subject.flightNumber}편)`;

    return {
      title:
        `${subject.airline ?? ""} ${subject.arrivalCityName}행${flightNumber} 탑승 안내`.trim(),
      body: "탑승 시작 10분 전이에요. 탑승을 준비해 주세요",
    };
  }

  return {
    title: `${subject.departureName} → ${subject.arrivalName} 탑승 안내`,
    body: "출발 10분 전이에요. 탑승을 준비해 주세요",
  };
}
