import { createTheme } from "@mui/material";
import type {} from "@mui/x-date-pickers/themeAugmentation";

export const theme = createTheme({
  zIndex: {
    modal: 1300,
    drawer: 1300,
  },
  palette: {
    mode: "light",
    primary: {
      main: "#4C84FF",
    },
    warning: {
      main: "#d68d06",
    },
    grey: {
      500: "#787c7e",
    },
    info: {
      main: "#333",
    },
    success: {
      main: "#66BB6A",
    },
  },
  typography: {
    fontFamily: "'SUIT', sans-serif",
    fontWeightBold: 900,
    fontWeightRegular: 700,
    fontWeightMedium: 700,
    fontWeightLight: 600,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        title: {
          fontSize: 20,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: (props) => ({
          [props.theme.breakpoints.down("md")]: {
            minHeight: 24,
            height: 40,
          },
        }),
      },
    },
    MuiTab: {
      styleOverrides: {
        root: (props) => ({
          [props.theme.breakpoints.down("md")]: {
            minHeight: "auto",
            fontSize: 12,
          },
        }),
      },
    },

    MuiButton: {
      variants: [
        {
          props: { size: "small" },
          style: (props) => ({
            minWidth: 30,
            height: 36,
            borderRadius: 8,
            [props.theme.breakpoints.down("md")]: {
              height: 24,
              fontSize: 11,
              minWidth: 28,
              borderRadius: 4,
            },
          }),
        },
        {
          props: { size: "medium" },
          style: (props) => ({
            height: 40,
            borderRadius: 12,
            fontSize: 15,
            lineHeight: 1,
            [props.theme.breakpoints.down("md")]: {
              height: 32,
              fontSize: 13,
              minWidth: 28,
              borderRadius: 8,
            },
          }),
        },
        {
          props: { size: "large" },
          style: (props) => ({
            height: 52,
            borderRadius: 16,
            fontSize: 15,
            fontWeight: "bold",
            [props.theme.breakpoints.down("md")]: {
              height: 40,
              fontSize: 14,

              borderRadius: 12,
            },
          }),
        },
      ],
      styleOverrides: {
        root: {
          whiteSpace: "nowrap",
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: (props) => ({
          minWidth: 500,
          borderRadius: 20,
          overflow: "hidden",
          [props.theme.breakpoints.down("md")]: {
            padding: 1,
            minWidth: "auto",
            width: "80vw",
          },
        }),
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: (props) => ({
          [props.theme.breakpoints.down("md")]: {
            fontSize: 16,
            padding: 16,
            paddingBlock: 12,
          },
        }),
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: (props) => ({
          [props.theme.breakpoints.down("md")]: {
            padding: 16,
            paddingTop: 0,
          },
        }),
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: (props) => ({
          [props.theme.breakpoints.down("md")]: {
            fontSize: 14,
          },
        }),
      },
    },
    MuiAccordion: {
      defaultProps: {
        disableGutters: true,
        elevation: 0,
      },
      styleOverrides: {
        root: (props) => ({
          border: `1px solid ${props.theme.palette.divider}`,
          borderRadius: 16,
          // MuiPaper 의 그림자를 그대로 두면 테두리와 겹쳐 짙어 보인다. 옅게 깐다.
          boxShadow: "0px 1px 3px rgba(0,0,0,0.04)",
          "&::before": { display: "none" },
          // MUI 는 첫·마지막 항목의 라운드를 따로 0 으로 덮는다. 단독으로 써도 모서리가 남게 되돌린다.
          "&:first-of-type, &:last-of-type": { borderRadius: 16 },
        }),
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        // medium 기본 높이(56px)는 모바일 폼에서 과하다. 입력 영역만 줄여 높이를 낮춘다.
        input: {
          paddingTop: 12,
          paddingBottom: 12,
        },
      },
    },
    // 날짜 입력은 MuiOutlinedInput 이 아니라 자체 슬롯을 쓴다. 같은 높이·라운드를 따로 맞춘다.
    MuiPickersOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        sectionsContainer: {
          paddingTop: 12,
          paddingBottom: 12,
        },
      },
    },
    MuiTextField: {
      variants: [
        {
          props: { variant: "standard" },
          style: (props) => ({
            [props.theme.breakpoints.down("md")]: {
              ".MuiFormLabel-root": { fontSize: 13 },
              ".MuiInput-input": { paddingInline: 2 },
            },
          }),
        },
        {
          props: { variant: "outlined" },
          style: {
            ".MuiFormLabel-root": { lineHeight: 1 },
          },
        },
      ],
    },
    MuiSwitch: {
      variants: [
        {
          props: { size: "medium" },
          style: (props) => ({
            height: 44,
            width: 64,
            ".MuiSwitch-switchBase": { height: 44 },
            ".MuiSwitch-thumb": {
              height: 18,
              width: 18,
              borderRadius: 9,
              marginInline: 4,
            },
            ".MuiSwitch-track": { borderRadius: 10 },
            ".Mui-checked": { transform: "translateX(20px)" },

            [props.theme.breakpoints.up("sm")]: {
              height: 50,
              width: 74,
              ".MuiSwitch-switchBase": { height: 50 },
              ".MuiSwitch-thumb": {
                height: 20,
                width: 20,
                borderRadius: 14,
                marginInline: 6,
              },
              ".MuiSwitch-track": { borderRadius: 14 },
              ".Mui-checked": { transform: "translateX(25px) !important" },
            },
          }),
        },
        {
          props: { size: "small" },
          style: (props) => {
            return {
              height: 30,
              width: 44,
              ".MuiSwitch-switchBase": { height: 30 },
              ".MuiSwitch-thumb": {
                height: 14,
                width: 14,
                borderRadius: 10,
                marginInline: 4,
              },
              ".MuiSwitch-track": { borderRadius: 10 },
              ".Mui-checked": { transform: "translateX(10px)" },

              [props.theme.breakpoints.up("sm")]: {
                height: 36,
                width: 56,
                ".MuiSwitch-switchBase": { height: 36 },
                ".MuiSwitch-thumb": {
                  height: 16,
                  width: 16,
                  borderRadius: 14,
                  marginInline: 6,
                },
                ".MuiSwitch-track": { borderRadius: 14 },
                ".Mui-checked": { transform: "translateX(20px) !important" },
              },
            };
          },
        },
      ],
    },
    MuiInputBase: {
      variants: [
        {
          props: { size: "small" },
          style: (props) => ({
            [props.theme.breakpoints.down("md")]: {
              fontSize: 12,
            },
          }),
        },
      ],
      styleOverrides: {
        root: (props) => ({
          [props.theme.breakpoints.down("md")]: {
            fontSize: 12,
            // padding: 4
          },
        }),
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: (props) => ({
          borderRadius: 8,
          boxShadow: `0px 0px 6px ${props.theme.palette.divider}`,
        }),
      },
    },
    MuiList: {
      styleOverrides: {
        root: (props) => ({
          [props.theme.breakpoints.down("md")]: {
            paddingTop: 4,
            paddingBottom: 4,
          },
        }),
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: (props) => ({
          fontSize: 14,
          [props.theme.breakpoints.down("md")]: {
            fontSize: 12,
            minHeight: 30,
          },
        }),
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        listbox: (props) => ({
          [props.theme.breakpoints.down("md")]: {
            paddingBlock: 4,
          },
        }),
        option: (props) => ({
          [props.theme.breakpoints.down("md")]: {
            fontSize: 13,
            minHeight: 36,
          },
        }),
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: (props) => ({
          [props.theme.breakpoints.down("md")]: {
            ".MuiPickersInputBase-root": {
              fontSize: 12,
              ".MuiInputAdornment-root .MuiSvgIcon-root": {
                width: "1rem",
                height: "1rem",
              },
            },
          },
        }),
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
        action: {
          marginRight: 0,
          flex: "0 0 auto",
        },
      },
    },
    MuiAlertTitle: {
      styleOverrides: {
        root: (props) => ({
          [props.theme.breakpoints.down("md")]: {
            fontSize: 12,
          },
        }),
      },
    },
  },
});
