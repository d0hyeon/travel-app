-- 공항 정적 데이터(이름·도시·타임존)를 단일 소스로 둔다. 지금까지는
-- packages/domains 의 TS 배열 하나였는데, Deno 엣지 함수가 이 workspace를
-- 못 읽어 쓸 때마다 사본을 만들어야 했다. 웹·앱·엣지 함수 모두 이 테이블을
-- 직접 조회하게 해 복사를 없앤다.
CREATE TABLE "public"."airports" (
    "code" "text" NOT NULL,
    "name_ko" "text" NOT NULL,
    "name_en" "text" NOT NULL,
    "city_ko" "text" NOT NULL,
    "timezone" "text" NOT NULL,
    "aliases" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "airports_pkey" PRIMARY KEY ("code")
);

-- 정적 참조 데이터라 모든 사용자가 읽을 수 있다. 쓰기는 마이그레이션으로만 한다.
ALTER TABLE "public"."airports" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "airports_read" ON "public"."airports"
    FOR SELECT TO "anon", "authenticated"
    USING (true);

GRANT SELECT ON TABLE "public"."airports" TO "anon";
GRANT SELECT ON TABLE "public"."airports" TO "authenticated";
GRANT ALL ON TABLE "public"."airports" TO "service_role";

INSERT INTO "public"."airports" ("code", "name_ko", "name_en", "city_ko", "timezone", "aliases") VALUES
    ('ICN', '인천국제공항', 'Incheon International Airport', '서울', 'Asia/Seoul', NULL),
    ('GMP', '김포국제공항', 'Gimpo International Airport', '서울', 'Asia/Seoul', NULL),
    ('PUS', '김해국제공항', 'Gimhae International Airport', '부산', 'Asia/Seoul', ARRAY['부산']),
    ('CJU', '제주국제공항', 'Jeju International Airport', '제주', 'Asia/Seoul', NULL),
    ('TAE', '대구국제공항', 'Daegu International Airport', '대구', 'Asia/Seoul', NULL),
    ('KIX', '간사이국제공항', 'Kansai International Airport', '오사카', 'Asia/Tokyo', ARRAY['교토','고베']),
    ('NRT', '나리타국제공항', 'Narita International Airport', '도쿄', 'Asia/Tokyo', NULL),
    ('HND', '하네다공항', 'Haneda Airport', '도쿄', 'Asia/Tokyo', NULL),
    ('FUK', '후쿠오카공항', 'Fukuoka Airport', '후쿠오카', 'Asia/Tokyo', NULL),
    ('CTS', '신치토세공항', 'New Chitose Airport', '삿포로', 'Asia/Tokyo', NULL),
    ('OKA', '나하공항', 'Naha Airport', '오키나와', 'Asia/Tokyo', NULL),
    ('TPE', '타오위안국제공항', 'Taoyuan International Airport', '타이베이', 'Asia/Taipei', NULL),
    ('HKG', '홍콩국제공항', 'Hong Kong International Airport', '홍콩', 'Asia/Hong_Kong', NULL),
    ('BKK', '수완나품국제공항', 'Suvarnabhumi Airport', '방콕', 'Asia/Bangkok', NULL),
    ('DAD', '다낭국제공항', 'Da Nang International Airport', '다낭', 'Asia/Ho_Chi_Minh', NULL),
    ('SIN', '창이국제공항', 'Singapore Changi Airport', '싱가포르', 'Asia/Singapore', NULL),
    ('PVG', '푸둥국제공항', 'Shanghai Pudong International Airport', '상하이', 'Asia/Shanghai', NULL),
    ('PEK', '베이징서우두국제공항', 'Beijing Capital International Airport', '베이징', 'Asia/Shanghai', NULL),
    ('LAX', '로스앤젤레스국제공항', 'Los Angeles International Airport', '로스앤젤레스', 'America/Los_Angeles', NULL),
    ('JFK', '존에프케네디국제공항', 'John F. Kennedy International Airport', '뉴욕', 'America/New_York', NULL),
    ('CDG', '샤를드골국제공항', 'Charles de Gaulle Airport', '파리', 'Europe/Paris', NULL),
    ('LHR', '히스로공항', 'Heathrow Airport', '런던', 'Europe/London', NULL),
    ('FRA', '프랑크푸르트공항', 'Frankfurt Airport', '프랑크푸르트', 'Europe/Berlin', NULL),
    ('SYD', '시드니국제공항', 'Sydney Airport', '시드니', 'Australia/Sydney', NULL),
    ('GUM', '괌국제공항', 'Antonio B. Won Pat International Airport', '괌', 'Pacific/Guam', NULL),
    ('KWJ', '광주공항', 'Gwangju Airport', '광주', 'Asia/Seoul', NULL),
    ('USN', '울산공항', 'Ulsan Airport', '울산', 'Asia/Seoul', NULL),
    ('KPO', '포항경주공항', 'Pohang Gyeongju Airport', '포항', 'Asia/Seoul', ARRAY['경주']),
    ('RSU', '여수공항', 'Yeosu Airport', '여수', 'Asia/Seoul', NULL),
    ('YNY', '양양국제공항', 'Yangyang International Airport', '양양', 'Asia/Seoul', ARRAY['속초','강릉']),
    ('NGO', '주부국제공항', 'Chubu Centrair International Airport', '나고야', 'Asia/Tokyo', ARRAY['센트레아']),
    ('ITM', '오사카국제공항', 'Osaka International Airport', '오사카', 'Asia/Tokyo', ARRAY['이타미']),
    ('UKB', '고베공항', 'Kobe Airport', '고베', 'Asia/Tokyo', NULL),
    ('MMY', '미야코공항', 'Miyako Airport', '미야코지마시', 'Asia/Tokyo', NULL),
    ('MYJ', '마쓰야마공항', 'Matsuyama Airport', '마쓰야마', 'Asia/Tokyo', NULL),
    ('MFM', '마카오국제공항', 'Macau International Airport', '마카오', 'Asia/Macau', NULL),
    ('SGN', '떤선녓국제공항', 'Tan Son Nhat International Airport', '호치민', 'Asia/Ho_Chi_Minh', NULL),
    ('HAN', '노이바이국제공항', 'Noi Bai International Airport', '하노이', 'Asia/Ho_Chi_Minh', ARRAY['사파']),
    ('CXR', '깜라인국제공항', 'Cam Ranh International Airport', '나트랑', 'Asia/Ho_Chi_Minh', NULL),
    ('PQC', '푸꾸옥국제공항', 'Phu Quoc International Airport', '푸꾸옥', 'Asia/Ho_Chi_Minh', NULL),
    ('HKT', '푸켓국제공항', 'Phuket International Airport', '푸켓', 'Asia/Bangkok', NULL),
    ('CEB', '막탄세부국제공항', 'Mactan-Cebu International Airport', '세부', 'Asia/Manila', NULL),
    ('MPH', '고돈반타얀공항', 'Godofredo P. Ramos Airport', '보라카이', 'Asia/Manila', ARRAY['칼리보','카티클란']),
    ('MNL', '니노이아키노국제공항', 'Ninoy Aquino International Airport', '마닐라', 'Asia/Manila', NULL),
    ('BKI', '코타키나발루국제공항', 'Kota Kinabalu International Airport', '코타키나발루', 'Asia/Kuching', NULL),
    ('KUL', '쿠알라룸푸르국제공항', 'Kuala Lumpur International Airport', '쿠알라룸푸르', 'Asia/Kuala_Lumpur', NULL),
    ('DPS', '응우라라이국제공항', 'Ngurah Rai International Airport', '발리', 'Asia/Makassar', ARRAY['덴파사르']),
    ('CGK', '수카르노하타국제공항', 'Soekarno-Hatta International Airport', '자카르타', 'Asia/Jakarta', NULL),
    ('FCO', '피우미치노공항', 'Leonardo da Vinci International Airport', '로마', 'Europe/Rome', ARRAY['레오나르도다빈치']),
    ('MXP', '말펜사공항', 'Milan Malpensa Airport', '밀라노', 'Europe/Rome', NULL),
    ('VCE', '마르코폴로공항', 'Venice Marco Polo Airport', '베네치아', 'Europe/Rome', NULL),
    ('FLR', '피렌체공항', 'Florence Airport', '피렌체', 'Europe/Rome', NULL),
    ('NAP', '나폴리국제공항', 'Naples International Airport', '나폴리', 'Europe/Rome', NULL),
    ('BCN', '엘프라트공항', 'Josep Tarradellas Barcelona-El Prat Airport', '바르셀로나', 'Europe/Madrid', NULL),
    ('LIS', '움베르투델가두공항', 'Humberto Delgado Airport', '리스본', 'Europe/Lisbon', NULL),
    ('OPO', '포르투공항', 'Francisco Sá Carneiro Airport', '포르투', 'Europe/Lisbon', NULL),
    ('NCE', '니스코트다쥐르공항', 'Nice Côte d''Azur Airport', '니스', 'Europe/Paris', NULL),
    ('PRG', '바츨라프하벨공항', 'Václav Havel Airport Prague', '프라하', 'Europe/Prague', NULL),
    ('AMS', '스히폴공항', 'Amsterdam Airport Schiphol', '암스테르담', 'Europe/Amsterdam', NULL),
    ('ZRH', '취리히공항', 'Zurich Airport', '취리히', 'Europe/Zurich', ARRAY['인터라켄','베른']),
    ('GVA', '제네바공항', 'Geneva Airport', '제네바', 'Europe/Zurich', NULL),
    ('VIE', '비엔나국제공항', 'Vienna International Airport', '비엔나', 'Europe/Vienna', ARRAY['빈']),
    ('SZG', '잘츠부르크공항', 'Salzburg Airport', '잘츠부르크', 'Europe/Vienna', ARRAY['할슈타트']),
    ('BUD', '부다페스트공항', 'Budapest Ferenc Liszt International Airport', '부다페스트', 'Europe/Budapest', NULL),
    ('HEL', '헬싱키반타공항', 'Helsinki-Vantaa Airport', '헬싱키', 'Europe/Helsinki', NULL),
    ('IST', '이스탄불공항', 'Istanbul Airport', '이스탄불', 'Europe/Istanbul', NULL),
    ('DXB', '두바이국제공항', 'Dubai International Airport', '두바이', 'Asia/Dubai', NULL),
    ('DOH', '하마드국제공항', 'Hamad International Airport', '도하', 'Asia/Qatar', NULL),
    ('SFO', '샌프란시스코국제공항', 'San Francisco International Airport', '샌프란시스코', 'America/Los_Angeles', NULL),
    ('LAS', '해리리드국제공항', 'Harry Reid International Airport', '라스베이거스', 'America/Los_Angeles', NULL),
    ('HNL', '호놀룰루국제공항', 'Daniel K. Inouye International Airport', '호놀룰루', 'Pacific/Honolulu', NULL),
    ('YVR', '밴쿠버국제공항', 'Vancouver International Airport', '벤쿠버', 'America/Vancouver', NULL),
    ('YYZ', '토론토피어슨국제공항', 'Toronto Pearson International Airport', '토론토', 'America/Toronto', NULL),
    ('CUN', '칸쿤국제공항', 'Cancún International Airport', '칸쿤', 'America/Cancun', NULL);
