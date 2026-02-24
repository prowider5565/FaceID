import { type ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary'
type ButtonSize = 'md' | 'sm'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
}

function Button({ variant = 'primary', size = 'md', fullWidth = false, className = '', ...props }: ButtonProps) {
  const classes = [
    'app-btn',
    `app-btn-${variant}`,
    `app-btn-${size}`,
    fullWidth ? 'app-btn-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <button className={classes} {...props} />
}

export default Button
