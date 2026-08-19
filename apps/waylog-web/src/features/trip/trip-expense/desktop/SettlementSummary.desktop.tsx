import { Paper, Stack, Typography } from "@mui/material"
import { formatCurrency } from "@waylog/domains/expense";
import { MemberAvatar } from "~features/trip/trip-member/MemberAvatar";
import { AnimatedCountText } from "~shared/components/animation/AnimatedCountText"
import { useExpenseSummary } from "../useExpenseSummary";

interface Props {
  tripId: string;
}

export function SettlementSummary({ tripId }: Props) {
  const { totalInKRW, balances, members } = useExpenseSummary(tripId)

  return (
    <Stack direction="row" flex={0} spacing={2} flexWrap="wrap" useFlexGap>
      {/* 총 지출 (원화 환산) */}
      <Paper
        elevation={0}
        sx={theme => ({
          p: 3,
          py: 2,
          background: theme.palette.primary.main,
          color: 'white',
          borderRadius: 3,
        })}
      >
        <Stack alignItems="start" gap={1} height="100%">
          <Typography variant="body2" >
            총 지출
          </Typography>
          <AnimatedCountText
            value={totalInKRW}
            format={x => formatCurrency(x).padStart(formatCurrency(totalInKRW).length, '\u2007')}
            variant="h5"
            fontWeight="bold"
          />

        </Stack>
      </Paper>

      {/* 멤버별 잔액 미니 카드 */}
      {balances.map(({ memberId, balance }) => {
        const member = members.find(member => member.id === memberId);
        if (!member) return null;

        return (
          <Paper
            key={memberId}
            elevation={0}
            sx={{
              p: 2,
              py: 2,
              pb: 1,
              minWidth: 140,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <Stack alignItems="start" gap={0.5}>
              <Stack direction="row" spacing={0.5} alignItems="center" >
                <MemberAvatar member={member} size={20} />
                <Typography variant="body2" fontWeight="medium">{member.name}</Typography>
              </Stack>
              <AnimatedCountText
                value={balance}
                format={x => `${balance > 0 ? '+' : ''}${formatCurrency(x).padStart(String(balance).length, ' ')}`}
                variant="h6"
                fontWeight="bold"
                color={balance > 0 ? 'success.main' : balance < 0 ? 'error.main' : 'text.secondary'}
              />
              <Typography variant="caption" color="text.secondary">
                {balance > 0 ? '받을 돈' : balance < 0 ? '낼 돈' : '정산 완료'}
              </Typography>
            </Stack>
          </Paper>
        )
      })
      }
    </Stack >
  )
}
