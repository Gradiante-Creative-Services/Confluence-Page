import thoughtfocusLogo from '../assets/thoughtfocus-logo.png'

interface BrandMarkProps {
  size?: 'sm' | 'md'
}

export function BrandMark({ size = 'md' }: BrandMarkProps) {
  return (
    <img
      src={thoughtfocusLogo}
      alt="ThoughtFocus"
      className={`brand-mark brand-mark-${size}`}
    />
  )
}
