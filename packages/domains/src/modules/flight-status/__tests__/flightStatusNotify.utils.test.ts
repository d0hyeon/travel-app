import { describe, expect, it } from "vitest";
import { FlightStatusKind } from "../flightStatus.types";
import {
  getIsGateChanged,
  getShouldNotify,
  toNotificationText,
} from "../flightStatusNotify.utils";

const 지연 = {
  kind: FlightStatusKind.지연,
  estimatedAt: "2026-09-17T20:00:00+09:00",
  gate: null,
};
const 없음 = {
  lastNotifiedKind: null,
  lastNotifiedEstimatedAt: null,
  lastNotifiedGate: null,
};

describe("getShouldNotify", () => {
  it("처음 지연되면 보낸다", () => {
    expect(getShouldNotify(지연, null, 없음)).toBe(true);
  });

  // 5분마다 도는 cron 이라 이게 참이면 지연이 풀릴 때까지 계속 보낸다.
  it("같은 지연을 이미 보냈으면 다시 보내지 않는다", () => {
    expect(
      getShouldNotify(지연, null, {
        lastNotifiedKind: "delayed",
        lastNotifiedEstimatedAt: "2026-09-17T20:00:00+09:00",
        lastNotifiedGate: null,
      }),
    ).toBe(false);
  });

  // 알림 이력은 timestamptz 라 UTC 로 읽히고, API 변환값은 +09:00 이다.
  it("시간대 표기만 다른 같은 지연 시각이면 다시 보내지 않는다", () => {
    expect(
      getShouldNotify(지연, null, {
        lastNotifiedKind: "delayed",
        lastNotifiedEstimatedAt: "2026-09-17T11:00:00+00:00",
        lastNotifiedGate: null,
      }),
    ).toBe(false);
  });

  it("결항을 알린 뒤에는 시각 표기가 달라도 다시 보내지 않는다", () => {
    expect(
      getShouldNotify(
        {
          kind: FlightStatusKind.결항,
          estimatedAt: "2026-09-17T20:00:00+09:00",
          gate: null,
        },
        null,
        {
          lastNotifiedKind: "cancelled",
          lastNotifiedEstimatedAt: "2026-09-17T11:00:00+00:00",
          lastNotifiedGate: null,
        },
      ),
    ).toBe(false);
  });

  it("지연 시각이 또 밀리면 다시 보낸다", () => {
    expect(
      getShouldNotify(지연, null, {
        lastNotifiedKind: "delayed",
        lastNotifiedEstimatedAt: "2026-09-17T19:50:00+09:00",
        lastNotifiedGate: null,
      }),
    ).toBe(true);
  });

  it("지연이던 편이 결항되면 보낸다", () => {
    expect(
      getShouldNotify(
        { kind: FlightStatusKind.결항, estimatedAt: null, gate: null },
        null,
        {
          lastNotifiedKind: "delayed",
          lastNotifiedEstimatedAt: "2026-09-17T20:00:00+09:00",
          lastNotifiedGate: null,
        },
      ),
    ).toBe(true);
  });

  it("같은 결항을 또 보내지 않는다", () => {
    expect(
      getShouldNotify(
        { kind: FlightStatusKind.결항, estimatedAt: null, gate: null },
        null,
        {
          lastNotifiedKind: "cancelled",
          lastNotifiedEstimatedAt: null,
          lastNotifiedGate: null,
        },
      ),
    ).toBe(false);
  });

  it("예정은 알릴 것이 없다", () => {
    expect(
      getShouldNotify(
        { kind: FlightStatusKind.예정, estimatedAt: null, gate: null },
        null,
        없음,
      ),
    ).toBe(false);
  });

  // 이미 일어난 일이라 알려도 늦다.
  it("출발·도착은 알리지 않는다", () => {
    expect(
      getShouldNotify(
        { kind: FlightStatusKind.출발, estimatedAt: null, gate: null },
        null,
        없음,
      ),
    ).toBe(false);
    expect(
      getShouldNotify(
        { kind: FlightStatusKind.도착, estimatedAt: null, gate: null },
        null,
        없음,
      ),
    ).toBe(false);
  });

  // 지연이 풀려 정상으로 돌아와도 "정상화" 알림은 보내지 않는다.
  it("지연이 풀리면 조용히 넘어간다", () => {
    expect(
      getShouldNotify(
        { kind: FlightStatusKind.예정, estimatedAt: null, gate: null },
        null,
        {
          lastNotifiedKind: "delayed",
          lastNotifiedEstimatedAt: "2026-09-17T20:00:00+09:00",
          lastNotifiedGate: null,
        },
      ),
    ).toBe(false);
  });
});

