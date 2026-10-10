import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import { LegalDocumentLayout, LegalSection } from './LegalDocumentLayout'
import { LEGAL_OPERATOR } from './legal.config'

const DELEGATES = [
  { name: 'Supabase, Inc.', purpose: '데이터베이스·인증', items: '이용자 프로필, 서비스 이용 중 생성한 모든 데이터', country: '미국' },
  { name: 'Cloudflare, Inc. (R2)', purpose: '이미지 저장', items: '업로드한 사진·이미지', country: '미국' },
  { name: 'Google LLC (지도, Cloud Vision)', purpose: '지도 표시, 티켓 이미지 텍스트 추출', items: '티켓 이미지, 지도 이용 시 좌표·검색어', country: '미국' },
  { name: 'Vercel Inc.', purpose: '웹 호스팅', items: '접속 IP 등 접속 기록', country: '미국' },
  { name: 'Apple Inc. / Google LLC (푸시 알림)', purpose: '푸시 알림 발송', items: '푸시 알림 토큰, 알림 내용', country: '미국' },
  { name: '주식회사 카카오', purpose: '지도, 장소 검색', items: '장소 검색어, 현재 위치 좌표(장소 검색 시)', country: '대한민국 (국외 이전 아님)' },
]

export default function PrivacyPolicyPage() {
  const { serviceName, operatorName, contactEmail, privacyOfficerName } = LEGAL_OPERATOR

  return (
    <LegalDocumentLayout title="개인정보처리방침">
      <LegalSection heading="1. 총칙">
        <Typography variant="body2">
          {operatorName}(이하 "운영자")는 {serviceName} 서비스(이하 "서비스")를 제공하면서 이용자의 개인정보를 소중하게
          다루며, 「개인정보 보호법」 등 관련 법령을 준수합니다. 이 방침은 운영자가 어떤 개인정보를 어떤 목적으로
          처리하고 어떻게 보호하는지 안내합니다.
        </Typography>
      </LegalSection>

      <LegalSection heading="2. 수집하는 개인정보 항목">
        <Typography variant="body2">1. 소셜 로그인 정보: 이름, 프로필 이미지, 이메일(Apple 로그인 시 제공되며, 이메일 가리기를 선택하면 Apple 릴레이 주소) — 카카오, Apple 로그인 지원</Typography>
        <Typography variant="body2">
          2. 서비스 이용 중 이용자가 생성하는 콘텐츠: 여행, 일정, 장소, 경비, 메모, 체크리스트, 사진, 게시물, 댓글,
          채팅 메시지, 등록한 교통편 티켓 정보
        </Typography>
        <Typography variant="body2">3. 푸시 알림 토큰(구독 정보): 알림 수신에 동의한 경우</Typography>
        <Typography variant="body2">4. 서비스 이용 기록</Typography>
        <Typography variant="body2">
          이용자의 이름과 프로필 사진은 다른 이용자와 로그인하지 않은 방문자에게도 공개될 수 있습니다.
        </Typography>
      </LegalSection>

      <LegalSection heading="3. 개인정보의 처리 목적">
        <Typography variant="body2">1. 회원 가입 및 본인 식별, 계정 관리</Typography>
        <Typography variant="body2">
          2. 여행 일정·장소·경비·메모·사진 기록, 여행 멤버와의 공유 및 채팅, 피드 게시물 게시와 공개 범위 적용 등
          서비스 제공
        </Typography>
        <Typography variant="body2">3. 교통편 티켓 이미지로부터 정보를 추출하여 등록하는 기능 제공</Typography>
        <Typography variant="body2">
          4. 작성자를 식별할 수 없는 형태로 가공한 여행 코스·방문지 정보를 다른 이용자에게 추천
        </Typography>
        <Typography variant="body2">5. 푸시 알림 발송</Typography>
        <Typography variant="body2">6. 부정 이용 방지, 신고 처리 및 서비스 안정성 확보</Typography>
      </LegalSection>

      <LegalSection heading="4. 위치정보의 이용">
        <Typography variant="body2">
          현재 위치 좌표는 이용자의 기기에서 지도 표시와 장소 검색 정확도 향상을 위해 사용됩니다. 장소를 검색할 때
          좌표가 카카오 장소 검색 API로 전달될 수 있으나, 운영자는 이 좌표를 서버에 저장하지 않습니다.
        </Typography>
        <Typography variant="body2">
          이용자가 여행에 등록한 장소의 좌표는 서비스에 저장됩니다. 사진에 포함된 위치정보(EXIF)는 사진과 가까운 장소를
          찾는 데 사용되며, 업로드 시 이미지 크기 조정 과정에서 제거됩니다.
        </Typography>
      </LegalSection>

      <LegalSection heading="5. 교통편 티켓 이미지(OCR) 처리">
        <Typography variant="body2">
          이용자가 교통편 티켓 이미지를 업로드하면 텍스트를 추출하기 위해 해당 이미지가 국외 제3자인 Google Cloud
          Vision으로 전송됩니다. 이 기능을 사용하지 않으면 이미지는 전송되지 않습니다.
        </Typography>
      </LegalSection>

      <LegalSection heading="6. 개인정보 처리 위탁 및 국외 이전">
        <Typography variant="body2">
          운영자는 서비스 제공을 위해 아래와 같이 개인정보 처리를 위탁하거나 이전합니다. 이전 국가는 수탁자의 소재국
          기준이며, 데이터가 저장되는 서버 리전이 다른 국가여도 같습니다.
        </Typography>
        <Box component={TableContainer} sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: 560 }}>
            <TableHead>
              <TableRow>
                <TableCell>수탁자</TableCell>
                <TableCell>위탁 업무</TableCell>
                <TableCell>이전·처리 항목</TableCell>
                <TableCell>이전 국가</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {DELEGATES.map((delegate) => (
                <TableRow key={delegate.name}>
                  <TableCell>{delegate.name}</TableCell>
                  <TableCell>{delegate.purpose}</TableCell>
                  <TableCell>{delegate.items}</TableCell>
                  <TableCell>{delegate.country}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </LegalSection>

      <LegalSection heading="7. 개인정보의 보유 및 파기">
        <Typography variant="body2">
          1. 운영자는 회원 탈퇴 시 이용자의 개인정보를 지체 없이 파기합니다. 이용자는 설정의 회원 탈퇴 기능으로 직접
          탈퇴할 수 있습니다.
        </Typography>
        <Typography variant="body2">
          탈퇴하면 이용자가 작성한 게시물, 사진, 댓글, 채팅 메시지와 교통편 티켓 이미지가 삭제됩니다. 이용자가 만든
          여행에 다른 멤버가 있으면 가장 먼저 참여한 멤버에게 소유권이 이전되고, 다른 멤버가 없으면 여행이 삭제됩니다.
        </Typography>
        <Typography variant="body2">
          2. 관계 법령에 따라 보존해야 하는 정보는 해당 법령에서 정한 기간 동안 보관한 후 파기합니다.
        </Typography>
        <Typography variant="body2">
          3. 전자적 파일 형태의 정보는 복구할 수 없는 방법으로 삭제합니다.
        </Typography>
      </LegalSection>

      <LegalSection heading="8. 이용자의 권리와 행사 방법">
        <Typography variant="body2">
          이용자는 언제든지 자신의 개인정보에 대한 열람, 정정, 삭제, 처리정지를 요구할 수 있습니다. 이름과 프로필
          사진 등은 서비스 내 설정에서 직접 변경할 수 있으며, 그 밖의 요구는 {contactEmail} 로 연락해 주시면 지체 없이
          조치합니다.
        </Typography>
      </LegalSection>

      <LegalSection heading="9. 만 14세 미만 아동">
        <Typography variant="body2">서비스는 만 14세 미만의 아동은 가입할 수 없습니다.</Typography>
      </LegalSection>

      <LegalSection heading="10. 개인정보 보호책임자 및 문의처">
        <Typography variant="body2">개인정보 보호책임자: {privacyOfficerName}</Typography>
        <Typography variant="body2">문의처: {contactEmail}</Typography>
      </LegalSection>

      <LegalSection heading="11. 방침의 변경">
        <Typography variant="body2">
          이 방침의 내용이 변경되는 경우 시행일 이전에 서비스 내에 공지합니다.
        </Typography>
      </LegalSection>
    </LegalDocumentLayout>
  )
}
