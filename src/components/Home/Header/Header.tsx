import { ReactElement, useCallback, useEffect, useState } from 'react'
import classNames from 'classnames/bind'
import styles from './Header.module.css'
import { animated, useSpringRef, useTransition } from 'react-spring'
import Container from '@components/@shared/atoms/Container'
import { useMarketMetadata } from '@context/MarketMetadata'
import SearchBar from '@components/Header/SearchBar'

const cx = classNames.bind(styles)
const CAROUSEL_SCROLL_TIMEOUT = 10000

const translateMovements = {
  fromTranslateLeft: 'translate3d(-100%,-50%,0)',
  fromTranslateRight: 'translate3d(100%,-50%,0)',
  leaveTranslateLeft: 'translate3d(50%,-50%,0)',
  leaveTranslateRight: 'translate3d(-50%,-50%,0)',
  startPosition: 'translate3d(0%,-50%,0)'
}

export default function PageHeader(): ReactElement {
  const carouselImages = require
    .context(
      '../../../../public/images/homeHeaderCarousel',
      false,
      /\.(png|jpe?g)$/
    )
    .keys()
    .filter((e) => e.startsWith('./'))
    .map((x) => x.replace('./', ''))

  const { siteContent } = useMarketMetadata()
  const { siteTitle, siteTagline } = siteContent

  const [index, setIndex] = useState(0)

  const { fromTranslateRight, leaveTranslateRight, startPosition } =
    translateMovements

  const scrollImage = useCallback(() => {
    setIndex((state) => (state + 1) % carouselImages?.length)
  }, [carouselImages])

  useEffect(() => {
    const timer = setTimeout(scrollImage, CAROUSEL_SCROLL_TIMEOUT)
    return () => {
      clearTimeout(timer)
    }
  }, [scrollImage, index])

  const transRef = useSpringRef()
  const moveAndFadeDiv = useTransition(index, {
    ref: transRef,
    keys: null,
    initial: {
      opacity: 1,
      transform: startPosition
    },
    from: {
      opacity: 0,
      transform: fromTranslateRight
    },
    enter: { opacity: 1, transform: startPosition },
    leave: {
      opacity: 0,
      transform: leaveTranslateRight
    },
    config: { mass: 1, tension: 170, friction: 26 }
  })
  useEffect(() => {
    transRef.start()
  }, [index, transRef])

  return (
    <header className={styles.header}>
      {moveAndFadeDiv((style, i) => (
        <animated.div key={carouselImages[i]} style={style}>
          <div className={styles.carouselImageContainer}>
            <img
              className={styles.image}
              src={`/images/homeHeaderCarousel/${carouselImages[i]}`}
              loading="eager"
            />
          </div>
        </animated.div>
      ))}
      <Container className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>{siteTitle}</h1>
          <p className={styles.body}>{siteTagline}</p>
          <div className={styles.search}>
            <SearchBar placeholder="Search for service offerings" />
          </div>
        </div>
      </Container>
      <div className={styles.carouselIndicators}>
        {carouselImages.map((image, i) => (
          <div
            key={image}
            className={cx({ indicator: true, active: index === i })}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </header>
  )
}
