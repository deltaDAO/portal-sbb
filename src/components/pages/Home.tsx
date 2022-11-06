import React, { ReactElement, useEffect, useState } from 'react'
import styles from './Home.module.css'
import AssetList from '../organisms/AssetList'
import Button from '../atoms/Button'
import Permission from '../organisms/Permission'
import {
  generateBaseQuery,
  getFilterTerm,
  queryMetadata
} from '../../utils/aquarius'
import { DDO, Logger } from '@oceanprotocol/lib'
import { useUserPreferences } from '../../providers/UserPreferences'
import { useIsMounted } from '../../hooks/useIsMounted'
import { useCancelToken } from '../../hooks/useCancelToken'
import { SearchQuery } from '../../models/aquarius/SearchQuery'
import {
  SortDirectionOptions,
  SortOptions,
  SortTermOptions
} from '../../models/SortAndFilters'
import { BaseQueryParams } from '../../models/aquarius/BaseQueryParams'
import { PagedAssets } from '../../models/PagedAssets'
import HomeContent from '../organisms/HomeContent'
import Container from '../atoms/Container'
import { useAddressConfig } from '../../hooks/useAddressConfig'
import OnboardingSection from './Home/Onboarding'
import SectionTitle from '../molecules/SectionTitle'
import { graphql, useStaticQuery } from 'gatsby'
import PageHeader from './Home/Header'

function sortElements(items: DDO[], sorted: string[]) {
  items.sort(function (a, b) {
    return (
      sorted.indexOf(a.dataToken.toLowerCase()) -
      sorted.indexOf(b.dataToken.toLowerCase())
    )
  })
  return items
}

const NUMBER_OF_ASSETS_PER_PAGE = 9

const homePageContentQuery = graphql`
  query homePageContentQuery {
    content: allFile(
      filter: { relativePath: { eq: "promotionBanners.json" } }
    ) {
      edges {
        node {
          childContentJson {
            banners {
              title
              description
              link
              cta
              image {
                childImageSharp {
                  original {
                    src
                  }
                }
              }
            }
          }
        }
      }
    }
    featuredAssets: file(
      relativePath: { eq: "pages/index/featuredAssets.json" }
    ) {
      childIndexJson {
        title
        body
      }
    }
  }
`

interface HomeContent {
  content: {
    edges: {
      node: {
        childContentJson: {
          banners: {
            title: string
            description: string
            link: string
            cta: string
            image: { childImageSharp: { original: { src: string } } }
          }[]
        }
      }
    }[]
  }
  featuredAssets: {
    childIndexJson: {
      title: string
      body: string
    }
  }
}

export function SectionQueryResult({
  title,
  query,
  action,
  queryData,
  className,
  assetListClassName
}: {
  title: ReactElement | string
  query: SearchQuery
  action?: ReactElement
  queryData?: string[]
  className?: string
  assetListClassName?: string
}): ReactElement {
  const { chainIds } = useUserPreferences()
  const [result, setResult] = useState<any>()
  const [loading, setLoading] = useState<boolean>()
  const isMounted = useIsMounted()
  const newCancelToken = useCancelToken()
  useEffect(() => {
    async function init() {
      if (chainIds.length === 0) {
        const result: PagedAssets = {
          results: [],
          page: 0,
          totalPages: 0,
          totalResults: 0
        }
        setResult(result)
        setLoading(false)
      } else {
        try {
          setLoading(true)
          const result = await queryMetadata(query, newCancelToken())
          if (!isMounted()) return
          if (queryData && result?.totalResults > 0) {
            const sortedAssets = sortElements(result.results, queryData)
            const overflow = sortedAssets.length - NUMBER_OF_ASSETS_PER_PAGE
            sortedAssets.splice(sortedAssets.length - overflow, overflow)
            result.results = sortedAssets
          }
          setResult(result)
          setLoading(false)
        } catch (error) {
          Logger.error(error.message)
        }
      }
    }
    init()
  }, [chainIds.length, isMounted, newCancelToken, query, queryData])

  return (
    <section className={className || styles.section}>
      <h3>{title}</h3>
      <AssetList
        assets={result?.results}
        showPagination={false}
        isLoading={loading}
        className={assetListClassName}
      />
      {action && action}
    </section>
  )
}
interface FeaturedSection {
  title: string
  query: SearchQuery
}

export default function HomePage(): ReactElement {
  const [queryLatest, setQueryLatest] = useState<FeaturedSection[]>()
  const { chainIds } = useUserPreferences()
  const { featured, hasFeaturedAssets } = useAddressConfig()
  const { showOnboardingModule } = useUserPreferences()
  const data: HomeContent = useStaticQuery(homePageContentQuery)
  const { featuredAssets } = data

  useEffect(() => {
    const baseParams = {
      chainIds: chainIds,
      esPaginationOptions: { size: NUMBER_OF_ASSETS_PER_PAGE },
      sortOptions: {
        sortBy: SortTermOptions.Created,
        sortDirection: SortDirectionOptions.Ascending
      } as SortOptions
    } as BaseQueryParams

    const featuredSections = []
    const hasFeaturedAssetsConfigured = hasFeaturedAssets()

    for (const category of featured) {
      const queryParams = {
        esPaginationOptions: {
          size: hasFeaturedAssetsConfigured
            ? category.assets.length
            : NUMBER_OF_ASSETS_PER_PAGE
        },
        filters: hasFeaturedAssetsConfigured
          ? [getFilterTerm('_id', category.assets)]
          : undefined
      }
      featuredSections.push({
        title: category.title,
        query: generateBaseQuery({ ...baseParams, ...queryParams })
      })
    }
    if (featuredSections.length === 0)
      featuredSections.push({
        title: 'Recently Published',
        query: generateBaseQuery(baseParams)
      })
    setQueryLatest(featuredSections)
  }, [chainIds, featured, hasFeaturedAssets])

  return (
    <Permission eventType="browse">
      <>
        <PageHeader />
        {showOnboardingModule && (
          <section className={styles.content}>
            <OnboardingSection />
          </section>
        )}
        <Container>
          <SectionTitle {...featuredAssets.childIndexJson} />
          {queryLatest?.length > 0 &&
            queryLatest.map((section) => (
              <SectionQueryResult
                key={section.title}
                title={section.title}
                query={section.query}
              />
            ))}
          <Button
            className={styles.allAssetsButton}
            style="text"
            to="/search?sort=created&sortOrder=desc"
            arrow
          >
            All data sets and algorithms
          </Button>
        </Container>
        <section className={styles.content}>
          <HomeContent />
        </section>
      </>
    </Permission>
  )
}
