import type {Terms} from '../api/onboarding.api'
export function TermsPanel({terms}:{terms:Terms}) {return <section aria-label="Điều khoản hợp tác" className="onboarding-terms"><h2>Điều khoản hợp tác · {terms.version}</h2><details><summary>Mã xác thực nội dung điều khoản</summary><code className="terms-hash">{terms.hash}</code></details><pre>{terms.content}</pre></section>}
