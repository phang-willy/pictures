import Image from 'next/image'
import { appName } from '@/config/app-name';

export default function Logo() {
  return (
    <Image
      src="/logo.webp"
      alt={`Logo - ${appName}`}
      width={16}
      height={16}
      className="h-4 w-4"
      loading="lazy"
    />
  )
}