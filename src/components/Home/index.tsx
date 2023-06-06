import React, { ReactElement, useEffect, useState } from 'react'
import Button from '@shared/atoms/Button'
import { generateBaseQuery, getFilterTerm } from '@utils/aquarius'
import { useUserPreferences } from '@context/UserPreferences'
import { SortTermOptions } from '../../@types/aquarius/SearchQuery'
import SectionQueryResult from './SectionQueryResult'
import styles from './index.module.css'
import { useAddressConfig } from '@hooks/useAddressConfig'
import HomeContent from './Content'
import Header from './Header/Header'
import Container from '@components/@shared/atoms/Container'
import PoweredBy from './PoweredBy'

interface FeaturedSection {
  title: string
  query: SearchQuery
}

function AllAssetsButton(): ReactElement {
  return (
    <Button
      className={styles.allAssetsButton}
      style="text"
      to="/search?sort=nft.created&sortOrder=desc"
      arrow
    >
      All datasets and algorithms
    </Button>
  )
}

export default function HomePage(): ReactElement {
  const { chainIds } = useUserPreferences()
  const { featured, hasFeaturedAssets } = useAddressConfig()

  const [queryFeatured, setQueryFeatured] = useState<FeaturedSection[]>([])

  useEffect(() => {
    const baseParams = {
      chainIds,
      esPaginationOptions: {
        size: 6
      },
      sortOptions: {
        sortBy: SortTermOptions.Created
      } as SortOptions
    } as BaseQueryParams

    if (hasFeaturedAssets()) {
      const featuredSections = featured.map((section) => ({
        title: section.title,
        query: generateBaseQuery({
          ...baseParams,
          esPaginationOptions: {
            size: section.assets.length
          },
          filters: [getFilterTerm('_id', section.assets)]
        })
      }))

      setQueryFeatured(featuredSections)
    }
  }, [chainIds, featured, hasFeaturedAssets])

  return (
    <>
      <Header />
      <Container>
        {hasFeaturedAssets() && (
          <>
            {queryFeatured.map((section, i) => (
              <SectionQueryResult
                key={`${section.title}-${i}`}
                title={section.title}
                query={section.query}
              />
            ))}
            <AllAssetsButton />
          </>
        )}
        <HomeContent />
        <PoweredBy />
      </Container>
    </>
  )
}
