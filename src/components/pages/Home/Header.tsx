import React, { ReactElement, useCallback, useEffect, useState } from 'react'
import classNames from 'classnames/bind'
import styles from './Header.module.css'
import { graphql, useStaticQuery } from 'gatsby'
import { useSiteMetadata } from '../../../hooks/useSiteMetadata'
import Container from '../../atoms/Container'
import { animated, useSpringRef, useTransition } from 'react-spring'

const cx = classNames.bind(styles)
const CAROUSEL_SCROLL_TIMEOUT = 10000

const homePageHeaderQuery = graphql`
  query homePageHeaderQuery {
    carousel: allFile(
      filter: { absolutePath: { regex: "/src/images/headerCarousel/" } }
      sort: { fields: [base] }
    ) {
      edges {
        node {
          childImageSharp {
            id
            original {
              src
            }
          }
        }
      }
    }
  }
`

interface HeaderContent {
  carousel: {
    edges: {
      node: {
        childImageSharp: {
          id: string
          original: {
            src: string
          }
        }
      }
    }[]
  }
}

const translateMovements = {
  fromTranslateLeft: 'translate3d(-100%,-50%,0)',
  fromTranslateRight: 'translate3d(100%,-50%,0)',
  leaveTranslateLeft: 'translate3d(50%,-50%,0)',
  leaveTranslateRight: 'translate3d(-50%,-50%,0)',
  startPosition: 'translate3d(0%,-50%,0)'
}

export default function PageHeader(): ReactElement {
  const data: HeaderContent = useStaticQuery(homePageHeaderQuery)
  const { carousel } = data
  const { siteTitle, siteTagline } = useSiteMetadata()

  const [index, setIndex] = useState(0)

  const { fromTranslateRight, leaveTranslateRight, startPosition } =
    translateMovements

  const scrollImage = useCallback(() => {
    setIndex((state) => (state + 1) % carousel.edges.length)
  }, [carousel.edges])

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
        <animated.div
          key={carousel.edges[i].node.childImageSharp.id}
          style={style}
        >
          <div className={styles.carouselImageContainer}>
            <img
              className={styles.image}
              src={carousel.edges[i].node.childImageSharp.original.src}
              loading="eager"
            />
          </div>
        </animated.div>
      ))}
      <Container className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>{siteTitle}</h1>
          <p className={styles.body}>{siteTagline}</p>
        </div>
      </Container>
      <div className={styles.carouselIndicators}>
        {carousel.edges.map((e, i) => (
          <div
            key={e.node.childImageSharp.id}
            className={cx({ indicator: true, active: index === i })}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </header>
  )
}
