import { Typography } from '@mui/material'
import { LegalDocumentLayout, LegalSection } from './LegalDocumentLayout'
import { LEGAL_OPERATOR } from './legal.config'

export default function TermsOfServicePage() {
  const { serviceName, operatorName, contactEmail } = LEGAL_OPERATOR

  return (
    <LegalDocumentLayout title="이용약관">
      <LegalSection heading="제1조 (목적)">
        <Typography variant="body2">
          이 약관은 {operatorName}(이하 "운영자")가 제공하는 {serviceName} 서비스(이하 "서비스")의 이용과 관련하여
          운영자와 이용자 사이의 권리, 의무 및 책임사항, 기타 필요한 사항을 정하는 것을 목적으로 합니다.
        </Typography>
      </LegalSection>

      <LegalSection heading="제2조 (정의)">
        <Typography variant="body2">
          1. "서비스"란 여행 일정·장소·경비·메모·체크리스트·사진 기록, 여행 멤버와의 공유·채팅, 피드 게시물 작성 및
          열람, 교통편 티켓 등록 등 운영자가 제공하는 여행 기록·공유 기능 일체를 말합니다.
        </Typography>
        <Typography variant="body2">2. "이용자"란 이 약관에 따라 서비스를 이용하는 회원을 말합니다.</Typography>
        <Typography variant="body2">
          3. "계정"이란 이용자가 소셜 로그인으로 가입하여 서비스에서 식별되는 이용 단위를 말합니다.
        </Typography>
        <Typography variant="body2">
          4. "게시물"이란 이용자가 서비스에 등록한 여행, 일정, 장소, 경비, 메모, 사진, 피드 글, 댓글, 채팅 메시지 등
          모든 콘텐츠를 말합니다.
        </Typography>
      </LegalSection>

      <LegalSection heading="제3조 (약관의 효력 및 변경)">
        <Typography variant="body2">
          1. 이 약관은 서비스 화면에 게시하거나 그 밖의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.
        </Typography>
        <Typography variant="body2">
          2. 운영자는 관련 법령을 위반하지 않는 범위에서 이 약관을 변경할 수 있으며, 변경 시 적용일과 변경 사유를
          적용일 7일 전부터 서비스 내에 공지합니다. 이용자에게 불리한 변경은 30일 전부터 공지합니다.
        </Typography>
        <Typography variant="body2">
          3. 이용자가 변경된 약관의 적용일 이후에도 서비스를 계속 이용하면 변경된 약관에 동의한 것으로 봅니다.
        </Typography>
      </LegalSection>

      <LegalSection heading="제4조 (계정)">
        <Typography variant="body2">
          1. 이용자는 카카오 또는 Apple 계정을 이용한 소셜 로그인으로 가입할 수 있습니다.
        </Typography>
        <Typography variant="body2">2. 만 14세 미만은 가입할 수 없습니다.</Typography>
        <Typography variant="body2">
          3. 이용자는 자신의 계정을 직접 관리해야 하며, 계정을 타인에게 양도하거나 대여할 수 없습니다.
        </Typography>
        <Typography variant="body2">
          4. 이용자는 언제든지 문의처로 회원 탈퇴를 요청할 수 있으며, 탈퇴 시 개인정보는 개인정보처리방침에 따라 처리됩니다.
        </Typography>
        <Typography variant="body2">
          5. 이용자의 이름과 프로필 사진은 다른 이용자와 로그인하지 않은 방문자에게도 공개될 수 있습니다.
        </Typography>
      </LegalSection>

      <LegalSection heading="제5조 (이용자의 의무)">
        <Typography variant="body2">이용자는 다음 행위를 해서는 안 됩니다.</Typography>
        <Typography variant="body2">1. 타인의 개인정보, 초상, 저작권 등 권리를 침해하는 행위</Typography>
        <Typography variant="body2">
          2. 불법 게시물, 타인을 비방·협박·괴롭히는 게시물, 음란·폭력적인 게시물을 등록하는 행위
        </Typography>
        <Typography variant="body2">3. 타인의 계정을 도용하거나 허위 정보를 등록하는 행위</Typography>
        <Typography variant="body2">4. 서비스의 정상적인 운영을 방해하거나 시스템에 비정상적으로 접근하는 행위</Typography>
        <Typography variant="body2">5. 그 밖에 관련 법령 및 이 약관에 위반되는 행위</Typography>
      </LegalSection>

      <LegalSection heading="제6조 (게시물의 권리와 이용 허락)">
        <Typography variant="body2">
          1. 게시물에 대한 저작권과 그 밖의 권리는 이용자에게 귀속됩니다.
        </Typography>
        <Typography variant="body2">
          2. 이용자는 운영자에게 서비스의 운영, 표시, 노출에 필요한 범위에서 게시물을 저장·복제·전송·표시할 수 있는
          비독점적 이용을 허락합니다. 이용 허락은 이용자가 게시물을 삭제하거나 탈퇴하면 종료됩니다.
        </Typography>
        <Typography variant="body2">
          3. 피드 게시물은 이용자가 선택한 공개 범위(비공개, 여행 멤버 공개, 전체 공개)에 따라 노출됩니다. 공개 범위를
          설정할 책임은 이용자에게 있습니다.
        </Typography>
        <Typography variant="body2">
          4. 여행 멤버와 공유되는 일정, 경비, 메모, 사진, 채팅 등은 해당 여행에 참여한 멤버에게 표시됩니다.
        </Typography>
      </LegalSection>

      <LegalSection heading="제7조 (게시물의 삭제 및 이용 제한)">
        <Typography variant="body2">
          1. 누구든지 권리를 침해하거나 이 약관에 위반되는 게시물을 발견하면 {contactEmail} 로 신고할 수 있습니다.
        </Typography>
        <Typography variant="body2">
          2. 운영자는 신고를 접수하면 내용을 확인하여 필요한 경우 해당 게시물을 삭제하거나 공개를 제한할 수 있습니다.
        </Typography>
        <Typography variant="body2">
          3. 운영자는 이용자가 제5조를 위반한 경우 게시물 삭제, 서비스 이용 제한, 계정 정지 또는 탈퇴 처리를 할 수
          있습니다.
        </Typography>
        <Typography variant="body2">
          4. 게시물이 삭제되거나 이용이 제한된 이용자는 {contactEmail} 로 이의를 제기할 수 있습니다.
        </Typography>
      </LegalSection>

      <LegalSection heading="제8조 (서비스의 변경 및 중단)">
        <Typography variant="body2">
          1. 운영자는 서비스의 내용을 개선하거나 변경할 수 있으며, 중요한 변경은 사전에 공지합니다.
        </Typography>
        <Typography variant="body2">
          2. 운영자는 시스템 점검, 장애, 외부 서비스 제공자의 사정 등 불가피한 사유가 있는 경우 서비스의 전부 또는
          일부를 일시적으로 중단할 수 있습니다.
        </Typography>
        <Typography variant="body2">
          3. 운영자가 서비스를 종료하는 경우 사전에 공지하며, 이용자가 게시물을 확인할 수 있도록 합리적인 기간을
          둡니다.
        </Typography>
      </LegalSection>

      <LegalSection heading="제9조 (면책)">
        <Typography variant="body2">
          1. 운영자는 천재지변, 외부 서비스 장애 등 운영자의 통제 범위를 벗어난 사유로 서비스를 제공할 수 없는 경우
          책임을 지지 않습니다.
        </Typography>
        <Typography variant="body2">
          2. 운영자는 이용자의 귀책사유로 발생한 서비스 이용 장애와 손해에 대하여 책임을 지지 않습니다.
        </Typography>
        <Typography variant="body2">
          3. 지도, 장소, 날씨, 교통편 정보 등 외부 출처에서 제공되는 정보는 정확성을 보증하지 않으며, 이용자가 이를
          신뢰하여 입은 손해에 대하여 운영자는 고의 또는 중대한 과실이 없는 한 책임을 지지 않습니다.
        </Typography>
        <Typography variant="body2">
          4. 운영자는 이용자가 게시한 게시물의 내용과 이용자 간 분쟁에 대하여 책임을 지지 않습니다.
        </Typography>
      </LegalSection>

      <LegalSection heading="제10조 (준거법 및 관할)">
        <Typography variant="body2">
          이 약관의 해석과 적용, 서비스 이용과 관련한 분쟁에는 대한민국 법을 적용하며, 분쟁에 관한 소송은
          민사소송법에 따른 관할 법원에 제기합니다.
        </Typography>
      </LegalSection>

      <LegalSection heading="문의">
        <Typography variant="body2">
          운영자: {operatorName} / 문의: {contactEmail}
        </Typography>
      </LegalSection>
    </LegalDocumentLayout>
  )
}
