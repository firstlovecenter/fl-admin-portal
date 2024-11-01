import React from 'react'
import { Cloudinary } from '@cloudinary/url-gen'
import {
  AdvancedImage,
  lazyload,
  responsive,
  placeholder,
} from '@cloudinary/react'
import { thumbnail, fill, scale } from '@cloudinary/url-gen/actions/resize'
import { focusOn } from '@cloudinary/url-gen/qualifiers/gravity'
import { FocusOn } from '@cloudinary/url-gen/qualifiers/focusOn'

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
  const getPublicId = (url: string) => {
    if (!url) {
      return 'v1627893621/user_qvwhs7webp'
    }

    return url.replace(
      'https://res.cloudinary.com/firstlovecenter/image/upload/',
      ''
    )
  }

  const dimensions = {
    height: size === 'large' ? 300 : 150,
    width: size === 'large' ? 300 : 150,
  }

  let plugins = [
    lazyload({ rootMargin: '10px 20px 10px 30px', threshold: 0.1 }),
    placeholder(),
  ]

  if (size === 'respond') {
    plugins = [
      lazyload({ rootMargin: '10px 20px 10px 30px', threshold: 0.1 }),
      responsive({ steps: [800, 1000, 1400] }),
      placeholder({ mode: 'blur' }),
    ]
  }

  const cld = new Cloudinary({
    cloud: {
      cloudName: 'firstlovecenter',
    },
  })
  const image = cld.image(getPublicId(src))

  switch (size) {
    case 'respond':
      image.resize(fill().gravity(focusOn(FocusOn.face())))
      break
    case 'large':
      image.resize(
        fill()
          .width(dimensions.width)
          .height(dimensions.height)
          .gravity(focusOn(FocusOn.face()))
      )
      break
    case 'small':
      image.resize(
        fill()
          .width(dimensions.width)
          .height(dimensions.height)
          .gravity(focusOn(FocusOn.face()))
      )
      break

    case 'fullWidth':
      image.resize(scale().width(dimensions.height))
      break
    default:
      image.resize(
        thumbnail()
          .width(dimensions.width)
          .height(dimensions.height)
          .zoom(0.7)
          .gravity(focusOn(FocusOn.face()))
      )
      break
  }

  return (
    <AdvancedImage
      cldImg={image}
      plugins={plugins}
      className={className}
      {...rest}
    />
  )
}

export default CloudinaryImage
