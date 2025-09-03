/* eslint-disable jsx-a11y/alt-text */
import React from 'react'

export type CloudinaryImageProps = {
  src: string
  size?: 'small' | 'large' | 'respond' | 'fullWidth'
  className?: string
  [key: string]: any
}

const CloudinaryImage = ({
  src,
  size,
  className,
  ...rest
}: CloudinaryImageProps) => {
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
    <img
      src={getImageSrc(src)}
      className={className}
      // style={defaultStyle}
      loading="lazy"
      {...rest}
    />
  )
}

export default CloudinaryImage
