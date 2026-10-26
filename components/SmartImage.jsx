import Image from 'next/image';

export default function SmartImage({ src, alt, ...props }) {
  if (!src) return null;
  return <Image src={src} alt={alt ?? ''} width={1200} height={900} unoptimized {...props} />;
}
