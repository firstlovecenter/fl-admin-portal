/* eslint-disable jsx-a11y/alt-text */
import React from 'react'

export type LazyImageProps = {
  src: string
  size?: 'small' | 'large' | 'respond' | 'fullWidth'
  className?: string
  [key: string]: any
}

const LazyImage = ({ src, size, className, ...rest }: LazyImageProps) => {
  const getImageSrc = (url: string) => {
    if (!url) {
      // Default placeholder image
      return 'https://via.placeholder.com/150x150?text=No+Image'
    }
    return url
  }

  // const getSizeStyles = () => {
  //   switch (size) {
  //     case 'large':
  //       return { width: '300px', height: '300px' }
  //     case 'small':
  //       return { width: '150px', height: '150px' }
  //     case 'fullWidth':
  //       return { width: '100%', height: 'auto' }
  //     case 'respond':
  //       return { width: '100%', height: 'auto', maxWidth: '100%' }
  //     default:
  //       return { width: '150px', height: '150px' }
  //   }
  // }

  return (
    <div className={'image-container ' + className}>
      <img src={getImageSrc(src)} loading="lazy" {...rest} />
    </div>
  )
}

export default LazyImage

// Legacy export for backwards compatibility during migration
export { LazyImage as CloudinaryImage }
export type { LazyImageProps as CloudinaryImageProps }
