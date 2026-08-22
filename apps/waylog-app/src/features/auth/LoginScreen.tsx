import { signInWithEmail } from '@waylog/domains/clients'
import { useState } from 'react'
import { ActivityIndicator, Button, StyleSheet, Text, TextInput, View } from 'react-native'

export function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit() {
    setError(null)
    setIsPending(true)
    try {
      await signInWithEmail(email, password)
    } catch (e) {
      setError(e instanceof Error ? e.message : '로그인에 실패했습니다')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>WayLog</Text>
      <TextInput
        style={styles.input}
        placeholder="이메일"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="비밀번호"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error != null && <Text style={styles.error}>{error}</Text>}
      {isPending ? <ActivityIndicator /> : <Button title="로그인" onPress={handleSubmit} />}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: '600', marginBottom: 16, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  error: { color: '#c00' },
})
