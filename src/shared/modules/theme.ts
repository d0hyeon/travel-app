import { createTheme } from "@mui/material";

const wordleColors = {
  correct: '#6aaa64',    // 초록 - 정답
  present: '#c9b458',    // 노랑 - 포함
  absent: '#787c7e',     // 회색 - 오답
  border: '#d3d6da',
  text: '#1a1a1b',
  textSecondary: '#787c7e',
} as const;

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: wordleColors.correct,
      dark: '#5a9a54',
      contrastText: '#ffffff',
    },
    warning: {
      main: wordleColors.present,
    },
    grey: {
      500: wordleColors.absent,
    },
  },
  components: {
    MuiButton: {
      variants: [
        {
          props: { size: 'small' },
          style: (props) => ({
            minWidth: 30,
            height: 36,
            borderRadius: 8,
            [props.theme.breakpoints.down('md')]: {
              height: 24,
              fontSize: 11,
              minWidth: 28,
              borderRadius: 4,
            }
          }),
        },
        {
          props: { size: 'medium' },
          style: props => ({
            height: 40, borderRadius: 12, fontSize: 15, lineHeight: 1,
            [props.theme.breakpoints.down('md')]: {
              height: 32,
              fontSize: 13,
              minWidth: 28,
              borderRadius: 8,
            }
          }),
        },
        {
          props: { size: 'large' },
          style: props => ({
            height: 52, borderRadius: 16, fontSize: 15, fontWeight: 'bold',
            [props.theme.breakpoints.down('md')]: {
              height: 40,
              fontSize: 14,
              fontWeight: 'normal',
              borderRadius: 12,
            }
          })
        }
      ],
    },

    MuiDialog: {
      styleOverrides: {
        paper: (props) => ({
          minWidth: 500,
          borderRadius: 20,
          overflow: 'hidden',
          [props.theme.breakpoints.down('md')]: {
            padding: 1,
            minWidth: 'auto',
            width: '80vw'
          }
        })
      }
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: (props) => ({
          [props.theme.breakpoints.down('md')]: {
            fontSize: 14,
            padding: 16,
            paddingBlock: 12
          }
        })
      }
    },
    MuiDialogContent: {
      styleOverrides: {
        root: (props) => ({
          [props.theme.breakpoints.down('md')]: {
            padding: 16,
            paddingTop: 0,
          }
        })
      }
    },
    MuiInputLabel: {
      styleOverrides: {

        root: props => ({
          [props.theme.breakpoints.down('md')]: {
            fontSize: 14,
          }
        })
      }
    },
    MuiInputBase: {
      variants: [
        {
          props: { size: 'small' },
          style: props => ({
            [props.theme.breakpoints.down('md')]: {
              fontSize: 12,
            }
          })
        }
      ],
      styleOverrides: {
        root: (props) => ({
          [props.theme.breakpoints.down('md')]: {
            fontSize: 12,
            padding: 4
          }
        })
      },

    }
  },
})