describe("getShouldNotify — 탑승구 변경", () => {
  const 예정 = (gate: string | null) => ({
    kind: FlightStatusKind.예정,
    estimatedAt: null,
    gate,
  });
  const 알린탑승구 = (gate: string) => ({ ...없음, lastNotifiedGate: gate });

  it("직전에 관측한 탑승구가 없으면 처음 배정이라 보내지 않는다", () => {
    expect(getShouldNotify(예정("101"), null, 없음)).toBe(false);
  });

  it("탑승구가 빈 문자열이면 아직 배정 전이라 보내지 않는다", () => {
    expect(getShouldNotify(예정(""), "101", 없음)).toBe(false);
  });

  it("직전에 관측한 탑승구와 다르면 보낸다", () => {
    expect(getShouldNotify(예정("102"), "101", 없음)).toBe(true);
  });

  // 알림 창(출발 24시간 전) 밖에서 이미 관측된 탑승구가 창에 들어올 때다.
  it("직전에 관측한 탑승구와 같으면 알린 적이 없어도 보내지 않는다", () => {
    expect(getShouldNotify(예정("101"), "101", 없음)).toBe(false);
  });

  // 관측 저장이 실패해 직전 관측값이 갱신되지 않은 채 다음 주기가 돈 경우다.
  it("직전 관측과 달라도 그 탑승구를 이미 알렸으면 다시 보내지 않는다", () => {
    expect(getShouldNotify(예정("102"), "101", 알린탑승구("102"))).toBe(false);
  });

  it("원래 탑승구로 되돌아오면 다시 보낸다", () => {
    expect(getShouldNotify(예정("101"), "102", 알린탑승구("102"))).toBe(true);
  });

  it("지연 중에도 탑승구가 바뀌면 보낸다", () => {
    expect(
      getShouldNotify({ ...지연, gate: "102" }, "101", {
        lastNotifiedKind: "delayed",
        lastNotifiedEstimatedAt: "2026-09-17T20:00:00+09:00",
        lastNotifiedGate: "101",
      }),
    ).toBe(true);
  });

  // 이미 지난 일이라 게이트가 남아 있어도 알리지 않는다.
  it("출발·도착·결항·회항 이후에는 탑승구 변경을 알리지 않는다", () => {
    expect(
      getShouldNotify(
        { kind: FlightStatusKind.출발, estimatedAt: null, gate: "102" },
        "101",
        {
          lastNotifiedKind: "departed",
          lastNotifiedEstimatedAt: null,
          lastNotifiedGate: "101",
        },
      ),
    ).toBe(false);

    expect(
      getIsGateChanged(
        { kind: FlightStatusKind.결항, estimatedAt: null, gate: "102" },
        "101",
        알린탑승구("101"),
      ),
    ).toBe(false);
  });
});

describe("getIsGateChanged", () => {
  it("지연과 겹친 첫 배정은 탑승구 변경이 아니다", () => {
    expect(getIsGateChanged({ ...지연, gate: "101" }, null, 없음)).toBe(false);
  });
});

describe("getShouldNotify — notifyAlways", () => {
  it("상태와 무관하게 보낸다", () => {
    expect(
      getShouldNotify(
        { kind: FlightStatusKind.예정, estimatedAt: null, gate: null },
        null,
        없음,
        {
          notifyAlways: true,
        },
      ),
    ).toBe(true);
  });

  it("이미 보낸 상태여도 또 보낸다", () => {
    expect(
      getShouldNotify(
        지연,
        null,
        {
          lastNotifiedKind: "delayed",
          lastNotifiedEstimatedAt: "2026-09-17T20:00:00+09:00",
          lastNotifiedGate: null,
        },
        { notifyAlways: true },
      ),
    ).toBe(true);
  });

  it("끄면 원래 규칙을 따른다", () => {
    expect(
      getShouldNotify(
        { kind: FlightStatusKind.예정, estimatedAt: null, gate: null },
        null,
        없음,
        {
          notifyAlways: false,
        },
      ),
    ).toBe(false);
  });
});

describe("toNotificationText", () => {
  const 항공편 = {
    airline: "대한항공",
    flightNumber: "011",
    arrivalCityName: "파리",
  };

  it("지연은 변경된 출발 시각을 말한다", () => {
    const { title, body } = toNotificationText(항공편, 지연);

    expect(title).toBe("대한항공 파리행 (011편) 지연");
    expect(body).toContain("20:00");
  });

  it("결항은 시각을 말하지 않는다", () => {
    const { title, body } = toNotificationText(항공편, {
      kind: FlightStatusKind.결항,
      estimatedAt: null,
      gate: null,
    });

    expect(title).toBe("대한항공 파리행 (011편) 결항");
    expect(body).not.toContain(":");
  });

  it("회항을 알린다", () => {
    expect(
      toNotificationText(항공편, {
        kind: FlightStatusKind.회항,
        estimatedAt: null,
        gate: null,
      }).title,
    ).toBe("대한항공 파리행 (011편) 회항");
  });

  it("정상 운항편도 문구를 갖는다", () => {
    const { title, body } = toNotificationText(항공편, {
      kind: FlightStatusKind.예정,
      estimatedAt: null,
      gate: null,
    });

    expect(title).toBe("대한항공 파리행 (011편) 정상 운항 예정");
    expect(body).toContain("정상 운항 예정");
  });

  it("지연인데 변경 시각이 없으면 시각을 지어내지 않는다", () => {
    const { body } = toNotificationText(항공편, {
      kind: FlightStatusKind.지연,
      estimatedAt: null,
      gate: null,
    });

    expect(body).toBe("항공편이 지연됐어요.");
  });
});

describe("toNotificationText — 탑승구 변경", () => {
  const 항공편 = {
    airline: "대한항공",
    flightNumber: "011",
    arrivalCityName: "파리",
  };

  it("예정편에서 탑승구만 바뀌면 전용 문구를 보낸다", () => {
    const { title, body } = toNotificationText(
      항공편,
      { kind: FlightStatusKind.예정, estimatedAt: null, gate: "102" },
      true,
    );

    expect(title).toBe("대한항공 파리행 (011편) 탑승구 변경");
    expect(body).toBe("탑승구가 102로 변경됐어요.");
  });

  it("지연 알림에 탑승구 변경이 겹치면 한 알림에 함께 담는다", () => {
    const { body } = toNotificationText(
      항공편,
      {
        kind: FlightStatusKind.지연,
        estimatedAt: "2026-09-17T20:00:00+09:00",
        gate: "102",
      },
      true,
    );

    expect(body).toContain("20:00");
    expect(body).toContain("탑승구가 102로 변경됐어요.");
  });

  it("탑승구 변경이 없으면 접미사를 붙이지 않는다", () => {
    const { body } = toNotificationText(항공편, 지연, false);

    expect(body).not.toContain("탑승구");
  });
});
