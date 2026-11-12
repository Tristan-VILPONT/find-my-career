export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
      <rect width="64" height="64" rx="16" fill="#9a3412" />
      <path
        fill="#f6f1e8"
        d="M33 12.5c-7.2 0-12.2 4.4-12.4 10.1h6.2c.3-2.4 2.5-4.1 6.1-4.1 3.2 0 5.4 1.7 5.4 4.2 0 2.4-1.6 3.7-4.6 5.2l-1.5.8c-4 2-6.2 4.4-6.2 8.2v1.3h6.2v-1.1c0-2.1 1.1-3.4 4.7-5.2 4.1-2 7.2-4.6 7.2-9.3 0-5.8-4.7-10.1-11.1-10.1z"
      />
      <circle cx="32.2" cy="46.6" r="3.15" fill="#f6f1e8" />
      <rect x="7" y="52.5" width="50" height="7.2" rx="3.6" fill="#f6f1e8" />
      <circle cx="12.2" cy="56.1" r="2.15" fill="#1f7a4d" />
      <circle cx="18.6" cy="56.1" r="2.15" fill="#1d4ed8" />
      <circle cx="25" cy="56.1" r="2.15" fill="#be123c" />
      <circle cx="31.4" cy="56.1" r="2.15" fill="#6d28d9" />
      <circle cx="37.8" cy="56.1" r="2.15" fill="#92400e" />
      <circle cx="44.2" cy="56.1" r="2.15" fill="#0f766e" />
      <circle cx="50.6" cy="56.1" r="2.15" fill="#4338ca" />
    </svg>
  )
}
