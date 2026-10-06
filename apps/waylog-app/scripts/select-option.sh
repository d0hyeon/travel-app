select_option() {
  local prompt=$1
  shift
  local options=("$@")
  local cursor=0 key i
  echo "$prompt (↑/↓ 이동, Enter 선택)"
  tput civis
  while true; do
    for i in "${!options[@]}"; do
      if [ "$i" -eq "$cursor" ]; then
        printf '\033[2K\r\033[36m❯ %s\033[0m\n' "${options[$i]}"
      else
        printf '\033[2K\r  %s\n' "${options[$i]}"
      fi
    done
    IFS= read -rsn1 key
    if [ "$key" = $'\033' ]; then
      read -rsn2 key
      case "$key" in
        '[A') cursor=$(( (cursor + ${#options[@]} - 1) % ${#options[@]} )) ;;
        '[B') cursor=$(( (cursor + 1) % ${#options[@]} )) ;;
      esac
    elif [ -z "$key" ]; then
      break
    fi
    printf '\033[%dA' "${#options[@]}"
  done
  tput cnorm
  selected=${options[$cursor]}
}

trap 'tput cnorm' EXIT
