const { withEntitlementsPlist } = require('expo/config-plugins')

/**
 * Personal Team(무료 Apple ID)은 Push Notifications capability 를 지원하지 않는다.
 * expo-notifications 의 config plugin 은 autolinking 으로 자동 적용되어
 * app.config.ts 의 plugins 배열과 무관하게 aps-environment 를 주입하므로,
 * prebuild 파이프라인 마지막에서 걷어내야 서명이 통과한다.
 *
 * Apple Developer Program 으로 옮기면 이 플러그인만 제거하면 된다.
 */
module.exports = function withPersonalTeamSigning(config) {
  return withEntitlementsPlist(config, (entitlementsConfig) => {
    delete entitlementsConfig.modResults['aps-environment']
    return entitlementsConfig
  })
}
