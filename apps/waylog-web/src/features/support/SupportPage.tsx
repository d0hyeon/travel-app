import { Box, Button, Link, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router'
import { AppRoute } from '@waylog/routes'
import { LEGAL_OPERATOR } from '~features/legal/legal.config'

const FAQS = [
  {
    question: '계정을 삭제하고 싶어요',
    answers: [
      '내 프로필 > 설정 > 회원 탈퇴에서 직접 삭제할 수 있어요.',
      '삭제하면 내 여행, 게시물, 사진, 채팅이 모두 지워지고 복구할 수 없어요.',
    ],
  },
  {
    question: '부적절한 게시물이나 사용자를 신고·차단하고 싶어요',
    answers: ['게시물 또는 프로필의 메뉴에서 신고·차단할 수 있어요. 차단한 사용자는 설정 > 차단한 사용자에서 해제해요.'],
  },
  {
    question: '채팅 알림이 오지 않아요',
    answers: ['기기의 설정 > 알림에서 WayLog 알림이 허용돼 있는지 확인해 주세요.'],
  },
]

const BRAND_COLOR = '#2F5BD3'
const COPIED_LABEL_DURATION_MS = 1600

export default function SupportPage() {
  const { contactEmail } = LEGAL_OPERATOR
  const [openFaqIndexes, setOpenFaqIndexes] = useState([0])
  const [isEmailCopied, setIsEmailCopied] = useState(false)

  useEffect(() => {
    if (!isEmailCopied) return
    const timer = setTimeout(() => setIsEmailCopied(false), COPIED_LABEL_DURATION_MS)
    return () => clearTimeout(timer)
  }, [isEmailCopied])

  const toggleFaq = (index: number) =>
    setOpenFaqIndexes((current) =>
      current.includes(index) ? current.filter((openIndex) => openIndex !== index) : [...current, index],
    )

  const copyEmail = async () => {
    await navigator.clipboard.writeText(contactEmail)
    setIsEmailCopied(true)
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        px: 2,
        py: 4,
        bgcolor: '#343C4B',
        wordBreak: 'keep-all',
      }}
    >
      <Box
        component="main"
        sx={{
          width: '100%',
          maxWidth: 560,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          px: 3.5,
          pt: 6,
          pb: 4,
          borderRadius: '20px',
          bgcolor: '#FFFFFF',
          color: '#1A1D23',
        }}
      >
        <Stack component="header" spacing={1}>
          <Typography fontSize={13} fontWeight={600} letterSpacing="0.08em" color={BRAND_COLOR}>
            WAYLOG
          </Typography>
          <Typography component="h1" fontSize={30} fontWeight={700} letterSpacing="-0.02em" lineHeight={1.25}>
            고객 지원
          </Typography>
        </Stack>

        <Stack component="section" spacing={2}>
          <Typography component="h2" fontSize={20} fontWeight={700} letterSpacing="-0.01em">
            문의하기
          </Typography>
          <Typography fontSize={16} lineHeight={1.65} color="#4A505C" sx={{ textWrap: 'pretty' }}>
            사용 중 불편한 점이나 궁금한 점은 아래 이메일로 보내 주세요. 영업일 기준 3일 이내에 답변드릴게요.
          </Typography>
          <Stack spacing={1.5} p={2.25} borderRadius="14px" bgcolor="#F3F5F9">
            <Typography fontSize={16} fontWeight={600} sx={{ wordBreak: 'break-all' }}>
              {contactEmail}
            </Typography>
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1}>
              <Button
                component="a"
                href={`mailto:${contactEmail}`}
                variant="contained"
                disableElevation
                sx={{
                  height: 48,
                  borderRadius: '12px',
                  bgcolor: BRAND_COLOR,
                  color: '#FFFFFF',
                  fontSize: 15,
                  fontWeight: 600,
                  '&:hover': { bgcolor: '#1E3F9E' },
                }}
              >
                메일 보내기
              </Button>
              <Button
                variant="outlined"
                onClick={copyEmail}
                sx={{
                  height: 48,
                  borderRadius: '12px',
                  borderColor: '#D5DAE3',
                  bgcolor: '#FFFFFF',
                  color: '#1A1D23',
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                {isEmailCopied ? '복사됨' : '주소 복사'}
              </Button>
            </Box>
          </Stack>
        </Stack>

        <Box component="section">
          <Typography component="h2" fontSize={20} fontWeight={700} letterSpacing="-0.01em" mb={2}>
            자주 묻는 질문
          </Typography>
          <Box borderBottom="1px solid #E6E9EF">
            {FAQS.map(({ question, answers }, index) => {
              const isOpen = openFaqIndexes.includes(index)

              return (
                <Box key={question} borderTop="1px solid #E6E9EF">
                  <Box
                    component="button"
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => toggleFaq(index)}
                    sx={{
                      width: '100%',
                      minHeight: 56,
                      py: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 2,
                      border: 'none',
                      bgcolor: 'transparent',
                      color: 'inherit',
                      font: 'inherit',
                      fontSize: 16,
                      fontWeight: 600,
                      lineHeight: 1.45,
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    <span>{question}</span>
                    <Box
                      component="span"
                      sx={{
                        flex: 'none',
                        fontSize: 20,
                        fontWeight: 400,
                        color: '#8A909C',
                        transform: isOpen ? 'rotate(45deg)' : 'none',
                        transition: 'transform .2s',
                      }}
                    >
                      +
                    </Box>
                  </Box>
                  {isOpen && (
                    <Stack spacing={0.75} pb={2.5}>
                      {answers.map((answer) => (
                        <Typography key={answer} fontSize={15} lineHeight={1.65} color="#4A505C" sx={{ textWrap: 'pretty' }}>
                          {answer}
                        </Typography>
                      ))}
                    </Stack>
                  )}
                </Box>
              )
            })}
          </Box>
        </Box>

        <Stack component="footer" direction="row" spacing={2.5} pt={1} mt="auto">
          <Link component={RouterLink} to={AppRoute.이용약관} underline="none" fontSize={14} color="#6B717D">
            이용약관
          </Link>
          <Link component={RouterLink} to={AppRoute.개인정보처리방침} underline="none" fontSize={14} color="#6B717D">
            개인정보처리방침
          </Link>
        </Stack>
      </Box>
    </Box>
  )
}
