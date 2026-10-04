import { Pressable, StyleSheet } from 'react-native'
import { Stack, StackProps } from './Stack'
import { ComponentProps, ReactNode } from 'react'
import { palette } from '~shared/config/tokens'
import { useAppNavigation } from '~shared/hooks/useAppNavigation'
import { MaterialIcons } from '@expo/vector-icons'
import { Typography } from './Typography'

interface Props extends StackProps {
  title?: ReactNode
  rightAddon?: ReactNode
}

export function AppBar({ title, rightAddon, style, ...props }: Props) {
  const navigation = useAppNavigation()

  return (
    <Stack direction="row" alignItems="center" style={[styles.header, style]} {...props}>
      <Pressable
        accessibilityLabel="뒤로가기"
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <MaterialIcons name="arrow-back" size={22} color={palette.text} />
      </Pressable>
      <Stack style={styles.titleArea}>
        {typeof title === 'string' ? <Title>{title}</Title> : title}
      </Stack>
      {rightAddon}
    </Stack>
  )
}

AppBar.Title = Title
function Title(props: ComponentProps<typeof Typography>) {
  return <Typography variant="h6" {...props} />
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: palette.background },
  titleArea: { flex: 1, paddingHorizontal: 8, paddingVertical: 4 },
  backButton: { padding: 4 },
  title: { fontWeight: '900' },
})
