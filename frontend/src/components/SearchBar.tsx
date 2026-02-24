import { type ChangeEvent, type FormEvent } from 'react'
import Button from './Button'

type SearchBarProps = {
  value: string
  onChange: (value: string) => void
  onSubmit?: () => void
  placeholder?: string
  ariaLabel?: string
  showSubmitButton?: boolean
  submitLabel?: string
}

function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search...',
  ariaLabel = 'Search',
  showSubmitButton = false,
  submitLabel = 'Search',
}: SearchBarProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit?.()
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value)
  }

  return (
    <form className="searchbar" onSubmit={handleSubmit} role="search">
      <input
        type="search"
        className="searchbar-input"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
      {showSubmitButton ? (
        <Button type="submit" variant="secondary" size="sm">
          {submitLabel}
        </Button>
      ) : null}
    </form>
  )
}

export default SearchBar
