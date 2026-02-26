import { createTheme } from "@mui/material";

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4C84FF',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#c9b458',
    },
    grey: {
      500: '#787c7e',
    },
  },
  typography: {
    fontFamily: "'SUIT', sans-serif",
    fontWeightBold: 900,
    fontWeightRegular: 700,
    fontWeightMedium: 700,
    fontWeightLight: 600
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
            // padding: 4
          }
        })
      },

    }
  },
})